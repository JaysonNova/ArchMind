import { LogicMapDAO } from '~/lib/db/dao/logic-map-dao'

import { ErrorMessages } from '~/server/utils/errors'
export default defineEventHandler(async (event) => {
  try {
    const prdId = getRouterParam(event, 'id')

    if (!prdId) {
      setResponseStatus(event, 400)
      return { success: false, error: 'prdId is required' }
    }

    const logicMapRecord = await LogicMapDAO.findByPrdId(prdId)

    if (!logicMapRecord) {
      return { success: true, data: null }
    }

    const logicMapData = LogicMapDAO.toLogicMapData(logicMapRecord)

    return {
      success: true,
      data: logicMapData
    }
  } catch (error) {
    console.error('Failed to load logic map:', error)
    setResponseStatus(event, 500)
    return {
      success: false,
      error: error instanceof Error ? error.message : ErrorMessages.UNKNOWN_ERROR
    }
  }
})
