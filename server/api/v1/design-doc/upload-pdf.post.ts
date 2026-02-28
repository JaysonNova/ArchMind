/**
 * PDF 上传与解析接口
 * POST /api/v1/design-doc/upload-pdf
 */

import { PDFParser } from '~/lib/pdf/parser'
import { requireAuth } from '~/server/utils/auth-helpers'

const MAX_PDF_SIZE = 20 * 1024 * 1024 // 20MB

export default defineEventHandler(async (event) => {
  try {
    requireAuth(event)

    // 解析 multipart/form-data
    const formData = await readMultipartFormData(event)
    if (!formData) {
      throw createError({ statusCode: 400, message: '未找到上传文件' })
    }

    const pdfFile = formData.find(item => item.name === 'pdf')
    if (!pdfFile || !pdfFile.data) {
      throw createError({ statusCode: 400, message: '请上传 PDF 文件' })
    }

    // 验证文件大小
    if (pdfFile.data.length > MAX_PDF_SIZE) {
      throw createError({
        statusCode: 413,
        message: `文件过大，最大支持 ${MAX_PDF_SIZE / 1024 / 1024}MB`
      })
    }

    // 验证文件类型
    const filename = pdfFile.filename || ''
    if (!filename.toLowerCase().endsWith('.pdf')) {
      throw createError({ statusCode: 400, message: '仅支持 PDF 格式' })
    }

    // 解析 PDF
    const parser = new PDFParser()
    const parsed = await parser.parse(pdfFile.data, {
      extractImages: true
    })

    // 返回解析结果（供前端预览和后续生成使用）
    return {
      success: true,
      data: {
        title: parsed.title || filename.replace('.pdf', ''),
        pageCount: parsed.pageCount,
        textLength: parsed.text.length,
        imageCount: parsed.images.length,
        // 返回完整内容和图片供生成使用
        content: parsed.text,
        images: parsed.images,
        // 预览信息
        preview: parsed.text.slice(0, 500),
        metadata: parsed.metadata
      }
    }
  } catch (error) {
    console.error('[PDF] Upload error:', error)

    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error
    }

    throw createError({
      statusCode: 500,
      message: error instanceof Error ? error.message : 'PDF 解析失败'
    })
  }
})
