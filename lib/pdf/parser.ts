/**
 * PDF 文档解析器
 * 支持文本提取和图片提取（Poppler 或 pdf-lib）
 */

import pdf from 'pdf-parse'
import { PDFDocument, PDFName, PDFRawStream } from 'pdf-lib'
import { exec } from 'child_process'
import { promisify } from 'util'
import { writeFile, readFile, mkdir, readdir } from 'fs/promises'
import { join } from 'path'
import { tmpdir } from 'os'
import { logger } from '~/lib/logger'
import type { ParsedPDF, PDFImage, PDFParseOptions } from './types'

const execAsync = promisify(exec)

const DEFAULT_MAX_IMAGES = 20
const DEFAULT_MAX_IMAGE_SIZE = 5 * 1024 * 1024 // 5MB

export class PDFParser {
  private maxImages: number
  private maxImageSize: number

  constructor(options?: { maxImages?: number; maxImageSize?: number }) {
    this.maxImages = options?.maxImages || DEFAULT_MAX_IMAGES
    this.maxImageSize = options?.maxImageSize || DEFAULT_MAX_IMAGE_SIZE
  }

  /**
   * 解析 PDF 文件
   */
  async parse(input: Buffer | string, options?: PDFParseOptions): Promise<ParsedPDF> {
    const buffer = typeof input === 'string' ? await readFile(input) : input

    logger.info(`[PDF] 开始解析 PDF (${buffer.length} bytes)`)

    // 1. 提取文本和元数据
    const pdfData = await pdf(buffer)

    logger.info(`[PDF] 文本提取完成: ${pdfData.numpages} 页, ${pdfData.text.length} 字符`)

    // 2. 提取图片（可选）
    let images: PDFImage[] = []
    if (options?.extractImages) {
      const usePoppler = options.usePoppler ?? (await PDFParser.isPopplerAvailable())
      if (usePoppler) {
        images = await this.extractImagesWithPoppler(buffer)
      } else {
        images = await this.extractImagesWithPdfLib(buffer)
      }
      logger.info(`[PDF] 图片提取完成: ${images.length} 张`)
    }

    return {
      text: pdfData.text,
      title: pdfData.info?.Title || undefined,
      pageCount: pdfData.numpages,
      images: images.slice(0, this.maxImages),
      metadata: pdfData.info
    }
  }

  /**
   * 使用 Poppler (pdftoppm) 将每页渲染为图片
   */
  private async extractImagesWithPoppler(buffer: Buffer): Promise<PDFImage[]> {
    const tempDir = join(tmpdir(), `archmind-pdf-${Date.now()}`)
    const pdfPath = join(tempDir, 'input.pdf')

    try {
      await mkdir(tempDir, { recursive: true })
      await writeFile(pdfPath, buffer)

      // 使用 pdftoppm 将 PDF 页面渲染为 PNG（-r 150 = 150 DPI，平衡质量和大小）
      await execAsync(
        `pdftoppm -png -r 150 "${pdfPath}" "${join(tempDir, 'page')}"`,
        { timeout: 60000 }
      )

      // 读取生成的图片文件
      const files = await readdir(tempDir)
      const pngFiles = files
        .filter(f => f.startsWith('page-') && f.endsWith('.png'))
        .sort()

      const images: PDFImage[] = []
      for (let i = 0; i < Math.min(pngFiles.length, this.maxImages); i++) {
        const imgPath = join(tempDir, pngFiles[i])
        const imgBuffer = await readFile(imgPath)

        if (imgBuffer.length > this.maxImageSize) {
          logger.warn(`[PDF] 页面图片过大 (${Math.round(imgBuffer.length / 1024)}KB)，跳过`)
          continue
        }

        // 从文件名提取页码，如 page-01.png → 1
        const pageMatch = pngFiles[i].match(/page-(\d+)\.png/)
        const pageNumber = pageMatch ? parseInt(pageMatch[1]) : i + 1

        images.push({
          base64: imgBuffer.toString('base64'),
          mediaType: 'image/png',
          pageNumber,
          label: `[PDF-P${pageNumber}]`
        })
      }

      return images
    } catch (err) {
      logger.warn(`[PDF] Poppler 图片提取失败: ${err instanceof Error ? err.message : err}`)
      return []
    } finally {
      // 清理临时文件
      await execAsync(`rm -rf "${tempDir}"`).catch(() => {})
    }
  }

  /**
   * 使用 pdf-lib 提取嵌入的图片对象（跨平台 fallback）
   */
  private async extractImagesWithPdfLib(buffer: Buffer): Promise<PDFImage[]> {
    try {
      const pdfDoc = await PDFDocument.load(buffer, { ignoreEncryption: true })
      const images: PDFImage[] = []
      let imageIndex = 0

      const enumeratedObjects = pdfDoc.context.enumerateIndirectObjects()

      for (const [_ref, obj] of enumeratedObjects) {
        if (images.length >= this.maxImages) break

        if (!(obj instanceof PDFRawStream)) continue

        const dict = obj.dict
        const type = dict.get(PDFName.of('Type'))
        const subtype = dict.get(PDFName.of('Subtype'))

        // 只处理图片 XObject
        if (
          subtype?.toString() !== '/Image' &&
          type?.toString() !== '/Image'
        ) {
          continue
        }

        try {
          const contents = obj.getContents()
          if (contents.length === 0 || contents.length > this.maxImageSize) continue

          // 检测图片格式
          const filter = dict.get(PDFName.of('Filter'))
          const filterStr = filter?.toString() || ''

          let mediaType = 'image/png'
          let base64Data: string

          if (filterStr.includes('DCTDecode')) {
            // JPEG
            mediaType = 'image/jpeg'
            base64Data = Buffer.from(contents).toString('base64')
          } else if (filterStr.includes('JPXDecode')) {
            // JPEG 2000
            mediaType = 'image/jp2'
            base64Data = Buffer.from(contents).toString('base64')
          } else {
            // 其他格式（FlateDecode 等），跳过原始流数据
            // 这些需要额外解码处理，pdf-lib 不直接支持
            continue
          }

          imageIndex++
          images.push({
            base64: base64Data,
            mediaType,
            pageNumber: 0, // pdf-lib 无法直接关联页码
            label: `[PDF图片-${imageIndex}]`
          })
        } catch {
          // 跳过无法解析的图片
          continue
        }
      }

      return images
    } catch (err) {
      logger.warn(`[PDF] pdf-lib 图片提取失败: ${err instanceof Error ? err.message : err}`)
      return []
    }
  }

  /**
   * 检测 Poppler 是否可用
   */
  static async isPopplerAvailable(): Promise<boolean> {
    try {
      await execAsync('pdftoppm -v 2>&1', { timeout: 3000 })
      return true
    } catch {
      return false
    }
  }
}
