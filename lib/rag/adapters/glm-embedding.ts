/**
 * GLM Embedding 适配器
 * 使用智谱 AI 的 embedding-3 模型进行文本向量化
 * API 文档：https://docs.bigmodel.cn/api-reference/模型-api/文本嵌入
 */

import type { IEmbeddingAdapter, EmbeddingModelInfo, EmbeddingCostEstimate } from '../embedding-adapter'

interface GLMEmbeddingResponse {
  model: string;
  object: string;
  data: Array<{
    index: number;
    object: string;
    embedding: number[];
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export class GLMEmbeddingAdapter implements IEmbeddingAdapter {
  private apiKey: string
  private modelId: string
  private dimensions: number
  private batchSize: number = 64 // GLM embedding-3 最多支持 64 条
  private baseURL: string = 'https://open.bigmodel.cn/api/paas/v4'

  constructor(apiKey: string, modelId: string = 'embedding-3', dimensions: number = 2048) {
    this.apiKey = apiKey
    this.modelId = modelId
    
    // 验证维度设置
    if (modelId === 'embedding-3') {
      const validDimensions = [256, 512, 1024, 2048]
      if (!validDimensions.includes(dimensions)) {
        console.warn(`Invalid dimensions ${dimensions} for embedding-3, using default 2048`)
        this.dimensions = 2048
      } else {
        this.dimensions = dimensions
      }
    } else if (modelId === 'embedding-2') {
      // embedding-2 固定 1024 维
      this.dimensions = 1024
    } else {
      this.dimensions = dimensions
    }
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

    // 分批请求
    const embeddings: number[][] = []

    for (let i = 0; i < cleanedTexts.length; i += this.batchSize) {
      const batch = cleanedTexts.slice(i, i + this.batchSize)

      try {
        const response = await this.callEmbeddingAPI(batch)
        
        // 按原始顺序排序
        const batchEmbeddings = response.data
          .sort((a, b) => a.index - b.index)
          .map(item => item.embedding)
        
        embeddings.push(...batchEmbeddings)
      } catch (error) {
        console.error('GLM embedding API error:', error)
        throw new Error(`Failed to generate embeddings: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }

    return embeddings
  }

  private async callEmbeddingAPI(texts: string[]): Promise<GLMEmbeddingResponse> {
    const requestBody: any = {
      model: this.modelId,
      input: texts
    }

    // 只有 embedding-3 支持自定义维度
    if (this.modelId === 'embedding-3') {
      requestBody.dimensions = this.dimensions
    }

    const response = await fetch(`${this.baseURL}/embeddings`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`GLM API error (${response.status}): ${errorText}`)
    }

    return await response.json()
  }

  calculateCost(tokenCount: number): EmbeddingCostEstimate {
    // GLM Embedding 定价（2026年）
    // embedding-3: ¥0.0005 per 1K tokens
    // embedding-2: ¥0.0005 per 1K tokens
    const cnyPerThousandTokens = 0.0005
    const usdPerCny = 1 / 7 // 汇率：1 USD ≈ 7 CNY

    const inputCost = (tokenCount / 1000) * cnyPerThousandTokens * usdPerCny

    return {
      inputCost,
      currency: 'USD'
    }
  }

  getModelInfo(): EmbeddingModelInfo {
    return {
      modelId: this.modelId,
      dimensions: this.dimensions,
      maxInputTokens: this.modelId === 'embedding-3' ? 3072 : 512,
      provider: 'glm'
    }
  }

  async isAvailable(): Promise<boolean> {
    try {
      // 使用一个简单的测试文本验证 API 是否可用
      await this.embed('test')
      return true
    } catch (error) {
      console.error('GLM embedding availability check failed:', error)
      return false
    }
  }

  /**
   * 获取支持的维度选项（仅 embedding-3）
   */
  static getSupportedDimensions(modelId: string): number[] {
    if (modelId === 'embedding-3') {
      return [256, 512, 1024, 2048]
    } else if (modelId === 'embedding-2') {
      return [1024]
    }
    return []
  }
}
