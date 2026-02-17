/**
 * 原型图类型定义
 */

// 设备类型
export type DeviceType = 'desktop' | 'tablet' | 'mobile' | 'responsive'

// 设备类型配置
export const DEVICE_CONFIGS: Record<DeviceType, { label: string; width: string; height: string; description: string }> = {
  desktop: {
    label: '桌面端',
    width: '100%',
    height: '100%',
    description: 'PC/笔记本浏览器，宽度 >= 1024px'
  },
  tablet: {
    label: '平板端',
    width: '768px',
    height: '1024px',
    description: 'iPad/Android 平板，768px - 1024px'
  },
  mobile: {
    label: '移动端',
    width: '375px',
    height: '812px',
    description: 'iPhone/Android 手机，宽度 <= 428px'
  },
  responsive: {
    label: '响应式',
    width: '100%',
    height: '100%',
    description: '自适应多种设备尺寸'
  }
}

export interface Prototype {
  id: string
  prdId?: string
  userId?: string
  title: string
  description?: string
  currentVersion: number
  status: 'draft' | 'published' | 'archived'
  deviceType: DeviceType
  metadata?: Record<string, any>
  createdAt: string
  updatedAt: string
}

export interface PrototypePage {
  id: string
  prototypeId: string
  pageName: string
  pageSlug: string
  htmlContent: string
  sortOrder: number
  isEntryPage: boolean
  metadata?: Record<string, any>
  createdAt: string
  updatedAt: string
}

export interface PrototypeVersion {
  id: string
  prototypeId: string
  versionNumber: number
  pagesSnapshot: PrototypePageSnapshot[]
  commitMessage?: string
  modelUsed?: string
  createdAt: string
}

export interface PrototypePageSnapshot {
  pageName: string
  pageSlug: string
  htmlContent: string
  sortOrder: number
  isEntryPage: boolean
}

// === API 请求/响应类型 ===

export interface PrototypeGenerateFromPRDRequest {
  prdId: string
  modelId?: string
  temperature?: number
  maxTokens?: number
  pageCount?: number
  deviceType?: DeviceType
}

export interface PrototypeStreamRequest {
  message: string
  prototypeId?: string
  currentPageSlug?: string
  currentHtml?: string
  prdContent?: string
  history?: Array<{ role: string; content: string }>
  modelId?: string
  useRAG?: boolean
  temperature?: number
  maxTokens?: number
}

export interface PrototypeStreamChunk {
  chunk?: string
  done?: boolean
  error?: string
  pageSlug?: string
  pageName?: string
  fullHtml?: string
}

export interface PrototypeCreateRequest {
  title: string
  prdId?: string
  description?: string
  pages: Array<{
    pageName: string
    pageSlug: string
    htmlContent: string
    sortOrder?: number
    isEntryPage?: boolean
  }>
}

export interface PrototypeUpdatePageRequest {
  htmlContent: string
  pageName?: string
}
