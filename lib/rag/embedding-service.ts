/**
 * 向量化服务
 * 使用 OpenAI 的 embedding API 将文本转换为向量
 */

import { OpenAI } from 'openai'

export class EmbeddingService {
  private client: OpenAI
  private modelId: string
  private batchSize: number = 10 // 批量请求的大小

  constructor (apiKey: string, modelId: string = 'text-embedding-3-small') {
    this.client = new OpenAI({ apiKey })
    this.modelId = modelId
  }

  /**
   * 获取单个文本的向量
   */
  async embed (text: string): Promise<number[]> {
    const embeddings = await this.embedMany([text])
    return embeddings[0]
  }

  /**
   * 批量获取文本的向量
   */
  async embedMany (texts: string[]): Promise<number[][]> {
    if (texts.length === 0) { return [] }

    // 清理文本 - 移除换行符和多余空格
    const cleanedTexts = texts.map(t => t.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim())

    // 分批请求（OpenAI 有限制）
    const embeddings: number[][] = []

    for (let i = 0; i < cleanedTexts.length; i += this.batchSize) {
      const batch = cleanedTexts.slice(i, i + this.batchSize)

      const response = await this.client.embeddings.create({
        model: this.modelId,
        input: batch,
        encoding_format: 'float'
      })

      // 按原始顺序排序
      const batchEmbeddings = response.data.sort((a, b) => a.index - b.index).map(item => item.embedding as number[])
      embeddings.push(...batchEmbeddings)
    }

    return embeddings
  }

  /**
   * 计算成本（OpenAI API 的成本）
   */
  calculateCost (tokenCount: number): { inputCost: number; currency: string } {
    // text-embedding-3-small 的价格
    // 根据 OpenAI 最新价格（每 1M tokens）
    const pricePerMillion = 0.02 // 美元
    const inputCost = (tokenCount / 1_000_000) * pricePerMillion

    return {
      inputCost,
      currency: 'USD'
    }
  }

  /**
   * 获取模型信息
   */
  getModelInfo () {
    return {
      modelId: this.modelId,
      dimensions: 1536, // text-embedding-3-small 的维度
      maxInputTokens: 8191
    }
  }
}
