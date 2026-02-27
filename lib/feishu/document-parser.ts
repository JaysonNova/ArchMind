/**
 * 飞书文档内容解析器
 * 将飞书 Block 结构转换为 Markdown 格式
 */

import type { FeishuBlock, FeishuTextElement, ParsedFeishuDocument } from './types'
import { FEISHU_BLOCK_TYPE } from './types'
import { FeishuClient } from './client'
import { logger } from '~/lib/logger'

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

    const content = this.blocksToMarkdown(blocks)
    const title = meta.document.title || '未命名文档'

    logger.info(`[Feishu] 文档解析完成: "${title}" (${content.length} 字符)`)

    return {
      title,
      documentId,
      content,
      url
    }
  }

  /**
   * 将 blocks 数组转换为 Markdown
   */
  private blocksToMarkdown(blocks: FeishuBlock[]): string {
    const lines: string[] = []

    for (const block of blocks) {
      const line = this.blockToMarkdown(block)
      if (line !== null) {
        lines.push(line)
      }
    }

    return lines.join('\n')
  }

  private blockToMarkdown(block: FeishuBlock): string | null {
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

      case FEISHU_BLOCK_TYPE.IMAGE:
        return '[图片]'

      case FEISHU_BLOCK_TYPE.CALLOUT:
        return `> **注意**: ${this.elementsToText(block.callout?.elements)}\n`

      default:
        return null
    }
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
