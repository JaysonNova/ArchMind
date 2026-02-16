/**
 * 全局 Mock 设置
 */

import { vi, beforeAll, afterAll } from 'vitest'

// Mock 文件系统操作
vi.mock('fs', () => ({
  readFileSync: vi.fn().mockReturnValue(`
ai_models:
  default: claude-3.5-sonnet
  fallback:
    - gpt-4o
    - glm-4.7
  preferences:
    prd_generation:
      - claude-3.5-sonnet
      - gpt-4o
    chinese_content:
      - qwen-max
      - glm-4.7
  models:
    claude-3.5-sonnet:
      enabled: true
      name: Claude 3.5 Sonnet
      provider: anthropic
      description: Most capable Claude model
      api_key_env: ANTHROPIC_API_KEY
      capabilities:
        maxContextLength: 200000
        supportsStreaming: true
        supportsStructuredOutput: true
        supportsVision: true
        supportedLanguages: [en, zh, ja]
      costEstimate:
        input: "$3/1M tokens"
        output: "$15/1M tokens"
    gpt-4o:
      enabled: true
      name: GPT-4o
      provider: openai
      description: OpenAI flagship model
      api_key_env: OPENAI_API_KEY
      capabilities:
        maxContextLength: 128000
        supportsStreaming: true
        supportsStructuredOutput: true
        supportsVision: true
        supportedLanguages: [en, zh]
      costEstimate:
        input: "$2.5/1M tokens"
        output: "$10/1M tokens"
`),
  existsSync: vi.fn().mockReturnValue(true),
  writeFileSync: vi.fn()
}))

// Mock PostgreSQL
vi.mock('pg', () => ({
  Pool: vi.fn().mockImplementation(() => ({
    query: vi.fn().mockResolvedValue({ rows: [], rowCount: 0 }),
    connect: vi.fn().mockResolvedValue({
      query: vi.fn().mockResolvedValue({ rows: [], rowCount: 0 }),
      release: vi.fn()
    }),
    end: vi.fn(),
    on: vi.fn()
  }))
}))

// Mock pgvector
vi.mock('pgvector', () => ({
  serializeVector: vi.fn().mockReturnValue('[0.1,0.2,0.3]'),
  deserializeVector: vi.fn().mockReturnValue([0.1, 0.2, 0.3])
}))

// Mock Anthropic SDK
vi.mock('@anthropic-ai/sdk', () => ({
  default: vi.fn().mockImplementation(() => ({
    messages: {
      create: vi.fn().mockResolvedValue({
        id: 'msg-123',
        content: [{ type: 'text', text: 'Mock Claude response' }]
      }),
      stream: vi.fn().mockImplementation(async function* () {
        yield { type: 'content_block_delta', delta: { type: 'text_delta', text: 'Mock ' } }
        yield { type: 'content_block_delta', delta: { type: 'text_delta', text: 'stream' } }
      })
    }
  }))
}))

// Mock OpenAI SDK
vi.mock('openai', () => ({
  default: vi.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: vi.fn().mockResolvedValue({
          id: 'chatcmpl-123',
          choices: [{ message: { content: 'Mock OpenAI response' } }]
        })
      }
    },
    embeddings: {
      create: vi.fn().mockResolvedValue({
        data: [{ embedding: new Array(1536).fill(0.1) }]
      })
    }
  }))
}))

// Mock Google Generative AI
vi.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: vi.fn().mockImplementation(() => ({
    getGenerativeModel: vi.fn().mockReturnValue({
      generateContent: vi.fn().mockResolvedValue({
        response: { text: () => 'Mock Gemini response' }
      })
    })
  }))
}))

// Mock Nuxt $fetch
global.$fetch = vi.fn().mockResolvedValue({ success: true, data: [] }) as any

// Mock console methods for cleaner test output
const originalConsoleError = console.error
const originalConsoleWarn = console.warn

beforeAll(() => {
  console.error = vi.fn()
  console.warn = vi.fn()
})

afterAll(() => {
  console.error = originalConsoleError
  console.warn = originalConsoleWarn
})
