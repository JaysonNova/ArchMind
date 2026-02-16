/**
 * 原型图类型定义
 */

export interface Prototype {
  id: string
  prdId?: string
  userId?: string
  title: string
  description?: string
  currentVersion: number
  status: 'draft' | 'published' | 'archived'
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
