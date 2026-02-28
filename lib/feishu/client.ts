/**
 * 飞书开放平台 API 客户端
 * 负责认证和文档内容获取
 */

import { logger } from '~/lib/logger'
import type {
  FeishuTokenResponse,
  FeishuBlocksResponse,
  FeishuDocMetaResponse,
  FeishuBlock
} from './types'

const FEISHU_API_BASE = 'https://open.feishu.cn/open-apis'

let cachedToken: { token: string; expiresAt: number } | null = null

export class FeishuClient {
  private appId: string
  private appSecret: string

  constructor(appId: string, appSecret: string) {
    this.appId = appId.trim()
    this.appSecret = appSecret.trim()
  }

  /**
   * 获取 tenant_access_token（自动缓存）
   */
  async getTenantAccessToken(): Promise<string> {
    if (cachedToken && Date.now() < cachedToken.expiresAt - 60_000) {
      return cachedToken.token
    }

    const response = await fetch(
      `${FEISHU_API_BASE}/auth/v3/tenant_access_token/internal`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        body: JSON.stringify({
          app_id: this.appId,
          app_secret: this.appSecret
        })
      }
    )

    const data = (await response.json()) as FeishuTokenResponse
    if (data.code !== 0) {
      throw new Error(`飞书认证失败: ${data.msg} (code: ${data.code})`)
    }

    cachedToken = {
      token: data.tenant_access_token,
      expiresAt: Date.now() + data.expire * 1000
    }

    logger.info('[Feishu] tenant_access_token 获取成功')
    return cachedToken.token
  }

  /**
   * 获取文档元信息
   */
  async getDocumentMeta(documentId: string): Promise<FeishuDocMetaResponse['data']> {
    const token = await this.getTenantAccessToken()

    const response = await fetch(
      `${FEISHU_API_BASE}/docx/v1/documents/${documentId}`,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    )

    const data = (await response.json()) as FeishuDocMetaResponse
    if (data.code !== 0) {
      throw new Error(`获取文档元信息失败: ${data.msg} (code: ${data.code})`)
    }

    return data.data
  }

  /**
   * 获取文档所有 blocks（自动分页）
   */
  async getDocumentBlocks(documentId: string): Promise<FeishuBlock[]> {
    const token = await this.getTenantAccessToken()
    const allBlocks: FeishuBlock[] = []
    let pageToken: string | undefined

    do {
      const url = new URL(
        `${FEISHU_API_BASE}/docx/v1/documents/${documentId}/blocks`
      )
      url.searchParams.set('page_size', '500')
      url.searchParams.set('document_revision_id', '-1')
      if (pageToken) {
        url.searchParams.set('page_token', pageToken)
      }

      const response = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${token}` }
      })

      const data = (await response.json()) as FeishuBlocksResponse
      if (data.code !== 0) {
        throw new Error(`获取文档内容失败: ${data.msg} (code: ${data.code})`)
      }

      allBlocks.push(...data.data.items)
      pageToken = data.data.has_more ? data.data.page_token : undefined
    } while (pageToken)

    logger.info(`[Feishu] 文档 ${documentId} 共 ${allBlocks.length} 个 blocks`)
    return allBlocks
  }

  /**
   * 下载文档中的图片素材，返回 base64 编码
   * 自动尝试多种下载策略：
   * 1. 直接下载（适用于独立 Drive 文件）
   * 2. 带 extra 参数下载（适用于 docx 内嵌图片）
   * 3. 使用 batch_get 接口（适用于某些权限受限的图片）
   * @param fileToken 图片 file_token
   * @param documentId 来源文档 ID（用于 fallback 策略）
   */
  async downloadMedia(fileToken: string, documentId?: string): Promise<{ base64: string; mediaType: string }> {
    const token = await this.getTenantAccessToken()
    const errors: string[] = []

    // Strategy 1: 直接下载（无 extra 参数）
    try {
      const response1 = await fetch(`${FEISHU_API_BASE}/drive/v1/medias/${fileToken}/download`, {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (response1.ok) {
        return this._parseImageResponse(response1, fileToken)
      }
      errors.push(`Strategy 1 failed: HTTP ${response1.status}`)
    } catch (err) {
      errors.push(`Strategy 1 error: ${err instanceof Error ? err.message : err}`)
    }

    // Strategy 2-4: 带 extra 参数的多种组合
    if (documentId) {
      const strategies = [
        { obj_type: 'docx', name: 'docx' },
        { obj_type: 'wiki', name: 'wiki' },
        { obj_type: 'doc', name: 'doc' }
      ]

      for (const strategy of strategies) {
        try {
          const url = new URL(`${FEISHU_API_BASE}/drive/v1/medias/${fileToken}/download`)
          url.searchParams.set('extra', JSON.stringify({
            doc_token: documentId,
            obj_type: strategy.obj_type
          }))

          const response = await fetch(url.toString(), {
            headers: { Authorization: `Bearer ${token}` }
          })

          if (response.ok) {
            return this._parseImageResponse(response, fileToken)
          }
          errors.push(`Strategy ${strategy.name} failed: HTTP ${response.status}`)
        } catch (err) {
          errors.push(`Strategy ${strategy.name} error: ${err instanceof Error ? err.message : err}`)
        }
      }

      // Strategy 5: 尝试使用 batch_get 接口（某些图片需要通过文档上下文访问）
      try {
        const response = await fetch(
          `${FEISHU_API_BASE}/drive/v1/files/${fileToken}?type=image`,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        )

        if (response.ok) {
          const data = await response.json()
          if (data.code === 0 && data.data?.url) {
            // 获取到临时下载链接，再次下载
            const downloadResponse = await fetch(data.data.url)
            if (downloadResponse.ok) {
              return this._parseImageResponse(downloadResponse, fileToken)
            }
          }
        }
        errors.push(`Strategy batch_get failed: HTTP ${response.status}`)
      } catch (err) {
        errors.push(`Strategy batch_get error: ${err instanceof Error ? err.message : err}`)
      }
    }

    throw new Error(`下载图片失败（已尝试 ${errors.length} 种策略）: ${errors.join('; ')}`)
  }

  /**
   * 解析图片响应为 base64
   */
  private async _parseImageResponse(response: Response, fileToken: string): Promise<{ base64: string; mediaType: string }> {
    const contentType = response.headers.get('content-type') || 'image/png'
    const arrayBuffer = await response.arrayBuffer()
    const base64 = Buffer.from(arrayBuffer).toString('base64')

    logger.info(`[Feishu] 图片下载完成: ${fileToken} (${contentType}, ${Math.round(arrayBuffer.byteLength / 1024)}KB)`)

    return { base64, mediaType: contentType }
  }

  /**
   * 从飞书文档 URL 提取 document_id
   * 支持格式：
   *  - https://xxx.feishu.cn/docx/xxxxxx
   *  - https://xxx.feishu.cn/docs/xxxxxx
   *  - https://xxx.feishu.cn/wiki/xxxxxx
   */
  static extractDocumentId(url: string): { type: 'docx' | 'wiki'; id: string } | null {
    const docxMatch = url.match(/\/docx\/([A-Za-z0-9]+)/)
    if (docxMatch) {
      return { type: 'docx', id: docxMatch[1] }
    }

    const docsMatch = url.match(/\/docs\/([A-Za-z0-9]+)/)
    if (docsMatch) {
      return { type: 'docx', id: docsMatch[1] }
    }

    const wikiMatch = url.match(/\/wiki\/([A-Za-z0-9]+)/)
    if (wikiMatch) {
      return { type: 'wiki', id: wikiMatch[1] }
    }

    return null
  }
}
