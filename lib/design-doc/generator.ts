/**
 * 前端设计方案生成器
 * 整合飞书文档解析、AI 模型生成
 */

import { ModelManager } from '~/lib/ai/manager'
import { DesignDocDAO } from '~/lib/db/dao/design-doc-dao'
import { logger } from '~/lib/logger'
import { buildDesignDocPrompt, buildSystemPrompt, DESIGN_DOC_SYSTEM_PROMPT, DESIGN_DOC_TEMPLATE, isContentCompleteForTemplate } from './template'
import type { DesignDocument } from '~/types/design-doc'
import type { ImageInput } from '~/lib/ai/types'

export interface DesignDocGenerationOptions {
  model?: string
  temperature?: number
  maxTokens?: number
  userId: string
  workspaceId?: string
  additionalContext?: string
  skipSave?: boolean
  customTemplate?: string  // 自定义模板内容
  /** Images extracted from the Feishu document (for vision-capable models) */
  images?: ImageInput[]
}

export interface DesignDocGenerationResult {
  docId: string
  title: string
  content: string
  model: string
  tokenCount: number
  estimatedCost: number
  generationTime: number
  feishuDocTitle: string
}

export class DesignDocGenerator {
  private modelManager: ModelManager

  constructor(aiConfig?: Record<string, any>) {
    this.modelManager = new ModelManager(aiConfig)
  }

  private estimateTokens(text: string): number {
    const chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length
    const englishChars = text.length - chineseChars
    return Math.ceil(chineseChars / 2 + englishChars / 4)
  }

  /**
   * 检查文档是否完整（基于模板）
   */
  private isDesignDocComplete(content: string, template: string): boolean {
    return isContentCompleteForTemplate(content, template)
  }

  private static readonly MAX_CONTINUATIONS = 5

  /**
   * 流式生成设计方案（支持自动续写）
   * 当模型因 max_tokens 截断时，自动发送续写请求直到内容完整
   */
  async *generateStream(
    feishuDocContent: string,
    feishuDocTitle: string,
    feishuUrl: string,
    options: DesignDocGenerationOptions
  ): AsyncGenerator<string> {
    const modelId = options.model || this.modelManager.getDefaultModelId()
    const temperature = options.temperature || 0.7
    const maxTokens = options.maxTokens || 16384
    const template = options.customTemplate || DESIGN_DOC_TEMPLATE

    const modelAdapter = this.modelManager.getAdapter(modelId)
    if (!modelAdapter) {
      throw new Error(`模型 ${modelId} 不可用`)
    }

    const fullPrompt = buildDesignDocPrompt(
      feishuDocContent,
      feishuDocTitle,
      options.additionalContext,
      options.customTemplate
    )

    const systemPrompt = buildSystemPrompt(options.customTemplate)

    const startTime = Date.now()
    let content = ''

    // --- First generation pass ---
    const streamIterator = modelAdapter.generateStream(fullPrompt, {
      temperature,
      maxTokens,
      systemPrompt,
      images: options.images
    }) as unknown as AsyncIterable<string>

    for await (const chunk of streamIterator) {
      content += chunk
      yield chunk
    }

    // --- Continuation: auto-resume if model was cut off or output is incomplete ---
    logger.info(
      `[DesignDoc] First pass done: ${content.length} chars, lastStopReason=${modelAdapter.lastStopReason || 'N/A'}`
    )
    let continuations = 0
    while (
      (
        modelAdapter.lastStopReason === 'max_tokens' ||
        !this.isDesignDocComplete(content, template)
      ) &&
      continuations < DesignDocGenerator.MAX_CONTINUATIONS
    ) {
      continuations++
      const beforeLength = content.length
      logger.info(
        `[DesignDoc] Continuation #${continuations}: len=${content.length}, stop_reason=${modelAdapter.lastStopReason || 'N/A'}, complete=${this.isDesignDocComplete(content, template)}`
      )

      const continueStream = modelAdapter.generateStream(
        '请继续生成，从上次停止的地方继续输出，不要重复已生成的内容，不要添加任何引言。',
        {
          temperature,
          maxTokens,
          systemPrompt,
          messages: [
            { role: 'user', content: fullPrompt },
            { role: 'assistant', content },
            { role: 'user', content: '请继续生成，从上次停止的地方继续输出，不要重复已生成的内容，不要添加任何引言。' }
          ]
        }
      ) as unknown as AsyncIterable<string>

      for await (const chunk of continueStream) {
        content += chunk
        yield chunk
      }

      // 模型若未继续输出，避免无效循环
      if (content.length <= beforeLength) {
        logger.warn('[DesignDoc] Continuation produced no new content, stopping continuation loop')
        break
      }
    }

    if (continuations > 0) {
      logger.info(
        `[DesignDoc] Generation complete after ${continuations} continuation(s), total ${content.length} chars`
      )
    }

    if (!options.skipSave) {
      const generationTime = Date.now() - startTime
      const estimatedTokens = this.estimateTokens(
        fullPrompt + DESIGN_DOC_SYSTEM_PROMPT + content
      )
      const costEstimate = this.modelManager.estimateCost(modelId, estimatedTokens)

      const designDoc: Omit<DesignDocument, 'id' | 'createdAt' | 'updatedAt'> = {
        userId: options.userId,
        workspaceId: options.workspaceId,
        title: `前端设计方案 - ${feishuDocTitle}`,
        feishuUrl,
        feishuDocTitle,
        feishuDocContent,
        content,
        modelUsed: modelId,
        generationTime,
        tokenCount: estimatedTokens,
        estimatedCost: costEstimate?.inputCost || 0,
        status: 'completed',
        metadata: { temperature, maxTokens, customTemplate: options.customTemplate }
      }

      try {
        const saved = await DesignDocDAO.create(designDoc)
        logger.info({ docId: saved.id }, '[DesignDoc] 设计方案已保存')
      } catch (err) {
        logger.error({ err }, '[DesignDoc] 保存设计方案失败')
      }
    }
  }

