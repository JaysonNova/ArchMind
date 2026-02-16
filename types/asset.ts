/**
 * 资源类型定义
 */

export interface Asset {
  id: string
  userId?: string

  // 基本信息
  title: string
  description?: string

  // 文件信息
  fileName: string
  fileType: string // MIME type
  fileSize: number

  // 存储信息
  storageProvider?: 'local' | 'minio' | 'huawei-obs' | 's3'
  storageBucket?: string
  storageKey: string
  contentHash?: string

  // 资源来源
  source: 'upload' | 'ai-generated'

  // AI 生成相关
  generationPrompt?: string
  modelUsed?: string

  // 元数据
  metadata?: Record<string, any>

  // 时间戳
  createdAt: string
  updatedAt: string

  // 客户端扩展字段
  previewUrl?: string // 预览 URL (通过 presigned URL 获取)
}

export interface PrdAsset {
  id: string
  prdId: string
  assetId: string
  addedBy: 'manual' | 'ai-generated'
  sortOrder: number
  createdAt: string

  // 关联的资源对象 (JOIN 查询时填充)
  asset?: Asset
}

export interface AssetUploadResponse {
  success: boolean
  data: Asset
  message?: string
  duplicate?: boolean
}

export interface AssetListResponse {
  success: boolean
  data: {
    assets: Asset[]
    total: number
    page: number
    limit: number
  }
}

export interface AssetGenerateRequest {
  prompt: string
  modelId: string
  prdId?: string
  count?: number // 生成数量,默认 1
}

export interface AssetGenerateResponse {
  success: boolean
  data: {
    assets: Asset[]
    prdAssets?: PrdAsset[] // 如果提供了 prdId
  }
  message?: string
}
