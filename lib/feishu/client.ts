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
    this.appId = appId
    this.appSecret = appSecret
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