  /**
   * 保存生成结果到数据库（与流式生成分离）
   */
  async saveResult(
    content: string,
    feishuDocContent: string,
    feishuDocTitle: string,
    feishuUrl: string,
    options: DesignDocGenerationOptions
  ): Promise<void> {
    const modelId = options.model || this.modelManager.getDefaultModelId()
    const estimatedTokens = this.estimateTokens(content + feishuDocContent)
    const costEstimate = this.modelManager.estimateCost(modelId, estimatedTokens)

    const designDoc: Omit<DesignDocument, 'id' | 'createdAt' | 'updatedAt'> = {
      userId: options.userId,
      workspaceId: options.workspaceId,
      title: `前端设计方案 - ${feishuDocTitle}`,
      feishuUrl,
      feishuDocTitle,
      feishuDocContent,
      content,
      modelUsed: modelId,
      generationTime: 0,
      tokenCount: estimatedTokens,
      estimatedCost: costEstimate?.inputCost || 0,
      status: 'completed',
      metadata: { temperature: options.temperature, maxTokens: options.maxTokens, customTemplate: options.customTemplate }
    }

    const saved = await DesignDocDAO.create(designDoc)
    logger.info({ docId: saved.id }, '[DesignDoc] 设计方案已保存')
  }

  /**
   * 非流式生成
   */
  async generate(
    feishuDocContent: string,
    feishuDocTitle: string,
    feishuUrl: string,
    options: DesignDocGenerationOptions
  ): Promise<DesignDocGenerationResult> {
    const modelId = options.model || this.modelManager.getDefaultModelId()
    const temperature = options.temperature || 0.7
    const maxTokens = options.maxTokens || 16384
    const _template = options.customTemplate || DESIGN_DOC_TEMPLATE

    const modelAdapter = this.modelManager.getAdapter(modelId)
    if (!modelAdapter) {
      throw new Error(`模型 ${modelId} 不可用`)
    }

    const fullPrompt = buildDesignDocPrompt(
      feishuDocContent,
      feishuDocTitle,
      options.additionalContext,
      options.customTemplate
    )

    const systemPrompt = buildSystemPrompt(options.customTemplate)

    const startTime = Date.now()
    let content = await modelAdapter.generateText(fullPrompt, {
      temperature,
      maxTokens,
      systemPrompt,
      images: options.images
    })

    // Non-stream continuation: if model was cut off, send follow-up requests
    let continuations = 0
    while (
      modelAdapter.lastStopReason === 'max_tokens' &&
      continuations < DesignDocGenerator.MAX_CONTINUATIONS
    ) {
      continuations++
      logger.info(`[DesignDoc] Non-stream continuation #${continuations}`)
      const more = await modelAdapter.generateText(
        '请继续生成，从上次停止的地方继续输出，不要重复已生成的内容。',
        {
          temperature,
          maxTokens,
          systemPrompt,
          messages: [
            { role: 'user', content: fullPrompt },
            { role: 'assistant', content },
            { role: 'user', content: '请继续生成，从上次停止的地方继续输出，不要重复已生成的内容。' }
          ]
        }
      )
      content += more
    }

    const generationTime = Date.now() - startTime
    const estimatedTokens = this.estimateTokens(
      fullPrompt + DESIGN_DOC_SYSTEM_PROMPT + content
    )
    const costEstimate = this.modelManager.estimateCost(modelId, estimatedTokens)

    const designDoc: Omit<DesignDocument, 'id' | 'createdAt' | 'updatedAt'> = {
      userId: options.userId,
      workspaceId: options.workspaceId,
      title: `前端设计方案 - ${feishuDocTitle}`,
      feishuUrl,
      feishuDocTitle,
      feishuDocContent,
      content,
      modelUsed: modelId,
      generationTime,
      tokenCount: estimatedTokens,
      estimatedCost: costEstimate?.inputCost || 0,
      status: 'completed',
      metadata: { temperature, maxTokens, customTemplate: options.customTemplate }
    }

    const saved = await DesignDocDAO.create(designDoc)

    return {
      docId: saved.id,
      title: saved.title,
      content: saved.content,
      model: modelId,
      tokenCount: estimatedTokens,
      estimatedCost: costEstimate?.inputCost || 0,
      generationTime,
      feishuDocTitle
    }
  }
}
