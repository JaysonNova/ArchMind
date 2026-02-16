import { db } from '~/lib/db/client'
import { prdDocuments, prdDocumentReferences } from '~/lib/db/schema'
import { eq, desc } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const t = useServerT(event)

  try {
    const id = getRouterParam(event, 'id')

    if (!id) {
      setResponseStatus(event, 400)
      return { success: false, message: t('errors.documentIdRequired') }
    }

    // 查询引用了该文档的所有 PRD
    const results = await db
      .select({
        id: prdDocuments.id,
        title: prdDocuments.title,
        createdAt: prdDocuments.createdAt,
        updatedAt: prdDocuments.updatedAt,
        relevanceScore: prdDocumentReferences.relevanceScore
      })
      .from(prdDocuments)
      .innerJoin(
        prdDocumentReferences,
        eq(prdDocumentReferences.prdId, prdDocuments.id)
      )
      .where(eq(prdDocumentReferences.documentId, id))
      .orderBy(desc(prdDocuments.createdAt))

    return {
      success: true,
      data: results
    }
  } catch (error) {
    console.error('Failed to get document usage:', error)
    setResponseStatus(event, 500)
    return {
      success: false,
      message: error instanceof Error ? error.message : t(ErrorKeys.UNKNOWN_ERROR)
    }
  }
})
