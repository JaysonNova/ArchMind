/**
 * 获取设计方案列表
 * GET /api/v1/design-doc
 */

import { DesignDocDAO } from '~/lib/db/dao/design-doc-dao'

export default defineEventHandler(async (event) => {
  const userId = requireAuth(event)
  const query = getQuery(event)

  const page = Math.max(1, parseInt(query.page as string) || 1)
  const limit = Math.min(100, Math.max(1, parseInt(query.limit as string) || 20))
  const offset = (page - 1) * limit

  const result = await DesignDocDAO.findAll({
    userId,
    workspaceId: query.workspace_id as string | undefined,
    limit,
    offset,
    orderBy: 'created_at',
    order: 'DESC'
  })

  return {
    success: true,
    data: {
      items: result.items,
      total: result.total,
      page,
      limit
    }
  }
})
