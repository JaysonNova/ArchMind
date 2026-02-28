/**
 * 删除设计方案
 * DELETE /api/v1/design-doc/:id
 */

import { DesignDocDAO } from '~/lib/db/dao/design-doc-dao'

export default defineEventHandler(async (event) => {
  const userId = requireAuth(event)
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({ statusCode: 400, message: '缺少 ID 参数' })
  }

  const deleted = await DesignDocDAO.delete(id, userId)
  if (!deleted) {
    throw createError({ statusCode: 404, message: '设计方案不存在或无权删除' })
  }

  return { success: true, message: '删除成功' }
})
