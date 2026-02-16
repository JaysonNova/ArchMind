/**
 * PRD 生成引擎
 * 整合 RAG 检索、AI 模型、提示词工程，实现完整的 PRD 生成流程
 */

import { ModelManager } from '~/lib/ai/manager'
import { RAGRetriever } from '~/lib/rag/retriever'
import { buildPRDPrompt } from '~/lib/ai/prompts/prd-system'
import { PRDDAO } from '~/lib/db/dao/prd-dao'
import { DocumentDAO } from '~/lib/db/dao/document-dao'
import type { PRDDocument } from '~/types/prd'
import type { IEmbeddingAdapter } from '~/lib/rag/embedding-adapter'

export interface PRDGenerationOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  useRAG?: boolean;
  documentIds?: string[];
  topK?: number;
}

export interface PRDGenerationResult {
  prdId: string;
  title: string;
  content: string;
  model: string;
  tokenCount: number;
  estimatedCost: number;
  generationTime: number;
  references: string[]; // 引用的文档 ID
}

export class PRDGenerator {
  private modelManager: ModelManager
  private ragRetriever: RAGRetriever | null = null

  constructor (embeddingAdapter?: IEmbeddingAdapter, aiConfig?: Record<string, any>) {
    // 使用提供的配置或创建一个新的 ModelManager
    this.modelManager = new ModelManager(aiConfig)

    // 如果提供了 embedding 适配器，则初始化 RAG 检索器
    if (embeddingAdapter) {
      this.ragRetriever = new RAGRetriever(embeddingAdapter)
    }
  }

  /**
   * 生成 PRD（非流式）
   */
  async generate (
    userInput: string,
    options?: PRDGenerationOptions
  ): Promise<PRDGenerationResult> {
    const startTime = Date.now()
    const modelId = options?.model || 'claude-3.5-sonnet'
    const temperature = options?.temperature || 0.7
    const maxTokens = options?.maxTokens || 8000
    const useRAG = options?.useRAG === true // 明确要求传 true 才启用
    const topK = options?.topK || 5

    const modelAdapter = this.modelManager.getAdapter(modelId)
    if (!modelAdapter) {
      throw new Error(`Model ${modelId} not available`)
    }

    // 构建上下文
    let backgroundContext = ''
    let references: string[] = []

    if (useRAG && this.ragRetriever) {
      // 使用 RAG 检索相关文档
      const retrievedChunks = await this.ragRetriever.retrieve(userInput, { topK, threshold: 0.7 })

      if (retrievedChunks.length > 0) {
        backgroundContext = this.ragRetriever.summarizeResults(retrievedChunks)
        references = Array.from(new Set(retrievedChunks.map(c => c.documentId)))
      }
    } else if (options?.documentIds && options.documentIds.length > 0) {
      // 使用指定的文档
      const docs = await Promise.all(
        options.documentIds.map(id => DocumentDAO.findById(id))
      )

      backgroundContext = docs
        .filter(d => d !== null)
        .map(d => d!.content || '')
        .filter(c => c.length > 0)
        .join('\n\n---\n\n')

      references = options.documentIds
    }

    // 构建最终提示词
    const fullPrompt = buildPRDPrompt(userInput, backgroundContext)

    // 调用 AI 模型生成
    const content = await modelAdapter.generateText(fullPrompt, {
      temperature,
      maxTokens,
      systemPrompt: undefined
    })

    // 估算成本（简化计算）
    const estimatedTokens = Math.ceil((userInput.length + backgroundContext.length + content.length) / 4)
    const costEstimate = this.modelManager.estimateCost(modelId, estimatedTokens)

    // 保存到数据库
    const prd: Omit<PRDDocument, 'id' | 'createdAt' | 'updatedAt'> = {
      title: `PRD - ${new Date().toISOString().split('T')[0]}`,
      content,
      userInput,
      modelUsed: modelId,
      generationTime: Date.now() - startTime,
      tokenCount: estimatedTokens,
      estimatedCost: costEstimate?.inputCost || 0,
      status: 'completed',
      metadata: {
        useRAG,
        temperature,
        maxTokens
      }
    }

    const savedPRD = await PRDDAO.create(prd)

    // 添加文档引用
    if (references.length > 0) {
      await PRDDAO.addReferences(savedPRD.id, references)
    }

    return {
      prdId: savedPRD.id,
      title: savedPRD.title,
      content: savedPRD.content,
      model: modelId,
      tokenCount: estimatedTokens,
      estimatedCost: costEstimate?.inputCost || 0,
      generationTime: Date.now() - startTime,
      references
    }
  }

  /**
   * 流式生成 PRD
   */
  async *generateStream (
    userInput: string,
    options?: PRDGenerationOptions
  ): AsyncIterator<string> {
    const modelId = options?.model || 'claude-3.5-sonnet'
    const temperature = options?.temperature || 0.7
    const maxTokens = options?.maxTokens || 8000
    const useRAG = options?.useRAG === true // 明确要求传 true 才启用
    const topK = options?.topK || 5

    const modelAdapter = this.modelManager.getAdapter(modelId)
    if (!modelAdapter) {
      throw new Error(`Model ${modelId} not available`)
    }

    // 构建上下文
    let backgroundContext = ''
    const references: string[] = []

    if (useRAG && this.ragRetriever) {
      // 使用 RAG 检索相关文档
      const retrievedChunks = await this.ragRetriever.retrieve(userInput, { topK, threshold: 0.7 })

      if (retrievedChunks.length > 0) {
        backgroundContext = this.ragRetriever.summarizeResults(retrievedChunks)
        references.push(...Array.from(new Set(retrievedChunks.map(c => c.documentId))))
      }
    } else if (options?.documentIds && options.documentIds.length > 0) {
      // 使用指定的文档
      const docs = await Promise.all(
        options.documentIds.map(id => DocumentDAO.findById(id))
      )

      backgroundContext = docs
        .filter(d => d !== null)
        .map(d => d!.content || '')
        .filter(c => c.length > 0)
        .join('\n\n---\n\n')

      references.push(...options.documentIds)
    }

    // 构建最终提示词
    const fullPrompt = buildPRDPrompt(userInput, backgroundContext)

    // 流式生成内容
    const startTime = Date.now()
    let content = ''

    const streamIterator = modelAdapter.generateStream(fullPrompt, {
      temperature,
      maxTokens
    }) as unknown as AsyncIterable<string>

    for await (const chunk of streamIterator) {
      content += chunk
      yield chunk
    }

    // 异步保存到数据库（不阻塞流式响应）
    const generationTime = Date.now() - startTime
    const estimatedTokens = Math.ceil((userInput.length + backgroundContext.length + content.length) / 4)
    const costEstimate = this.modelManager.estimateCost(modelId, estimatedTokens)

    const prd: Omit<PRDDocument, 'id' | 'createdAt' | 'updatedAt'> = {
      title: `PRD - ${new Date().toISOString().split('T')[0]}`,
      content,
      userInput,
      modelUsed: modelId,
      generationTime,
      tokenCount: estimatedTokens,
      estimatedCost: costEstimate?.inputCost || 0,
      status: 'completed'
    }

    const savedPRD = await PRDDAO.create(prd)

    // 添加文档引用
    if (references.length > 0) {
      await PRDDAO.addReferences(savedPRD.id, references)
    }
  }
}

