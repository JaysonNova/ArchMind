import { DocumentChunkDAO } from '~/lib/db/dao/document-chunk-dao'

export default defineEventHandler(async (event) => {
  const t = useServerT(event)

  try {
    const id = getRouterParam(event, 'id')

    if (!id) {
      setResponseStatus(event, 400)
      return { success: false, message: t('errors.documentIdRequired') }
    }

    const chunks = await DocumentChunkDAO.findByDocumentId(id)

    return {
      success: true,
      data: chunks
    }
  } catch (error) {
    console.error('Failed to get document chunks:', error)
    setResponseStatus(event, 500)
    return {
      success: false,
      message: error instanceof Error ? error.message : t(ErrorKeys.UNKNOWN_ERROR)
    }
  }
})
