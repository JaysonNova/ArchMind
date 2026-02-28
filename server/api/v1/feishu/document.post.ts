/**
 * 解析飞书文档内容
 * POST /api/v1/feishu/document
 */

import { FeishuClient } from '~/lib/feishu/client'
import { FeishuDocumentParser } from '~/lib/feishu/document-parser'

export default defineEventHandler(async (event) => {
  const _userId = requireAuth(event)
  const body = await readBody<{ url: string }>(event)

  if (!body.url) {
    throw createError({ statusCode: 400, message: '请提供飞书文档链接' })
  }

  const extracted = FeishuClient.extractDocumentId(body.url)
  if (!extracted) {
    throw createError({
      statusCode: 400,
      message: '无效的飞书文档链接，支持 docx / docs / wiki 格式'
    })
  }

  const runtimeConfig = useRuntimeConfig()
  const appId = runtimeConfig.feishuAppId as string
  const appSecret = runtimeConfig.feishuAppSecret as string

  if (!appId || !appSecret) {
    throw createError({
      statusCode: 500,
      message: '飞书应用未配置，请联系管理员设置 FEISHU_APP_ID 和 FEISHU_APP_SECRET'
    })
  }

  const client = new FeishuClient(appId, appSecret)
  const parser = new FeishuDocumentParser(client)

  try {
    const doc = await parser.parseFromUrl(body.url)
    return {
      success: true,
      data: {
        title: doc.title,
        documentId: doc.documentId,
        content: doc.content,
        contentLength: doc.content.length
      }
    }
  } catch (err: any) {
    throw createError({
      statusCode: 502,
      message: `飞书文档解析失败: ${err.message}`
    })
  }
})
