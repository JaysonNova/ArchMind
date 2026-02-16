/**
 * 重新处理文档脚本
 * 使用 GLM embedding-3 重新向量化所有文档
 */

import { DocumentDAO } from '~/lib/db/dao/document-dao'
import { DocumentProcessingPipeline } from '~/lib/rag/pipeline'
import { GLMEmbeddingAdapter } from '~/lib/rag/adapters/glm-embedding'

async function reprocessDocuments() {
  console.log('=== 重新处理文档 ===\n')

  try {
    const glmApiKey = process.env.GLM_API_KEY
    if (!glmApiKey) {
      console.error('❌ GLM_API_KEY 未配置')
      process.exit(1)
    }

    const embeddingAdapter = new GLMEmbeddingAdapter(glmApiKey)
    const modelInfo = embeddingAdapter.getModelInfo()
    console.log(`✓ 使用 ${modelInfo.provider} - ${modelInfo.modelId} (${modelInfo.dimensions}维)\n`)

    const documents = await DocumentDAO.findAll()
    console.log(`找到 ${documents.length} 个文档\n`)

    for (const doc of documents) {
      console.log(`\n📄 处理文档: ${doc.title}`)
      console.log(`   ID: ${doc.id}`)
      console.log(`   状态: ${doc.processingStatus}`)
      console.log(`   内容长度: ${doc.content?.length || 0} 字符`)

      if (!doc.content || doc.content.length === 0) {
        console.log('   ⚠️  跳过: 文档内容为空')
        continue
      }

      await DocumentDAO.updateProcessingStatus(doc.id, 'processing', {
        startedAt: new Date()
      })

      try {
        const pipeline = new DocumentProcessingPipeline({ embeddingAdapter })
        const result = await pipeline.process(doc.id, doc.content)

        await DocumentDAO.updateProcessingStatus(doc.id, 'completed', {
          chunksCount: result.chunksCreated,
          vectorsCount: result.vectorsAdded,
          completedAt: new Date()
        })

        console.log(`   ✅ 处理完成: ${result.chunksCreated} 分块, ${result.vectorsAdded} 向量`)
      } catch (error) {
        console.error(`   ❌ 处理失败:`, error instanceof Error ? error.message : error)
        await DocumentDAO.updateProcessingStatus(doc.id, 'failed', {
          error: error instanceof Error ? error.message : 'Unknown error',
          completedAt: new Date()
        })
      }
    }

    console.log('\n=== 处理完成 ===')
    process.exit(0)
  } catch (error) {
    console.error('脚本执行失败:', error)
    process.exit(1)
  }
}

reprocessDocuments()
