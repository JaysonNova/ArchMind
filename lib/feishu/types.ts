/**
 * 飞书开放平台 API 类型定义
 */

export interface FeishuTokenResponse {
  code: number
  msg: string
  tenant_access_token: string
  expire: number
}

export interface FeishuDocumentMeta {
  document: {
    document_id: string
    revision_id: number
    title: string
  }
}

export interface FeishuBlock {
  block_id: string
  parent_id: string
  children: string[]
  block_type: number
  page?: { style: Record<string, any>; elements: FeishuTextElement[] }
  text?: { style: Record<string, any>; elements: FeishuTextElement[] }
  heading1?: { style: Record<string, any>; elements: FeishuTextElement[] }
  heading2?: { style: Record<string, any>; elements: FeishuTextElement[] }
  heading3?: { style: Record<string, any>; elements: FeishuTextElement[] }
  heading4?: { style: Record<string, any>; elements: FeishuTextElement[] }
  heading5?: { style: Record<string, any>; elements: FeishuTextElement[] }
  heading6?: { style: Record<string, any>; elements: FeishuTextElement[] }
  heading7?: { style: Record<string, any>; elements: FeishuTextElement[] }
  heading8?: { style: Record<string, any>; elements: FeishuTextElement[] }
  heading9?: { style: Record<string, any>; elements: FeishuTextElement[] }
  bullet?: { style: Record<string, any>; elements: FeishuTextElement[] }
  ordered?: { style: Record<string, any>; elements: FeishuTextElement[] }
  code?: { style: Record<string, any>; elements: FeishuTextElement[] }
  quote?: { style: Record<string, any>; elements: FeishuTextElement[] }
  todo?: { style: Record<string, any>; elements: FeishuTextElement[]; done?: boolean }
  callout?: { style: Record<string, any>; elements: FeishuTextElement[] }
  divider?: Record<string, any>
  image?: { token: string; width: number; height: number }
  table?: { cells: string[]; property: { row_size: number; column_size: number } }
  table_cell?: { elements: FeishuTextElement[] }
}

export interface FeishuTextElement {
  text_run?: {
    content: string
    text_element_style?: {
      bold?: boolean
      italic?: boolean
      strikethrough?: boolean
      underline?: boolean
      inline_code?: boolean
      link?: { url: string }
    }
  }
  mention_user?: { user_id: string }
  equation?: { content: string }
}

export interface FeishuBlocksResponse {
  code: number
  msg: string
  data: {
    items: FeishuBlock[]
    has_more: boolean
    page_token?: string
  }
}

export interface FeishuDocMetaResponse {
  code: number
  msg: string
  data: FeishuDocumentMeta
}

export interface FeishuImageData {
  token: string
  base64: string
  mediaType: string
  width?: number
  height?: number
  /** Placeholder label used in markdown content, e.g. [图片-1] */
  label: string
}

export interface ParsedFeishuDocument {
  title: string
  documentId: string
  content: string
  url: string
  images: FeishuImageData[]
}

export const FEISHU_BLOCK_TYPE = {
  PAGE: 1,
  TEXT: 2,
  HEADING1: 3,
  HEADING2: 4,
  HEADING3: 5,
  HEADING4: 6,
  HEADING5: 7,
  HEADING6: 8,
  HEADING7: 9,
  HEADING8: 10,
  HEADING9: 11,
  BULLET: 12,
  ORDERED: 13,
  CODE: 14,
  QUOTE: 15,
  TODO: 17,
  DIVIDER: 22,
  IMAGE: 27,
  TABLE: 18,
  TABLE_CELL: 19,
  CALLOUT: 34
} as const
