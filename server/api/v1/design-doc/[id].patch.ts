/**
 * 更新设计方案内容
 * PATCH /api/v1/design-doc/:id
 */

import { DesignDocDAO } from '~/lib/db/dao/design-doc-dao'

export default defineEventHandler(async (event) => {
  const _t = useServerT(event)
  try {
    const userId = requireAuth(event)
    const id = getRouterParam(event, 'id')

    if (!id) {
      setResponseStatus(event, 400)
      return { success: false, message: 'Missing document ID' }
    }

    const body = await readBody<{ content?: string; title?: string }>(event)

    if (!body.content && !body.title) {
      setResponseStatus(event, 400)
      return { success: false, message: '请提供要更新的内容' }
    }

    const doc = await DesignDocDAO.findById(id)
    if (!doc) {
      setResponseStatus(event, 404)
      return { success: false, message: '文档不存在' }
    }

    requireResourceOwner({ userId: doc.userId }, userId)

    let updated
    if (body.content !== undefined) {
      updated = await DesignDocDAO.updateContent(id, userId, body.content, body.title)
    } else if (body.title) {
      updated = await DesignDocDAO.updateTitle(id, userId, body.title)
    }

    return { success: true, data: updated }
  } catch (error) {
    console.error('Error updating design doc:', error)
    setResponseStatus(event, 500)
    return {
      success: false,
      message: error instanceof Error ? error.message : '更新失败'
    }
  }
})
