/**
 * 文档下载 API（受保护的）
 * 通过预签名 URL 实现安全下载
 */

import { DocumentDAO } from '~/lib/db/dao/document-dao'
import { getStorageClient } from '~/lib/storage/storage-factory'

export default defineEventHandler(async (event) => {
  const t = useServerT(event)
  const documentId = getRouterParam(event, 'id')

  if (!documentId) {
    throw createError({
      statusCode: 400,
      message: t('errors.documentIdRequired')
    })
  }

  try {
    // TODO: 添加用户认证检查
    // const userId = await getUserIdFromSession(event)
    // if (!userId) {
    //   throw createError({ statusCode: 401, message: 'Unauthorized' })
    // }

    // 查询文档
    const document = await DocumentDAO.findById(documentId)
    if (!document) {
      throw createError({
        statusCode: 404,
        message: t(ErrorKeys.DOCUMENT_NOT_FOUND)
      })
    }

    // TODO: 检查访问权限
    // if (document.userId !== userId) {
    //   throw createError({ statusCode: 403, message: 'Forbidden' })
    // }

    // 检查文档是否存储在对象存储中
    if (!document.storageKey) {
      throw createError({
        statusCode: 400,
        message: t('errors.documentNotInStorage')
      })
    }

    // 生成预签名 URL（有效期 1 小时）
    const storage = getStorageClient()
    const presignedUrl = await storage.generatePresignedUrl(
      document.storageKey,
      3600  // 1 小时有效期
    )

    console.log(`Generated presigned URL for document: ${documentId}`)

    // TODO: 记录下载日志
    // await AuditLogDAO.log({
    //   entityType: 'document',
    //   entityId: documentId,
    //   action: 'download',
    //   userId: 'system',
    //   metadata: {
    //     fileName: document.title,
    //     fileSize: document.fileSize
    //   }
    // })

    // 重定向到预签名 URL
    return sendRedirect(event, presignedUrl)
  } catch (error) {
    console.error('Download error:', error)

    if (error instanceof Error && 'statusCode' in error) {
      throw error
    }

    throw createError({
      statusCode: 500,
      message: t('errors.generateDownloadLinkFailed')
    })
  }
})
