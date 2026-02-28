/**
 * 飞书文档内容解析器
 * 将飞书 Block 结构转换为 Markdown 格式
 */

import type { FeishuBlock, FeishuTextElement, FeishuImageData, ParsedFeishuDocument } from './types'
import { FEISHU_BLOCK_TYPE } from './types'
import { FeishuClient } from './client'
import { logger } from '~/lib/logger'

/** Maximum number of images to download per document */
const MAX_IMAGES = 20
/** Maximum single image size (5 MB) */
const MAX_IMAGE_BYTES = 5 * 1024 * 1024

export class FeishuDocumentParser {
  private client: FeishuClient

  constructor(client: FeishuClient) {
    this.client = client
  }

  /**
   * 解析飞书文档 URL，返回结构化内容
   */
  async parseFromUrl(url: string): Promise<ParsedFeishuDocument> {
    const extracted = FeishuClient.extractDocumentId(url)
    if (!extracted) {
      throw new Error('无效的飞书文档链接，请提供 docx 或 wiki 格式的链接')
    }

    const { id: documentId } = extracted

    const [meta, blocks] = await Promise.all([
      this.client.getDocumentMeta(documentId),
      this.client.getDocumentBlocks(documentId)
    ])

    // Build a map from block_id → block for table cell lookups
    const blockMap = new Map<string, FeishuBlock>()
    for (const block of blocks) {
      blockMap.set(block.block_id, block)
    }

    // Collect image tokens from blocks
    const imageBlocks: Array<{ token: string; width?: number; height?: number }> = []
    for (const block of blocks) {
      if (block.block_type === FEISHU_BLOCK_TYPE.IMAGE && block.image?.token) {
        imageBlocks.push({
          token: block.image.token,
          width: block.image.width,
          height: block.image.height
        })
      }
    }

    // Download images in parallel (up to MAX_IMAGES)
    const images: FeishuImageData[] = []
    const imagesToDownload = imageBlocks.slice(0, MAX_IMAGES)

    if (imagesToDownload.length > 0) {
      logger.info(`[Feishu] 开始下载 ${imagesToDownload.length} 张图片...`)

      const downloadResults = await Promise.allSettled(
        imagesToDownload.map(async (img, index) => {
          try {
            const { base64, mediaType } = await this.client.downloadMedia(img.token)
            // Check size limit
            const sizeBytes = Buffer.byteLength(base64, 'base64')
            if (sizeBytes > MAX_IMAGE_BYTES) {
              logger.warn(`[Feishu] 图片 ${img.token} 超过大小限制 (${Math.round(sizeBytes / 1024 / 1024)}MB)，跳过`)
              return null
            }
            return {
              token: img.token,
              base64,
              mediaType,
              width: img.width,
              height: img.height,
              label: `[图片-${index + 1}]`
            } as FeishuImageData
          } catch (err) {
            logger.warn(`[Feishu] 图片下载失败 (${img.token}): ${err instanceof Error ? err.message : err}`)
            return null
          }
        })
      )

      for (const result of downloadResults) {
        if (result.status === 'fulfilled' && result.value) {
          images.push(result.value)
        }
      }

      logger.info(`[Feishu] 图片下载完成: ${images.length}/${imagesToDownload.length} 张成功`)
    }

    // Build token → label mapping for markdown conversion
    const imageTokenToLabel = new Map<string, string>()
    for (const img of images) {
      imageTokenToLabel.set(img.token, img.label)
    }

    const content = this.blocksToMarkdown(blocks, blockMap, imageTokenToLabel)
    const title = meta.document.title || '未命名文档'

    logger.info(`[Feishu] 文档解析完成: "${title}" (${content.length} 字符, ${images.length} 张图片)`)

    return {
      title,
      documentId,
      content,
      url,
      images
    }
  }

  /**
   * 将 blocks 数组转换为 Markdown
   */
  private blocksToMarkdown(
    blocks: FeishuBlock[],
    blockMap: Map<string, FeishuBlock>,
    imageTokenToLabel: Map<string, string>
  ): string {
    const lines: string[] = []

    for (const block of blocks) {
      const line = this.blockToMarkdown(block, blockMap, imageTokenToLabel)
      if (line !== null) {
        lines.push(line)
      }
    }

    return lines.join('\n')
  }

