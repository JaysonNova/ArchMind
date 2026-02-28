/**
 * PDF Parser 单元测试
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock pdf-parse with factory function
vi.mock('pdf-parse', () => ({
  default: vi.fn()
}))

// Mock logger
vi.mock('~/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn()
  }
}))

// Import after mocks
import pdfParse from 'pdf-parse'
import { PDFParser } from '~/lib/pdf/parser'

describe('PDFParser', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('parse - basic text extraction', () => {
    it('should parse PDF text and metadata from buffer', async () => {
      const mockPdfData = {
        text: '这是一个测试文档的内容，包含产品需求说明。',
        numpages: 5,
        info: {
          Title: '产品原型文档',
          Author: 'Test Author'
        }
      }
      vi.mocked(pdfParse).mockResolvedValue(mockPdfData as any)

      const parser = new PDFParser()
      const buffer = Buffer.from('fake-pdf-content')
      const result = await parser.parse(buffer)

      expect(result.text).toBe(mockPdfData.text)
      expect(result.title).toBe('产品原型文档')
      expect(result.pageCount).toBe(5)
      expect(result.images).toEqual([])
      expect(result.metadata).toEqual(mockPdfData.info)
    })

    it('should handle PDF without title', async () => {
      vi.mocked(pdfParse).mockResolvedValue({
        text: 'content',
        numpages: 1,
        info: {}
      } as any)

      const parser = new PDFParser()
      const result = await parser.parse(Buffer.from('fake'))

      expect(result.title).toBeUndefined()
      expect(result.pageCount).toBe(1)
    })

    it('should return empty images when extractImages is false', async () => {
      vi.mocked(pdfParse).mockResolvedValue({
        text: 'content',
        numpages: 2,
        info: {}
      } as any)

      const parser = new PDFParser()
      const result = await parser.parse(Buffer.from('fake'))

      expect(result.images).toEqual([])
    })

    it('should call pdf-parse with the buffer', async () => {
      vi.mocked(pdfParse).mockResolvedValue({
        text: 'test',
        numpages: 1,
        info: {}
      } as any)

      const parser = new PDFParser()
      const buffer = Buffer.from('test-pdf')
      await parser.parse(buffer)

      expect(pdfParse).toHaveBeenCalledWith(buffer)
    })

    it('should respect maxImages constructor option', async () => {
      vi.mocked(pdfParse).mockResolvedValue({
        text: 'content',
        numpages: 1,
        info: {}
      } as any)

      const parser = new PDFParser({ maxImages: 3 })
      const result = await parser.parse(Buffer.from('fake'))

      expect(result.images.length).toBeLessThanOrEqual(3)
    })
  })

  describe('output compatibility', () => {
    it('should produce ParsedPDF compatible with design doc generator', async () => {
      vi.mocked(pdfParse).mockResolvedValue({
        text: '# 产品原型\n\n## 功能列表\n\n1. 用户登录\n2. 数据展示\n3. 报表导出',
        numpages: 3,
        info: { Title: '产品原型 v2.0' }
      } as any)

      const parser = new PDFParser()
      const result = await parser.parse(Buffer.from('fake'))

      // Verify the parsed result has all fields needed by the generator
      expect(result).toHaveProperty('text')
      expect(result).toHaveProperty('title')
      expect(result).toHaveProperty('pageCount')
      expect(result).toHaveProperty('images')
      expect(result.text.length).toBeGreaterThan(0)
      expect(result.pageCount).toBe(3)
    })

    it('should handle large PDF text content', async () => {
      const longText = '内容'.repeat(10000)
      vi.mocked(pdfParse).mockResolvedValue({
        text: longText,
        numpages: 50,
        info: { Title: '大型文档' }
      } as any)

      const parser = new PDFParser()
      const result = await parser.parse(Buffer.from('fake'))

      expect(result.text).toBe(longText)
      expect(result.pageCount).toBe(50)
    })

    it('should handle multi-page documents', async () => {
      vi.mocked(pdfParse).mockResolvedValue({
        text: 'Page 1\nPage 2\nPage 3',
        numpages: 3,
        info: { Title: 'Multi-page Doc' }
      } as any)

      const parser = new PDFParser()
      const result = await parser.parse(Buffer.from('fake'))

      expect(result.pageCount).toBe(3)
      expect(result.text).toContain('Page 1')
      expect(result.text).toContain('Page 3')
    })
  })

  describe('isPopplerAvailable', () => {
    it('should return a boolean', async () => {
      const result = await PDFParser.isPopplerAvailable()
      expect(typeof result).toBe('boolean')
    })
  })
})
