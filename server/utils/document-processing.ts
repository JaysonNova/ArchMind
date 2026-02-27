/**
 * 文档异步处理工具
 * 供 upload.post.ts 和 batch-upload.post.ts 共用
 */

import { existsSync, readFileSync } from 'fs'
import { join } from 'path'
import YAML from 'js-yaml'
import { DocumentDAO } from '~/lib/db/dao/document-dao'
import { DocumentProcessingPipeline } from '~/lib/rag/pipeline'
import { EmbeddingServiceFactory } from '~/lib/rag/embedding-adapter'
import { getModelManager } from '~/lib/ai/manager'

/**
 * 读取 ai-models.yaml 配置（本地文件系统优先，Vercel 降级为 serverAssets）
 */
async function readModelsConfig (): Promise<{ ai_models: { models: Record<string, any> } }> {
  const filePath = join(process.cwd(), 'config', 'ai-models.yaml')
  if (existsSync(filePath)) {
    const content = readFileSync(filePath, 'utf-8')
    return YAML.load(content) as { ai_models: { models: Record<string, any> } }
  }
  // Vercel 环境：从 serverAssets 读取（nitro.serverAssets 打包的内容）
  const storage = useStorage('assets:config')
  const content = await storage.getItem<string>('ai-models.yaml')
  if (!content) {
    throw new Error('ai-models.yaml not found in filesystem or serverAssets')
  }
  return YAML.load(content) as { ai_models: { models: Record<string, any> } }
}

/**
 * 异步处理文档向量化（fire-and-forget）
 * 调用方不需要 await，失败不影响主流程
 */
export async function processDocumentAsync(documentId: string, content: string): Promise<void> {
  console.log(`[AsyncQueue] Starting processing for document: ${documentId}`)

  await DocumentDAO.updateProcessingStatus(documentId, 'processing', {
    startedAt: new Date()
  })

  try {
    const runtimeConfig = useRuntimeConfig()
    const glmApiKey = runtimeConfig.glmApiKey as string | undefined
    const openaiApiKey = runtimeConfig.openaiApiKey as string | undefined

    const config = {
      anthropicApiKey: runtimeConfig.anthropicApiKey,
      openaiApiKey: runtimeConfig.openaiApiKey,
      googleApiKey: runtimeConfig.googleApiKey,
      glmApiKey: runtimeConfig.glmApiKey,
      dashscopeApiKey: runtimeConfig.dashscopeApiKey,
      baiduApiKey: runtimeConfig.baiduApiKey,
      deepseekApiKey: runtimeConfig.deepseekApiKey,
      ollamaBaseUrl: runtimeConfig.ollamaBaseUrl
    }
    const modelManager = getModelManager(config)
    const defaultModelId = modelManager.getDefaultModelId()

    const parsed = await readModelsConfig()
    const modelConfig = parsed.ai_models.models[defaultModelId]

    if (!modelConfig) {
      console.warn(`[AsyncQueue] No model config for ${defaultModelId}, skipping vectorization`)
      await DocumentDAO.updateProcessingStatus(documentId, 'completed', {
        completedAt: new Date()
      })
      return
    }

    const embeddingAdapter = await EmbeddingServiceFactory.createFromModelConfig(
      modelConfig,
      { glmApiKey, openaiApiKey }
    )

    if (embeddingAdapter) {
      const modelInfo = embeddingAdapter.getModelInfo()
      console.log(`[AsyncQueue] Using ${modelInfo.provider} embedding for document: ${documentId}`)

      const pipeline = new DocumentProcessingPipeline({ embeddingAdapter })
      const result = await pipeline.process(documentId, content)

      await DocumentDAO.updateProcessingStatus(documentId, 'completed', {
        chunksCount: result.chunksCreated,
        vectorsCount: result.vectorsAdded,
        completedAt: new Date()
      })

      console.log(`[AsyncQueue] Completed: ${documentId} (chunks=${result.chunksCreated}, vectors=${result.vectorsAdded})`)
    } else {
      console.warn(`[AsyncQueue] Model ${defaultModelId} does not support embedding, skipping vectorization`)
      await DocumentDAO.updateProcessingStatus(documentId, 'completed', {
        completedAt: new Date()
      })
    }
  } catch (error) {
    console.error(`[AsyncQueue] Failed for document ${documentId}:`, error)
    await DocumentDAO.updateProcessingStatus(documentId, 'failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      completedAt: new Date()
    })
  }
}
