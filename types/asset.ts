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
  storageProvider?: 'huawei-obs' | 's3'
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
  negativePrompt?: string // 负面提示词
  size?: string // 图片尺寸,如 "1024*1024"
}

export interface AssetEditRequest {
  assetId: string // 要编辑的资源 ID
  prompt: string // 编辑指令
  modelId?: string // 使用的模型
  function?: ImageEditFunction // 编辑功能类型
  maskAssetId?: string // 蒙版图片 ID (用于 inpaint)
  strength?: number // 编辑强度 0-1
}

export type ImageEditFunction =
  | 'stylization_all' // 全局风格化
  | 'stylization_local' // 局部风格化
  | 'description_edit' // 指令编辑
  | 'description_edit_with_mask' // 蒙版编辑 (inpaint)
  | 'expand' // 图片扩展
  | 'super_resolution' // 超分辨率
  | 'colorization' // 上色

export interface AssetGenerateResponse {
  success: boolean
  data: {
    assets: Asset[]
    prdAssets?: PrdAsset[] // 如果提供了 prdId
  }
  message?: string
}
