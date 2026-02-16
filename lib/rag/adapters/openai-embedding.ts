/**
 * OpenAI Embedding 适配器
 * 使用 OpenAI 的 text-embedding 模型进行文本向量化
 */

import { OpenAI } from 'openai'
import type { IEmbeddingAdapter, EmbeddingModelInfo, EmbeddingCostEstimate } from '../embedding-adapter'

export class OpenAIEmbeddingAdapter implements IEmbeddingAdapter {
  private client: OpenAI
  private modelId: string
  private batchSize: number = 10 // 批量请求的大小

  constructor(apiKey: string, modelId: string = 'text-embedding-3-small') {
    this.client = new OpenAI({ apiKey })
    this.modelId = modelId
  }

  async embed(text: string): Promise<number[]> {
    const embeddings = await this.embedMany([text])
    return embeddings[0]
  }

  async embedMany(texts: string[]): Promise<number[][]> {
    if (texts.length === 0) {
      return []
    }

    // 清理文本 - 移除换行符和多余空格
    const cleanedTexts = texts.map(t => 
      t.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim()
    )

    // 分批请求（OpenAI 有限制）
    const embeddings: number[][] = []

    for (let i = 0; i < cleanedTexts.length; i += this.batchSize) {
      const batch = cleanedTexts.slice(i, i + this.batchSize)

      try {
        const response = await this.client.embeddings.create({
          model: this.modelId,
          input: batch,
          encoding_format: 'float'
        })

        // 按原始顺序排序
        const batchEmbeddings = response.data
          .sort((a, b) => a.index - b.index)
          .map(item => item.embedding as number[])
        
        embeddings.push(...batchEmbeddings)
      } catch (error) {
        console.error('OpenAI embedding API error:', error)
        throw new Error(`Failed to generate embeddings: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }

    return embeddings
  }

  calculateCost(tokenCount: number): EmbeddingCostEstimate {
    // OpenAI Embedding 定价（2026年）
    // text-embedding-3-small: $0.02 per 1M tokens
    // text-embedding-3-large: $0.13 per 1M tokens
    // text-embedding-ada-002: $0.10 per 1M tokens
    
    let pricePerMillion = 0.02 // 默认使用 text-embedding-3-small 的价格
    
    if (this.modelId.includes('large')) {
      pricePerMillion = 0.13
    } else if (this.modelId.includes('ada-002')) {
      pricePerMillion = 0.10
    }

    const inputCost = (tokenCount / 1_000_000) * pricePerMillion

    return {
      inputCost,
      currency: 'USD'
    }
  }

  getModelInfo(): EmbeddingModelInfo {
    // 根据模型 ID 确定维度
    let dimensions = 1536 // text-embedding-3-small 默认维度
    let maxInputTokens = 8191

    if (this.modelId.includes('3-large')) {
      dimensions = 3072
    } else if (this.modelId.includes('ada-002')) {
      dimensions = 1536
    }

    return {
      modelId: this.modelId,
      dimensions,
      maxInputTokens,
      provider: 'openai'
    }
  }

  async isAvailable(): Promise<boolean> {
    try {
      // 使用一个简单的测试文本验证 API 是否可用
      await this.embed('test')
      return true
    } catch (error) {
      console.error('OpenAI embedding availability check failed:', error)
      return false
    }
  }
}
