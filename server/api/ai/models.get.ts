/**
 * 获取可用的 AI 模型列表
 * 返回后端已配置且有 API Key 的所有模型及其元数据
 */

import { getModelManager } from '~/lib/ai/manager'

export default defineEventHandler(async (event) => {
  const t = useServerT(event)
  try {
    const runtimeConfig = useRuntimeConfig()
    // Extract API keys from runtime config
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

    // 获取所有启用且已初始化的模型及其元数据
    const availableModels = modelManager.getAvailableModelsWithMetadata()

    if (availableModels.length === 0) {
      console.warn('No AI models configured with available API keys')
      setResponseStatus(event, 400)
      return {
        success: false,
        message: t('errors.noAiModelsConfigured')
      }
    }

    // 获取默认模型
    const defaultModel = modelManager.getDefaultModelId()

    return {
      success: true,
      data: {
        availableModels,
        defaultModel,
        selectedModel: defaultModel // 可以后续从用户偏好中读取
      }
    }
  } catch (error) {
    console.error('Error getting available models:', error)
    setResponseStatus(event, 500)
    return {
      success: false,
      message: error instanceof Error ? error.message : t(ErrorKeys.UNKNOWN_ERROR)
    }
  }
})

