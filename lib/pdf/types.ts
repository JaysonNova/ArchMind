/**
 * PDF 解析相关类型定义
 */

export interface ParsedPDF {
  text: string
  title?: string
  pageCount: number
  images: PDFImage[]
  metadata?: Record<string, any>
}

export interface PDFImage {
  base64: string
  mediaType: string
  pageNumber: number
  label: string
  width?: number
  height?: number
}

export interface PDFParseOptions {
  extractImages?: boolean
  usePoppler?: boolean
  maxImages?: number      // Default: 50
  maxImageSize?: number   // Default: 10MB
}
