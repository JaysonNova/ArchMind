/**
 * 原型图生成引擎
 * 复用 ModelManager 和 ChatEngine 的架构模式
 */

import { ModelManager } from '~/lib/ai/manager'
import { RAGRetriever } from '~/lib/rag/retriever'
import {
  buildPrototypeFromPRDPrompt,
  buildPrototypeConversationalPrompt
} from '~/lib/ai/prompts/prototype-system'
import type { ChatMessage } from '~/lib/ai/types'
import type { ConversationMessage } from '~/types/conversation'
import type { IEmbeddingAdapter } from '~/lib/rag/embedding-adapter'

export interface PrototypeGenerateOptions {
  modelId?: string
  temperature?: number
  maxTokens?: number
  useRAG?: boolean
  pageCount?: number
}

export interface ParsedPrototypePage {
  pageSlug: string
  pageName: string
  htmlContent: string
}

const MAX_HISTORY_MESSAGES = 10

export class PrototypeGenerator {
  private modelManager: ModelManager
  private ragRetriever: RAGRetriever | null = null

  constructor (embeddingAdapter?: IEmbeddingAdapter, aiConfig?: Record<string, any>) {
    this.modelManager = new ModelManager(aiConfig)
    if (embeddingAdapter) {
      this.ragRetriever = new RAGRetriever(embeddingAdapter)
    }
  }

  /**
   * 从 PRD 内容流式生成原型 HTML
   */
  async * generateFromPRD (
    prdContent: string,
    options?: PrototypeGenerateOptions
  ): AsyncGenerator<string> {
    const modelId = options?.modelId || 'glm-4.7'
    const adapter = this.modelManager.getAdapter(modelId)
    if (!adapter) throw new Error(`Model ${modelId} not available`)

    const prompt = buildPrototypeFromPRDPrompt(prdContent, options?.pageCount)

    const stream = adapter.generateStream(prompt, {
      temperature: options?.temperature || 0.3,
      maxTokens: options?.maxTokens || 16000
    }) as unknown as AsyncIterable<string>

    for await (const chunk of stream) {
      yield chunk
    }
  }

  /**
   * 对话式编辑原型（支持历史消息上下文）
   */
  async * editByConversation (
    message: string,
    history: ConversationMessage[],
    options?: {
      modelId?: string
      temperature?: number
      maxTokens?: number
      useRAG?: boolean
      currentHtml?: string
      prdContent?: string
    }
  ): AsyncGenerator<string> {
    const modelId = options?.modelId || 'glm-4.7'
    const adapter = this.modelManager.getAdapter(modelId)
    if (!adapter) throw new Error(`Model ${modelId} not available`)

    // RAG 检索
    let backgroundContext = ''
    if (options?.useRAG && this.ragRetriever) {
      const chunks = await this.ragRetriever.retrieve(message, { topK: 5, threshold: 0.7 })
      if (chunks.length > 0) {
        backgroundContext = this.ragRetriever.summarizeResults(chunks)
      }
    }

    const systemPrompt = buildPrototypeConversationalPrompt(backgroundContext)

    // 构建 messages 数组
    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt }
    ]

    // 如果有当前 HTML 上下文，注入
    if (options?.currentHtml) {
      messages.push({
        role: 'system',
        content: `当前正在编辑的 HTML 原型内容：\n\`\`\`html\n${options.currentHtml}\n\`\`\``
      })
    }

    if (options?.prdContent) {
      messages.push({
        role: 'system',
        content: `关联的 PRD 文档内容：\n${options.prdContent}`
      })
    }

    // 添加历史消息（限制最近 N 条）
    const recentHistory = history.slice(-MAX_HISTORY_MESSAGES)
    for (const msg of recentHistory) {
      messages.push({ role: msg.role, content: msg.content })
    }

    messages.push({ role: 'user', content: message })

    const stream = adapter.generateStream('', {
      temperature: options?.temperature || 0.3,
      maxTokens: options?.maxTokens || 16000,
      messages
    }) as unknown as AsyncIterable<string>

    for await (const chunk of stream) {
      yield chunk
    }
  }

  /**
   * 解析 AI 输出中的多页面内容
   */
  static parseMultiPageOutput (fullOutput: string): ParsedPrototypePage[] {
    const pages: ParsedPrototypePage[] = []
    const pageRegex = /<!-- PAGE:(\w[\w-]*):(.+?) -->/g
    let match: RegExpExecArray | null
    const markers: Array<{ index: number; endIndex: number; slug: string; name: string }> = []

    while ((match = pageRegex.exec(fullOutput)) !== null) {
      markers.push({
        index: match.index,
        endIndex: match.index + match[0].length,
        slug: match[1],
        name: match[2].trim()
      })
    }

    if (markers.length === 0) {
      // 单页面模式：尝试从代码块中提取 HTML
      const htmlMatch = fullOutput.match(/```html\s*\n([\s\S]*?)```/)
      let htmlContent = htmlMatch ? htmlMatch[1].trim() : fullOutput.trim()

      // 确保以 <!DOCTYPE 开头
      if (!htmlContent.startsWith('<!DOCTYPE') && !htmlContent.startsWith('<html')) {
        const docIdx = htmlContent.indexOf('<!DOCTYPE')
        if (docIdx > -1) {
          htmlContent = htmlContent.slice(docIdx)
        }
      }

      if (htmlContent) {
        pages.push({
          pageSlug: 'index',
          pageName: '首页',
          htmlContent
        })
      }
    } else {
      for (let i = 0; i < markers.length; i++) {
        const start = markers[i].endIndex
        const end = i < markers.length - 1 ? markers[i + 1].index : fullOutput.length
        let htmlContent = fullOutput.slice(start, end).trim()

        // 去掉代码块标记
        const codeBlockMatch = htmlContent.match(/```html\s*\n([\s\S]*?)```/)
        if (codeBlockMatch) {
          htmlContent = codeBlockMatch[1].trim()
        }

        // 确保以 <!DOCTYPE 开头
        if (!htmlContent.startsWith('<!DOCTYPE') && !htmlContent.startsWith('<html')) {
          const docIdx = htmlContent.indexOf('<!DOCTYPE')
          if (docIdx > -1) {
            htmlContent = htmlContent.slice(docIdx)
          }
        }

        if (htmlContent) {
          pages.push({
            pageSlug: markers[i].slug,
            pageName: markers[i].name,
            htmlContent
          })
        }
      }
    }

    return pages
  }

  /**
   * 从 AI 对话回复中提取 HTML 代码块
   */
  static extractHtmlFromResponse (content: string): string | null {
    const match = content.match(/```html\s*\n([\s\S]*?)```/)
    return match ? match[1].trim() : null
  }
}
