/**
 * 对话引擎
 * 组装对话上下文（系统提示词 + 历史消息 + RAG 检索）并调用 AI 模型
 */

import { ModelManager } from '~/lib/ai/manager'
import { RAGRetriever } from '~/lib/rag/retriever'
import { buildConversationalPrompt } from '~/lib/ai/prompts/conversation-system'
import type { ChatMessage } from '~/lib/ai/types'
import type { ConversationMessage } from '~/types/conversation'
import type { IEmbeddingAdapter } from '~/lib/rag/embedding-adapter'

export interface ChatStreamOptions {
  modelId?: string
  temperature?: number
  maxTokens?: number
  useRAG?: boolean
  topK?: number
}

const MAX_HISTORY_MESSAGES = 20

export class ChatEngine {
  private modelManager: ModelManager
  private ragRetriever: RAGRetriever | null = null

  constructor (embeddingAdapter?: IEmbeddingAdapter, aiConfig?: Record<string, any>) {
    this.modelManager = new ModelManager(aiConfig)
    if (embeddingAdapter) {
      this.ragRetriever = new RAGRetriever(embeddingAdapter)
    }
  }

  /**
   * 将前端 ConversationMessage[] 转换为 ChatMessage[]
   */
  private buildMessages (
    history: ConversationMessage[],
    currentMessage: string,
    systemPrompt: string
  ): ChatMessage[] {
    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt }
    ]

    // 限制历史消息数量，防止超出上下文窗口
    const recentHistory = history.slice(-MAX_HISTORY_MESSAGES)

    for (const msg of recentHistory) {
      messages.push({
        role: msg.role,
        content: msg.content
      })
    }

    // 添加当前用户消息
    messages.push({ role: 'user', content: currentMessage })

    return messages
  }

  /**
   * 流式对话生成
   */
  async * chatStream (
    currentMessage: string,
    history: ConversationMessage[],
    options?: ChatStreamOptions
  ): AsyncGenerator<string> {
    const modelId = options?.modelId || 'glm-4.7'
    const temperature = options?.temperature || 0.7
    const maxTokens = options?.maxTokens || 8000
    const useRAG = options?.useRAG === true
    const topK = options?.topK || 5

    const modelAdapter = this.modelManager.getAdapter(modelId)
    if (!modelAdapter) {
      throw new Error(`Model ${modelId} not available`)
    }

    // RAG 检索
    let backgroundContext = ''
    if (useRAG && this.ragRetriever) {
      const retrievedChunks = await this.ragRetriever.retrieve(currentMessage, { topK, threshold: 0.3 })
      if (retrievedChunks.length > 0) {
        backgroundContext = this.ragRetriever.summarizeResults(retrievedChunks)
      }
    }

    // 构建系统提示词（含 RAG 上下文）
    const systemPrompt = buildConversationalPrompt(backgroundContext)

    // 构建完整的 messages 数组
    const messages = this.buildMessages(history, currentMessage, systemPrompt)

    // 调用模型流式生成
    const streamIterator = modelAdapter.generateStream('', {
      temperature,
      maxTokens,
      messages
    }) as unknown as AsyncIterable<string>

    for await (const chunk of streamIterator) {
      yield chunk
    }
  }
}
