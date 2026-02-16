/**
 * PRD Generator 单元测试
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { buildPRDPrompt, PRD_SYSTEM_PROMPT } from '~/lib/ai/prompts/prd-system'

// Mock 依赖 - 必须在导入之前
vi.mock('~/lib/ai/manager', () => ({
  ModelManager: vi.fn().mockImplementation(function (this: any) {
    this.getAdapter = () => ({
      name: 'Mock',
      provider: 'test',
      modelId: 'mock-model',
      generateText: async () => 'Generated PRD content',
      generateStream: async function* (): AsyncGenerator<string> {
        yield 'Mock '
        yield 'stream '
        yield 'response'
      },
      getCapabilities: () => ({
        supportsStreaming: true,
        maxContextLength: 8000,
        supportedLanguages: ['en', 'zh']
      }),
      estimateCost: () => ({
        inputCost: 0.01,
        outputCost: 0.02,
        currency: 'USD'
      }),
      isAvailable: async () => true
    })
    this.estimateCost = () => ({
      inputCost: 0.01,
      outputCost: 0.02,
      currency: 'USD'
    })
    this.getAvailableModels = () => ['mock-model']
  })
}))

vi.mock('~/lib/rag/retriever', () => ({
  RAGRetriever: vi.fn().mockImplementation(function (this: any) {
    this.retrieve = async () => [
      { id: 'chunk-1', documentId: 'doc-1', content: 'Test content', similarity: 0.85 }
    ]
    this.summarizeResults = () => 'Summarized context'
  })
}))

vi.mock('~/lib/db/dao/prd-dao', () => ({
  PRDDAO: {
    create: async () => ({
      id: 'prd-test-123',
      title: 'Test PRD',
      content: 'Generated content',
      createdAt: new Date(),
      updatedAt: new Date()
    }),
    addReferences: async () => undefined
  }
}))

vi.mock('~/lib/db/dao/document-dao', () => ({
  DocumentDAO: {
    findById: async () => ({
      id: 'doc-1',
      content: 'Document content for testing'
    })
  }
}))

import { PRDGenerator } from '~/lib/prd/generator'

describe('buildPRDPrompt', () => {
  it('should build prompt with user input only', () => {
    const prompt = buildPRDPrompt('Create a login feature', '')

    expect(prompt).toContain('Create a login feature')
    expect(prompt).toContain(PRD_SYSTEM_PROMPT)
  })

  it('should build prompt with background context', () => {
    const context = 'Previous document about authentication system'
    const prompt = buildPRDPrompt('Create SSO feature', context)

    expect(prompt).toContain('Create SSO feature')
    expect(prompt).toContain(context)
    expect(prompt).toContain('背景信息')
  })

  it('should include few-shot examples when provided', () => {
    const examples = [
      {
        userInput: 'Example input',
        context: 'Example context',
        prdOutput: 'Example PRD output'
      }
    ]

    const prompt = buildPRDPrompt('Test input', '', examples)

    expect(prompt).toContain('参考示例')
    expect(prompt).toContain('Example input')
    expect(prompt).toContain('Example PRD output')
  })

  it('should include thinking process instructions', () => {
    const prompt = buildPRDPrompt('Test', '')

    expect(prompt).toContain('思考过程')
    expect(prompt).toContain('需求解析')
    expect(prompt).toContain('逻辑建模')
  })

  it('should handle empty user input', () => {
    const prompt = buildPRDPrompt('', '')

    expect(prompt).toBeDefined()
    expect(prompt.length).toBeGreaterThan(0)
  })

  it('should handle special characters in input', () => {
    const specialInput = 'Create feature with **markdown** and `code` and {{variables}}'
    const prompt = buildPRDPrompt(specialInput, '')

    expect(prompt).toContain(specialInput)
  })
})

describe('PRD_SYSTEM_PROMPT', () => {
  it('should contain role definition', () => {
    expect(PRD_SYSTEM_PROMPT).toContain('角色定义')
    expect(PRD_SYSTEM_PROMPT).toContain('Alex Chen')
  })

  it('should contain core capabilities', () => {
    expect(PRD_SYSTEM_PROMPT).toContain('核心能力')
    expect(PRD_SYSTEM_PROMPT).toContain('需求深度分析')
    expect(PRD_SYSTEM_PROMPT).toContain('逻辑建模与补全')
  })

  it('should contain PRD output standards', () => {
    expect(PRD_SYSTEM_PROMPT).toContain('PRD 输出标准')
    expect(PRD_SYSTEM_PROMPT).toContain('产品概述')
    expect(PRD_SYSTEM_PROMPT).toContain('核心功能')
    expect(PRD_SYSTEM_PROMPT).toContain('成功指标')
  })

  it('should contain quality standards', () => {
    expect(PRD_SYSTEM_PROMPT).toContain('质量标准')
    expect(PRD_SYSTEM_PROMPT).toContain('完整性')
    expect(PRD_SYSTEM_PROMPT).toContain('可执行性')
  })

  it('should contain constraints', () => {
    expect(PRD_SYSTEM_PROMPT).toContain('约束条件')
    expect(PRD_SYSTEM_PROMPT).toContain('3000-6000 字')
    expect(PRD_SYSTEM_PROMPT).toContain('SMART 原则')
  })
})

describe('PRDGenerator', () => {
  let generator: PRDGenerator

  beforeEach(() => {
    vi.clearAllMocks()
    generator = new PRDGenerator()
  })

  describe('constructor', () => {
    it('should create generator without embedding adapter', () => {
      const gen = new PRDGenerator()
      expect(gen).toBeDefined()
    })
  })

  describe('generate', () => {
    it('should generate PRD with minimal options', async () => {
      const result = await generator.generate('Create a user login feature')

      expect(result).toHaveProperty('prdId')
      expect(result).toHaveProperty('title')
      expect(result).toHaveProperty('content')
      expect(result).toHaveProperty('model')
      expect(result).toHaveProperty('tokenCount')
      expect(result).toHaveProperty('estimatedCost')
      expect(result).toHaveProperty('generationTime')
      expect(result).toHaveProperty('references')
    })

    it('should use custom temperature and maxTokens', async () => {
      const result = await generator.generate('Test input', {
        temperature: 0.5,
        maxTokens: 4000
      })

      expect(result).toBeDefined()
    })
  })

  describe('generateStream', () => {
    it('should yield chunks from stream', async () => {
      const chunks: string[] = []
      const stream = generator.generateStream('Test input')

      for await (const chunk of stream) {
        chunks.push(chunk)
      }

      expect(chunks.length).toBeGreaterThan(0)
      expect(chunks.join('')).toContain('Mock')
    })
  })
})
