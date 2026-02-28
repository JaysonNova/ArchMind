/**
 * 前端设计方案类型定义
 */

export interface DesignDocument {
  id: string
  userId: string
  workspaceId?: string
  title: string
  feishuUrl?: string
  feishuDocTitle?: string
  feishuDocContent?: string
  content: string
  modelUsed?: string
  generationTime?: number
  tokenCount?: number
  estimatedCost?: number
  status?: string
  metadata?: Record<string, any>
  createdAt: string
  updatedAt: string
}

export interface DesignDocGenerateRequest {
  feishuUrl: string
  modelId?: string
  temperature?: number
  maxTokens?: number
  workspaceId?: string
  additionalContext?: string
  customTemplate?: string  // 自定义模板内容（Markdown 格式）
}

export interface DesignDocGenerateResponse {
  success: boolean
  data: {
    id: string
    title: string
    content: string
    model: string
    tokenCount: number
    estimatedCost: number
    generationTime: number
    feishuDocTitle: string
  }
}

export interface DesignDocStreamChunk {
  chunk?: string
  done?: boolean
  error?: string
  meta?: {
    id?: string
    title?: string
    feishuDocTitle?: string
    model?: string
    tokenCount?: number
    estimatedCost?: number
    generationTime?: number
  }
}

export interface DesignDocListResponse {
  success: boolean
  data: {
    items: DesignDocument[]
    total: number
    page: number
    limit: number
  }
}
