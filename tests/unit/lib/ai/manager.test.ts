/**
 * ModelManager 单元测试
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock 适配器 - 必须在导入之前
vi.mock('~/lib/ai/adapters/claude', () => ({
  ClaudeAdapter: vi.fn().mockImplementation(function (this: any, apiKey: string, modelId: string) {
    this.name = 'Claude'
    this.provider = 'anthropic'
    this.modelId = modelId
    this.generateText = async () => 'Claude response'
    this.getCapabilities = () => ({
      supportsStreaming: true,
      supportsStructuredOutput: true,
      supportsVision: true,
      maxContextLength: 200000,
      supportedLanguages: ['en', 'zh']
    })
    this.estimateCost = () => ({
      inputCost: 0.003,
      outputCost: 0.015,
      currency: 'USD'
    })
    this.isAvailable = async () => true
  })
}))

vi.mock('~/lib/ai/adapters/openai', () => ({
  OpenAIAdapter: vi.fn().mockImplementation(function (this: any) {
    this.name = 'GPT-4o'
    this.provider = 'openai'
    this.modelId = 'gpt-4o'
    this.generateText = async () => 'OpenAI response'
    this.getCapabilities = () => ({
      supportsStreaming: true,
      supportsStructuredOutput: true,
      supportsVision: true,
      maxContextLength: 128000,
      supportedLanguages: ['en', 'zh']
    })
    this.estimateCost = () => ({
      inputCost: 0.0025,
      outputCost: 0.01,
      currency: 'USD'
    })
    this.isAvailable = async () => true
  })
}))

vi.mock('~/lib/ai/adapters/gemini', () => ({
  GeminiAdapter: vi.fn().mockImplementation(function (this: any) {
    this.name = 'Gemini'
    this.provider = 'google'
    this.modelId = 'gemini-1.5-pro'
    this.getCapabilities = () => ({
      supportsStreaming: true,
      maxContextLength: 1000000,
      supportedLanguages: ['en', 'zh']
    })
    this.isAvailable = async () => true
  })
}))

vi.mock('~/lib/ai/adapters/glm', () => ({
  GLMAdapter: vi.fn().mockImplementation(function (this: any, apiKey: string, modelId: string) {
    this.name = 'GLM'
    this.provider = 'zhipu'
    this.modelId = modelId
    this.getCapabilities = () => ({
      supportsStreaming: true,
      maxContextLength: 128000,
      supportedLanguages: ['zh', 'en']
    })
    this.isAvailable = async () => true
  })
}))

vi.mock('~/lib/ai/adapters/deepseek', () => ({
  DeepSeekAdapter: vi.fn().mockImplementation(function (this: any, apiKey: string, modelId: string) {
    this.name = 'DeepSeek'
    this.provider = 'deepseek'
    this.modelId = modelId
    this.getCapabilities = () => ({
      supportsStreaming: true,
      maxContextLength: 64000,
      supportedLanguages: ['zh', 'en']
    })
    this.isAvailable = async () => true
  })
}))

vi.mock('~/lib/ai/adapters/qwen', () => ({
  QwenAdapter: vi.fn().mockImplementation(function (this: any, apiKey: string, modelId: string) {
    this.name = 'Qwen'
    this.provider = 'qwen'
    this.modelId = modelId
    this.getCapabilities = () => ({
      supportsStreaming: true,
      maxContextLength: 32000,
      supportedLanguages: ['zh', 'en']
    })
    this.isAvailable = async () => true
  })
}))

vi.mock('~/lib/ai/adapters/wenxin', () => ({
  WenxinAdapter: vi.fn().mockImplementation(function (this: any, apiKey: string, modelId: string) {
    this.name = 'Wenxin'
    this.provider = 'baidu'
    this.modelId = modelId
    this.getCapabilities = () => ({
      supportsStreaming: true,
      maxContextLength: 8000,
      supportedLanguages: ['zh']
    })
    this.isAvailable = async () => true
  })
}))

vi.mock('~/lib/ai/adapters/ollama', () => ({
  OllamaAdapter: vi.fn().mockImplementation(function (this: any, baseUrl: string, modelId: string) {
    this.name = 'Ollama'
    this.provider = 'ollama'
    this.modelId = `ollama-${modelId}`
    this.getCapabilities = () => ({
      supportsStreaming: true,
      maxContextLength: 128000,
      supportedLanguages: ['en']
    })
    this.isAvailable = async () => true
  })
}))

import { ModelManager, getModelManager, resetModelManager, ModelProvider } from '~/lib/ai/manager'

describe('ModelManager', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetModelManager()
  })

  afterEach(() => {
    resetModelManager()
  })

  describe('constructor', () => {
    it('should create instance without config', () => {
      const manager = new ModelManager()
      expect(manager).toBeDefined()
      expect(manager.getAvailableModels()).toEqual([])
    })

    it('should initialize adapters with valid config', () => {
      const manager = new ModelManager({
        anthropicApiKey: 'test-key',
        openaiApiKey: 'test-key'
      })

      const models = manager.getAvailableModels()
      expect(models).toContain('claude-opus-4-20250514')
      expect(models).toContain('gpt-4o')
    })
  })

  describe('getAdapter', () => {
    it('should return adapter for existing model', () => {
      const manager = new ModelManager({ anthropicApiKey: 'test-key' })
      const adapter = manager.getAdapter('claude-opus-4-20250514')
      expect(adapter).toBeDefined()
      expect(adapter?.name).toBe('Claude')
    })

    it('should return null for non-existing model', () => {
      const manager = new ModelManager()
      const adapter = manager.getAdapter('non-existing-model')
      expect(adapter).toBeNull()
    })
  })

  describe('getAvailableModels', () => {
    it('should return all initialized model IDs', () => {
      const manager = new ModelManager({
        anthropicApiKey: 'test-key',
        openaiApiKey: 'test-key',
        googleApiKey: 'test-key'
      })

      const models = manager.getAvailableModels()
      expect(models.length).toBeGreaterThanOrEqual(3)
      expect(models).toContain('claude-opus-4-20250514')
      expect(models).toContain('gpt-4o')
      expect(models).toContain('gemini-2.0-flash')
    })
  })

  describe('selectModelByTask', () => {
    it('should select Claude for PRD generation', () => {
      // selectModelByTask maps 'prd_generation' to 'claude-3.5-sonnet'
      // so we need to pass that model explicitly
      const manager = new ModelManager({
        anthropicApiKey: 'test-key',
        anthropicModels: ['claude-3.5-sonnet']
      })
      const adapter = manager.selectModelByTask('prd_generation')
      expect(adapter?.modelId).toBe('claude-3.5-sonnet')
    })

    it('should select Gemini for large documents', () => {
      const manager = new ModelManager({ googleApiKey: 'test-key' })
      const adapter = manager.selectModelByTask('large_document')
      expect(adapter?.modelId).toBe('gemini-1.5-pro')
    })

    it('should select GPT-4o for general tasks', () => {
      const manager = new ModelManager({ openaiApiKey: 'test-key' })
      const adapter = manager.selectModelByTask('general')
      expect(adapter?.modelId).toBe('gpt-4o')
    })
  })

  describe('getModelInfo', () => {
    it('should return model info for existing model', () => {
      const manager = new ModelManager({ anthropicApiKey: 'test-key' })
      const info = manager.getModelInfo('claude-opus-4-20250514')
      expect(info).toBeDefined()
      expect(info?.modelId).toBe('claude-opus-4-20250514')
      expect(info?.capabilities).toBeDefined()
    })

    it('should return null for non-existing model', () => {
      const manager = new ModelManager()
      const info = manager.getModelInfo('non-existing')
      expect(info).toBeNull()
    })
  })

  describe('estimateCost', () => {
    it('should return cost estimate for existing model', () => {
      const manager = new ModelManager({ anthropicApiKey: 'test-key' })
      const cost = manager.estimateCost('claude-opus-4-20250514', 1000)
      expect(cost).toBeDefined()
      expect(cost?.inputCost).toBeTypeOf('number')
      expect(cost?.currency).toBe('USD')
    })

    it('should return null for non-existing model', () => {
      const manager = new ModelManager()
      const cost = manager.estimateCost('non-existing', 1000)
      expect(cost).toBeNull()
    })
  })

  describe('multi-provider support', () => {
    it('should initialize DeepSeek adapter with API key', () => {
      const manager = new ModelManager({ deepseekApiKey: 'test-key' })
      const models = manager.getAvailableModels()
      expect(models).toContain('deepseek-chat')
      expect(models).toContain('deepseek-reasoner')
    })

    it('should initialize Qwen adapter with Dashscope API key', () => {
      const manager = new ModelManager({ dashscopeApiKey: 'test-key' })
      const models = manager.getAvailableModels()
      expect(models).toContain('qwen-max')
      expect(models).toContain('qwen-plus')
    })

    it('should initialize Ollama adapter with base URL', () => {
      const manager = new ModelManager({ ollamaBaseUrl: 'http://localhost:11434' })
      const models = manager.getAvailableModels()
      expect(models).toContain('ollama-llama3.2')
    })
  })
})

describe('getModelManager singleton', () => {
  beforeEach(() => {
    resetModelManager()
  })

  afterEach(() => {
    resetModelManager()
  })

  it('should return the same instance', () => {
    const instance1 = getModelManager({ anthropicApiKey: 'test' })
    const instance2 = getModelManager()
    expect(instance1).toBe(instance2)
  })
})

describe('ModelProvider enum', () => {
  it('should have all provider values', () => {
    expect(ModelProvider.CLAUDE).toBe('claude')
    expect(ModelProvider.OPENAI).toBe('openai')
    expect(ModelProvider.GEMINI).toBe('gemini')
    expect(ModelProvider.DEEPSEEK).toBe('deepseek')
    expect(ModelProvider.QWEN).toBe('qwen')
    expect(ModelProvider.OLLAMA).toBe('ollama')
  })
})
