/**
 * 流式生成前端设计方案
 * POST /api/v1/design-doc/stream
 */

import { FeishuClient } from '~/lib/feishu/client'
import { FeishuDocumentParser } from '~/lib/feishu/document-parser'
import { DesignDocGenerator } from '~/lib/design-doc/generator'
import { getModelManager } from '~/lib/ai/manager'
import type { DesignDocGenerateRequest } from '~/types/design-doc'

const MIN_VALID_CONTENT_LENGTH = 500
const MAX_RETRIES = 2

export default defineEventHandler(async (event) => {
  try {
    const userId = requireAuth(event)
    const body = await readBody<DesignDocGenerateRequest>(event)

    if (!body.feishuUrl) {
      setResponseStatus(event, 400)
      return { success: false, message: '请提供飞书文档链接' }
    }

    const runtimeConfig = useRuntimeConfig()
    const appId = runtimeConfig.feishuAppId as string
    const appSecret = runtimeConfig.feishuAppSecret as string

    if (!appId || !appSecret) {
      setResponseStatus(event, 500)
      return { success: false, message: '飞书应用未配置' }
    }

    // 解析飞书文档
    const client = new FeishuClient(appId, appSecret)
    const parser = new FeishuDocumentParser(client)

    let feishuDoc
    try {
      feishuDoc = await parser.parseFromUrl(body.feishuUrl)
    } catch (err: any) {
      setResponseStatus(event, 502)
      return { success: false, message: `飞书文档解析失败: ${err.message}` }
    }

    // 设置 SSE 响应头
    setHeader(event, 'Content-Type', 'text/event-stream')
    setHeader(event, 'Cache-Control', 'no-cache')
    setHeader(event, 'Connection', 'keep-alive')

    event.node.res.write(
      `data: ${JSON.stringify({
        type: 'doc_parsed',
        title: feishuDoc.title,
        contentLength: feishuDoc.content.length,
        imageCount: feishuDoc.images?.length || 0
      })}\n\n`
    )

    const config: Record<string, any> = {
      anthropicApiKey: runtimeConfig.anthropicApiKey,
      anthropicBaseUrl: runtimeConfig.anthropicBaseUrl,
      openaiApiKey: runtimeConfig.openaiApiKey,
      googleApiKey: runtimeConfig.googleApiKey,
      glmApiKey: runtimeConfig.glmApiKey,
      dashscopeApiKey: runtimeConfig.dashscopeApiKey,
      baiduApiKey: runtimeConfig.baiduApiKey,
      deepseekApiKey: runtimeConfig.deepseekApiKey,
      ollamaBaseUrl: runtimeConfig.ollamaBaseUrl
    }

    const modelManager = getModelManager(config)
    const modelId = body.modelId || modelManager.getDefaultModelId()

    const selectedModel = modelManager.getAdapter(modelId)
    if (!selectedModel) {
      event.node.res.write(
        `data: ${JSON.stringify({ type: 'error', message: '所选模型不可用' })}\n\n`
      )
      event.node.res.end()
      return
    }

    const generationOpts = {
      model: modelId,
      temperature: body.temperature,
      maxTokens: body.maxTokens || 16384,
      userId,
      workspaceId: body.workspaceId,
      additionalContext: body.additionalContext,
      customTemplate: body.customTemplate,
      images: feishuDoc.images?.map((img: { base64: string; mediaType: string }) => ({
        base64: img.base64,
        mediaType: img.mediaType
      }))
    }

    let attempt = 0
    let fullContent = ''

    while (attempt <= MAX_RETRIES) {
      attempt++
      fullContent = ''

      const generator = new DesignDocGenerator(config)
      const streamIterator = generator.generateStream(
        feishuDoc.content,
        feishuDoc.title,
        body.feishuUrl,
        { ...generationOpts, skipSave: true }
      )

      for await (const chunk of streamIterator) {
        if (chunk) {
          fullContent += chunk
          event.node.res.write(
            `data: ${JSON.stringify({ type: 'chunk', chunk })}\n\n`
          )
        }
      }

      if (fullContent.length >= MIN_VALID_CONTENT_LENGTH) {
        break
      }

      // 内容过短，可能是模型给了会话式回复而非实际文档
      console.warn(`[DesignDoc] Attempt ${attempt}: content too short (${fullContent.length} chars), retrying...`)

      if (attempt <= MAX_RETRIES) {
        event.node.res.write(
          `data: ${JSON.stringify({ type: 'retry', attempt, message: '正在重新生成...' })}\n\n`
        )
        fullContent = ''
      }
    }

    // 保存最终结果
    if (fullContent.length >= MIN_VALID_CONTENT_LENGTH) {
      try {
        const generator = new DesignDocGenerator(config)
        await generator.saveResult(
          fullContent,
          feishuDoc.content,
          feishuDoc.title,
          body.feishuUrl,
          generationOpts
        )
      } catch (saveErr) {
        console.error('[DesignDoc] Save error:', saveErr)
      }
    }

    event.node.res.write(
      `data: ${JSON.stringify({ type: 'done', feishuDocTitle: feishuDoc.title })}\n\n`
    )
    event.node.res.end()
  } catch (error) {
    console.error('[DesignDoc] Stream generation error:', error)
    setResponseStatus(event, 500)
    return {
      success: false,
      message: error instanceof Error ? error.message : '生成失败'
    }
  }
})
