/**
 * 验证飞书文档链接有效性
 * POST /api/v1/feishu/validate
 */

import { FeishuClient } from '~/lib/feishu/client'

export default defineEventHandler(async (event) => {
  const _userId = requireAuth(event)
  const body = await readBody<{ url: string }>(event)

  if (!body.url) {
    return { success: false, valid: false, message: '请提供链接' }
  }

  const extracted = FeishuClient.extractDocumentId(body.url)
  if (!extracted) {
    return {
      success: true,
      valid: false,
      message: '无效的飞书文档链接，支持 docx / docs / wiki 格式'
    }
  }

  const runtimeConfig = useRuntimeConfig()
  const appId = runtimeConfig.feishuAppId as string
  const appSecret = runtimeConfig.feishuAppSecret as string

  if (!appId || !appSecret) {
    return {
      success: true,
      valid: false,
      message: '飞书应用未配置'
    }
  }

  try {
    const client = new FeishuClient(appId, appSecret)
    const meta = await client.getDocumentMeta(extracted.id)

    return {
      success: true,
      valid: true,
      data: {
        title: meta.document.title,
        documentId: meta.document.document_id,
        type: extracted.type
      }
    }
  } catch (err: any) {
    return {
      success: true,
      valid: false,
      message: `无法访问文档: ${err.message}`
    }
  }
})
