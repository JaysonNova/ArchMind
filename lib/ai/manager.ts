/**
 * AI 模型管理器
 * 管理多个 AI 模型适配器，提供模型选择、路由和缓存
 */

import { readFileSync } from 'fs'
import { join } from 'path'
import YAML from 'js-yaml'
import { ClaudeAdapter } from './adapters/claude'
import { OpenAIAdapter } from './adapters/openai'
import { GeminiAdapter } from './adapters/gemini'
import { GLMAdapter } from './adapters/glm'
import { DeepSeekAdapter } from './adapters/deepseek'
import { QwenAdapter } from './adapters/qwen'
import { WenxinAdapter } from './adapters/wenxin'
import { OllamaAdapter } from './adapters/ollama'
import type { AIModelAdapter } from '~/lib/ai/types'
import type { AvailableModelInfo } from '~/types/settings'

export enum ModelProvider {
  CLAUDE = 'claude',
  OPENAI = 'openai',
  GEMINI = 'gemini',
  GLM = 'glm',
  DEEPSEEK = 'deepseek',
  QWEN = 'qwen',
  WENXIN = 'wenxin',
  OLLAMA = 'ollama'
}

interface ModelConfig {
  enabled: boolean
  name: string
  provider: string
  description: string
  api_key_env: string
  capabilities: {
    maxContextLength: number
    supportsStreaming: boolean
    supportsStructuredOutput: boolean
    supportsVision: boolean
    supportedLanguages: string[]
  }
  costEstimate: {
    input: string
    output: string
  }
}

interface AIModelsConfig {
  default: string
  fallback: string[]
  preferences: Record<string, string[]>
  models: Record<string, ModelConfig>
}

export class ModelManager {
  private adapters: Map<string, AIModelAdapter> = new Map()
  private cache: Map<string, AIModelAdapter> = new Map()
  private modelConfig: AIModelsConfig | null = null

  constructor (config?: Record<string, any>) {
    this.loadModelConfig()
    this.initializeAdapters(config)
  }

  /**
   * 从 YAML 配置文件加载模型配置
   */
  private loadModelConfig () {
    try {
      // 在 Nuxt 中运行时，应该是在项目根目录中查找
      const configPath = join(process.cwd(), 'config', 'ai-models.yaml')
      const content = readFileSync(configPath, 'utf-8')
      const parsed = YAML.load(content) as { ai_models: AIModelsConfig }
      this.modelConfig = parsed.ai_models
    } catch (error) {
      console.warn('Failed to load ai-models.yaml config:', error)
      this.modelConfig = null
    }
  }

  /**
   * 初始化所有适配器
   */
  initializeAdapters (config?: Record<string, any>) {
    // 如果没有提供配置，则跳过初始化
    if (!config) {
      return
    }

    // Claude 适配器
    if (config.anthropicApiKey) {
      const claude = new ClaudeAdapter(config.anthropicApiKey as string)
      this.adapters.set('claude-3.5-sonnet', claude)
    }

    // OpenAI 适配器
    if (config.openaiApiKey) {
      const openai = new OpenAIAdapter(config.openaiApiKey as string, 'gpt-4o')
      this.adapters.set('gpt-4o', openai)
    }

    // Gemini 适配器
    if (config.googleApiKey) {
      const gemini = new GeminiAdapter(config.googleApiKey as string)
      this.adapters.set('gemini-1.5-pro', gemini)
    }

    // GLM 适配器 - 为每个 GLM 模型创建实例
    if (config.glmApiKey) {
      const glmModels = ['glm-4.7', 'glm-4.6v', 'glm-4.5-air', 'glm-4-flash']
      for (const modelId of glmModels) {
        const glm = new GLMAdapter(config.glmApiKey as string, modelId)
        this.adapters.set(modelId, glm)
      }
    }

    // DeepSeek 适配器
    if (config.deepseekApiKey) {
      const deepseekModels = ['deepseek-chat', 'deepseek-reasoner']
      for (const modelId of deepseekModels) {
        const deepseek = new DeepSeekAdapter(config.deepseekApiKey as string, modelId)
        this.adapters.set(modelId, deepseek)
      }
    }

    // 通义千问 (Qwen) 适配器
    if (config.dashscopeApiKey) {
      const qwenModels = ['qwen-max', 'qwen-plus', 'qwen-turbo']
      for (const modelId of qwenModels) {
        const qwen = new QwenAdapter(config.dashscopeApiKey as string, modelId)
        this.adapters.set(modelId, qwen)
      }
    }

    // 文心一言 (Wenxin) 适配器
    // 注意：文心一言需要 API Key 和 Secret Key，格式为 "apiKey|secretKey"
    if (config.baiduApiKey) {
      const wenxinModels = ['ernie-4.0-8k', 'ernie-3.5-8k']
      for (const modelId of wenxinModels) {
        const wenxin = new WenxinAdapter(config.baiduApiKey as string, modelId)
        this.adapters.set(modelId, wenxin)
      }
    }

    // Ollama 本地模型适配器
    if (config.ollamaBaseUrl) {
      const ollamaModels = ['llama3.2', 'qwen2.5', 'deepseek-r1']
      for (const modelId of ollamaModels) {
        const ollama = new OllamaAdapter(config.ollamaBaseUrl as string, modelId)
        this.adapters.set(`ollama-${modelId}`, ollama)
      }
    }
  }

