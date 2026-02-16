/**
 * 测试工具函数
 */

import { vi } from 'vitest'

/**
 * 创建模拟的 AI 模型适配器
 */
export function createMockAdapter (overrides: Partial<any> = {}) {
  return {
    name: 'Mock Model',
    provider: 'mock',
    modelId: 'mock-model',
    generateText: vi.fn().mockResolvedValue('Mock response'),
    generateStream: vi.fn().mockImplementation(async function* () {
      yield 'Mock '
      yield 'stream '
      yield 'response'
    }),
    getCapabilities: vi.fn().mockReturnValue({
      supportsStreaming: true,
      supportsStructuredOutput: true,
      supportsVision: false,
      maxContextLength: 8192,
      supportedLanguages: ['en', 'zh']
    }),
    estimateCost: vi.fn().mockReturnValue({
      inputCost: 0.01,
      outputCost: 0.02,
      currency: 'USD'
    }),
    isAvailable: vi.fn().mockResolvedValue(true),
    ...overrides
  }
}

/**
 * 创建模拟的 Embedding 适配器
 */
export function createMockEmbeddingAdapter () {
  return {
    embed: vi.fn().mockResolvedValue(new Array(1536).fill(0.1)),
    embedBatch: vi.fn().mockResolvedValue([new Array(1536).fill(0.1)]),
    getDimension: vi.fn().mockReturnValue(1536)
  }
}

/**
 * 创建模拟的 RAG 检索器
 */
export function createMockRAGRetriever () {
  return {
    retrieve: vi.fn().mockResolvedValue([
      {
        id: 'chunk-1',
        documentId: 'doc-1',
        content: 'Test content chunk 1',
        similarity: 0.85
      },
      {
        id: 'chunk-2',
        documentId: 'doc-1',
        content: 'Test content chunk 2',
        similarity: 0.75
      }
    ]),
    summarizeResults: vi.fn().mockReturnValue('Summarized context')
  }
}

/**
 * 创建模拟的数据库客户端
 */
export function createMockDbClient () {
  return {
    query: vi.fn(),
    execute: vi.fn(),
    transaction: vi.fn((fn) => fn()),
    pool: {
      query: vi.fn(),
      end: vi.fn()
    }
  }
}

/**
 * 模拟 localStorage
 */
export function mockLocalStorage () {
  const store: Record<string, string> = {}

  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key]
    }),
    clear: vi.fn(() => {
      Object.keys(store).forEach(key => delete store[key])
    }),
    get length () {
      return Object.keys(store).length
    },
    key: vi.fn((index: number) => Object.keys(store)[index] || null)
  }
}

/**
 * 等待指定毫秒
 */
export function sleep (ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * 创建测试用的文本块
 */
export function createTestChunks (count: number = 3) {
  return Array.from({ length: count }, (_, i) => ({
    id: `chunk-${i + 1}`,
    documentId: `doc-${Math.floor(i / 2) + 1}`,
    content: `This is test chunk content number ${i + 1}. It contains some text for testing purposes.`,
    embedding: new Array(1536).fill(0.1),
    similarity: 0.9 - i * 0.1,
    metadata: { page: i + 1 }
  }))
}

/**
 * 创建测试用的 PRD 文档
 */
export function createTestPRD () {
  return `# 产品需求文档：测试产品

## 1. 产品概述
产品名称：测试产品
一句话定位：这是一个用于测试的产品

## 2. 业务背景
市场机会分析内容...

## 3. 用户需求分析
- 用户画像1
- 用户画像2

## 4. 核心功能
### 4.1 功能1
功能描述内容...

## 5. 技术架构概览
技术栈描述...

## 6. 成功指标
- DAU 目标：10000+
- 转化率：>5%

## 7. 实施计划
第一阶段：MVP开发

## 8. 风险与假设
- 假设1
- 风险1

## 9. 竞争分析
竞品分析内容...

## 10. 附录与参考
参考资料...`
}

/**
 * 模拟 $fetch 函数
 */
export function mockFetch (response: any, options: { error?: boolean } = {}) {
  const fetchFn = vi.fn()

  if (options.error) {
    fetchFn.mockRejectedValue(new Error('Fetch error'))
  } else {
    fetchFn.mockResolvedValue(response)
  }

  return fetchFn
}
