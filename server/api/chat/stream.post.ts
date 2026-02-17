import { readFileSync } from 'fs'
import { join } from 'path'
import YAML from 'js-yaml'
import { ChatEngine } from '~/lib/chat/engine'
import { getModelManager } from '~/lib/ai/manager'
import { EmbeddingServiceFactory } from '~/lib/rag/embedding-adapter'
import type { ConversationMessage, ConversationTargetType, ConversationTargetContext } from '~/types/conversation'

interface ChatStreamRequest {
  message: string
  history?: ConversationMessage[]
  modelId?: string
  useRAG?: boolean
  temperature?: number
  maxTokens?: number
  target?: ConversationTargetType
  targetContext?: ConversationTargetContext
}

export default defineEventHandler(async (event) => {
  const t = useServerT(event)
  try {
    const body = await readBody<ChatStreamRequest>(event)

    if (!body.message) {
      setResponseStatus(event, 400)
      return { success: false, message: t('errors.messageRequired') }
    }

    // 设置 SSE 响应头
    setHeader(event, 'Content-Type', 'text/event-stream')
    setHeader(event, 'Cache-Control', 'no-cache')
    setHeader(event, 'Connection', 'keep-alive')

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
    const modelId = body.modelId || modelManager.getDefaultModelId()

    // 验证模型
    const selectedModel = modelManager.getAdapter(modelId)
    if (!selectedModel) {
      event.node.res.write(`data: ${JSON.stringify({ error: t('errors.noAiModelsConfigured') })}\n\n`)
      event.node.res.end()
      return
    }

    // 初始化 Embedding（如果需要 RAG）
    let embeddingAdapter = null
    if (body.useRAG) {
      try {
        const configPath = join(process.cwd(), 'config', 'ai-models.yaml')
        const content = readFileSync(configPath, 'utf-8')
        const parsed = YAML.load(content) as { ai_models: { models: Record<string, any> } }
        const modelConfig = parsed.ai_models.models[modelId]

        if (modelConfig) {
          embeddingAdapter = await EmbeddingServiceFactory.createFromModelConfig(
            modelConfig,
            { glmApiKey, openaiApiKey }
          )
        }
      } catch (error) {
        console.error('[RAG] 初始化 Embedding 失败:', error)
      }
    }

    // 创建对话引擎
    const engine = new ChatEngine(embeddingAdapter || undefined, config, {
      target: body.target || 'prd',
      targetContext: body.targetContext
    })

    // 流式生成
    const stream = engine.chatStream(body.message, body.history || [], {
      modelId,
      temperature: body.temperature,
      maxTokens: body.maxTokens,
      useRAG: body.useRAG === true && embeddingAdapter !== null
    })

    let fullContent = ''
    for await (const chunk of stream) {
      fullContent += chunk
      event.node.res.write(`data: ${JSON.stringify({ chunk, done: false })}\n\n`)
    }

    // 判断是否包含 PRD 内容(包含多个标准章节标题)
    const isPRD = (fullContent.includes('## 1.') || fullContent.includes('### 1.')) &&
                  (fullContent.includes('产品概述') || fullContent.includes('核心功能') || fullContent.includes('用户需求'))

    // 发送完成信号,如果是PRD则同时发送完整内容
    event.node.res.write(`data: ${JSON.stringify({
      chunk: '',
      done: true,
      isPRD,
      fullContent: isPRD ? fullContent : undefined
    })}\n\n`)
    event.node.res.end()
  } catch (error) {
    console.error('Chat stream error:', error)
    setResponseStatus(event, 500)
    return {
      success: false,
      message: error instanceof Error ? error.message : t(ErrorKeys.UNKNOWN_ERROR)
    }
  }
})