  /**
   * 获取指定的模型适配器
   */
  getAdapter (modelId: string): AIModelAdapter | null {
    return this.adapters.get(modelId) || null
  }

  /**
   * 获取所有可用的模型
   */
  getAvailableModels (): string[] {
    return Array.from(this.adapters.keys())
  }

  /**
   * 根据任务类型选择最合适的模型
   */
  selectModelByTask (taskType: string): AIModelAdapter | null {
    // 根据配置或策略选择模型
    const modelMap: Record<string, string> = {
      prd_generation: 'claude-3.5-sonnet', // PRD 生成优先使用 Claude
      chinese_content: 'glm-4.7', // 中文内容优先使用 GLM（成本低廉）
      large_document: 'gemini-1.5-pro', // 大文件优先使用 Gemini
      general: 'gpt-4o' // 通用使用 GPT-4o
    }

    const modelId = modelMap[taskType] || 'claude-3.5-sonnet'
    return this.getAdapter(modelId)
  }

  /**
   * 获取模型的详细信息
   */
  getModelInfo (modelId: string) {
    const adapter = this.getAdapter(modelId)
    if (!adapter) {
      return null
    }

    return {
      modelId: adapter.modelId,
      name: adapter.name,
      provider: adapter.provider,
      capabilities: adapter.getCapabilities()
    }
  }

  /**
   * 获取所有模型的信息
   */
  getAllModelsInfo () {
    return Array.from(this.adapters.values()).map(adapter => ({
      modelId: adapter.modelId,
      name: adapter.name,
      provider: adapter.provider,
      capabilities: adapter.getCapabilities()
    }))
  }

  /**
   * 获取所有启用的模型及其元数据（用于前端展示）
   * 只返回已实际初始化的模型（即后端有对应的 API Key）
   */
  getAvailableModelsWithMetadata (): AvailableModelInfo[] {
    if (!this.modelConfig) {
      return []
    }

    const result: AvailableModelInfo[] = []

    for (const [modelId, config] of Object.entries(this.modelConfig.models)) {
      // 只包括启用且已初始化的模型
      if (config.enabled && this.adapters.has(modelId)) {
        result.push({
          id: modelId,
          name: config.name,
          provider: config.provider,
          description: config.description,
          capabilities: config.capabilities,
          costEstimate: config.costEstimate
        })
      }
    }

    return result
  }

  /**
   * 获取默认模型 ID
   */
  getDefaultModelId (): string {
    return this.modelConfig?.default || 'glm-4.7'
  }

  /**
   * 检查模型是否可用
   */
  async isModelAvailable (modelId: string): Promise<boolean> {
    const adapter = this.getAdapter(modelId)
    if (!adapter) {
      return false
    }

    return await adapter.isAvailable()
  }

  /**
   * 估算成本
   */
  estimateCost (modelId: string, tokens: number) {
    const adapter = this.getAdapter(modelId)
    if (!adapter) {
      return null
    }

    return adapter.estimateCost(tokens)
  }
}

// 创建单例
let managerInstance: ModelManager | null = null

export function getModelManager (config?: Record<string, any>): ModelManager {
  if (!managerInstance) {
    managerInstance = new ModelManager(config)
  } else if (config && Object.keys(config).length > 0) {
    // 如果已经有实例但收到新的有效配置，重新初始化适配器
    // 这确保了在运行时配置更新时，模型管理器能正确地重新初始化
    managerInstance.initializeAdapters(config)
  }
  return managerInstance
}

/**
 * 重置模型管理器（主要用于测试或强制重新加载配置）
 */
export function resetModelManager (): void {
  managerInstance = null
}
