/**
 * 获取设计方案详情
 * GET /api/v1/design-doc/:id
 */

import { DesignDocDAO } from '~/lib/db/dao/design-doc-dao'

export default defineEventHandler(async (event) => {
  const userId = requireAuth(event)
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({ statusCode: 400, message: '缺少 ID 参数' })
  }

  const doc = await DesignDocDAO.findById(id)
  if (!doc) {
    throw createError({ statusCode: 404, message: '设计方案不存在' })
  }

  if (doc.userId !== userId) {
    throw createError({ statusCode: 403, message: '无权访问此资源' })
  }

  return { success: true, data: doc }
})
