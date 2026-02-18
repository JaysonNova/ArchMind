/**
 * 获取可用的 AI 模型列表
 * 返回后端已配置且有 API Key 的所有模型及其元数据
 * 支持从环境变量或用户配置的数据库中读取 API Key
 */

import { getModelManager } from '~/lib/ai/manager'
import { UserAPIConfigDAO } from '~/lib/db/dao/user-api-config-dao'

export default defineEventHandler(async (event) => {
  const t = useServerT(event)
  try {
    const runtimeConfig = useRuntimeConfig()

    // 首先尝试从数据库获取用户配置的 API Keys
    const userConfigs = await UserAPIConfigDAO.getAllEnabledWithKeys()
    const userConfigMap = new Map(userConfigs.map(c => [c.provider, c]))

    // 构建配置，优先使用用户配置，否则使用环境变量
    const config: Record<string, any> = {}

    // Anthropic (Claude)
    const anthropicConfig = userConfigMap.get('anthropic')
    config.anthropicApiKey = anthropicConfig?.apiKey || runtimeConfig.anthropicApiKey

    // OpenAI (GPT)
    const openaiConfig = userConfigMap.get('openai')
    config.openaiApiKey = openaiConfig?.apiKey || runtimeConfig.openaiApiKey

    // Google (Gemini)
    const googleConfig = userConfigMap.get('google')
    config.googleApiKey = googleConfig?.apiKey || runtimeConfig.googleApiKey

    // DeepSeek
    const deepseekConfig = userConfigMap.get('deepseek')
    config.deepseekApiKey = deepseekConfig?.apiKey || runtimeConfig.deepseekApiKey

    // 通义千问 (Qwen)
    const qwenConfig = userConfigMap.get('qwen')
    config.dashscopeApiKey = qwenConfig?.apiKey || runtimeConfig.dashscopeApiKey

    // 文心一言 (Wenxin)
    const wenxinConfig = userConfigMap.get('wenxin')
    config.baiduApiKey = wenxinConfig?.apiKey || runtimeConfig.baiduApiKey

    // 智谱 GLM
    const glmConfig = userConfigMap.get('glm')
    config.glmApiKey = glmConfig?.apiKey || runtimeConfig.glmApiKey

    // Ollama (本地)
    const ollamaConfig = userConfigMap.get('ollama')
    config.ollamaBaseUrl = ollamaConfig?.baseUrl || runtimeConfig.ollamaBaseUrl

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