  private blockToMarkdown(
    block: FeishuBlock,
    blockMap: Map<string, FeishuBlock>,
    imageTokenToLabel: Map<string, string>
  ): string | null {
    switch (block.block_type) {
      case FEISHU_BLOCK_TYPE.PAGE:
        return null

      case FEISHU_BLOCK_TYPE.TEXT:
        return this.elementsToText(block.text?.elements) + '\n'

      case FEISHU_BLOCK_TYPE.HEADING1:
        return `# ${this.elementsToText(block.heading1?.elements)}\n`

      case FEISHU_BLOCK_TYPE.HEADING2:
        return `## ${this.elementsToText(block.heading2?.elements)}\n`

      case FEISHU_BLOCK_TYPE.HEADING3:
        return `### ${this.elementsToText(block.heading3?.elements)}\n`

      case FEISHU_BLOCK_TYPE.HEADING4:
        return `#### ${this.elementsToText(block.heading4?.elements)}\n`

      case FEISHU_BLOCK_TYPE.HEADING5:
        return `##### ${this.elementsToText(block.heading5?.elements)}\n`

      case FEISHU_BLOCK_TYPE.HEADING6:
        return `###### ${this.elementsToText(block.heading6?.elements)}\n`

      case FEISHU_BLOCK_TYPE.HEADING7:
      case FEISHU_BLOCK_TYPE.HEADING8:
      case FEISHU_BLOCK_TYPE.HEADING9: {
        const key = `heading${block.block_type - FEISHU_BLOCK_TYPE.HEADING1 + 1}` as keyof FeishuBlock
        const data = block[key] as { elements: FeishuTextElement[] } | undefined
        return `###### ${this.elementsToText(data?.elements)}\n`
      }

      case FEISHU_BLOCK_TYPE.BULLET:
        return `- ${this.elementsToText(block.bullet?.elements)}`

      case FEISHU_BLOCK_TYPE.ORDERED:
        return `1. ${this.elementsToText(block.ordered?.elements)}`

      case FEISHU_BLOCK_TYPE.CODE:
        return `\`\`\`\n${this.elementsToText(block.code?.elements)}\n\`\`\`\n`

      case FEISHU_BLOCK_TYPE.QUOTE:
        return `> ${this.elementsToText(block.quote?.elements)}\n`

      case FEISHU_BLOCK_TYPE.TODO: {
        const checked = block.todo?.done ? 'x' : ' '
        return `- [${checked}] ${this.elementsToText(block.todo?.elements)}`
      }

      case FEISHU_BLOCK_TYPE.DIVIDER:
        return '\n---\n'

      case FEISHU_BLOCK_TYPE.IMAGE: {
        const token = block.image?.token
        if (token && imageTokenToLabel.has(token)) {
          return imageTokenToLabel.get(token)!
        }
        return '[图片]'
      }

      case FEISHU_BLOCK_TYPE.TABLE: {
        return this.tableToMarkdown(block, blockMap)
      }

      case FEISHU_BLOCK_TYPE.TABLE_CELL:
        // Table cells are handled within tableToMarkdown
        return null

      case FEISHU_BLOCK_TYPE.CALLOUT:
        return `> **注意**: ${this.elementsToText(block.callout?.elements)}\n`

      default:
        return null
    }
  }

  /**
   * 将表格 block 转换为 Markdown 表格
   */
  private tableToMarkdown(block: FeishuBlock, blockMap: Map<string, FeishuBlock>): string | null {
    const table = block.table
    if (!table || !table.property) return null

    const { row_size, column_size } = table.property
    const cellIds = table.cells || []

    if (cellIds.length === 0 || row_size === 0 || column_size === 0) return null

    const rows: string[][] = []
    for (let r = 0; r < row_size; r++) {
      const row: string[] = []
      for (let c = 0; c < column_size; c++) {
        const cellId = cellIds[r * column_size + c]
        const cellBlock = cellId ? blockMap.get(cellId) : undefined
        const cellText = cellBlock?.table_cell
          ? this.elementsToText(cellBlock.table_cell.elements).trim()
          : ''
        row.push(cellText)
      }
      rows.push(row)
    }

    if (rows.length === 0) return null

    const lines: string[] = []
    // Header row
    lines.push('| ' + rows[0].join(' | ') + ' |')
    // Separator
    lines.push('| ' + rows[0].map(() => '---').join(' | ') + ' |')
    // Body rows
    for (let r = 1; r < rows.length; r++) {
      lines.push('| ' + rows[r].join(' | ') + ' |')
    }

    return lines.join('\n') + '\n'
  }

  /**
   * 将文本元素数组转为纯文本/Markdown
   */
  private elementsToText(elements?: FeishuTextElement[]): string {
    if (!elements || elements.length === 0) return ''

    return elements
      .map((el) => {
        if (el.text_run) {
          let text = el.text_run.content
          const style = el.text_run.text_element_style

          if (style) {
            if (style.bold) text = `**${text}**`
            if (style.italic) text = `*${text}*`
            if (style.strikethrough) text = `~~${text}~~`
            if (style.inline_code) text = `\`${text}\``
            if (style.link?.url) {
              const decodedUrl = decodeURIComponent(style.link.url)
              text = `[${text}](${decodedUrl})`
            }
          }

          return text
        }

        if (el.equation) {
          return `$${el.equation.content}$`
        }

        return ''
      })
      .join('')
  }
}
