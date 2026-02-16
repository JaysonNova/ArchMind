/**
 * Claude Adapter 单元测试
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock Anthropic SDK - 必须在导入之前
vi.mock('@anthropic-ai/sdk', () => ({
  default: vi.fn().mockImplementation(function (this: any) {
    this.messages = {
      create: vi.fn().mockResolvedValue({
        id: 'msg-test-123',
        content: [{ type: 'text', text: 'Hello, this is Claude!' }]
      }),
      stream: vi.fn().mockImplementation(async function* () {
        yield { type: 'content_block_delta', delta: { type: 'text_delta', text: 'Hello ' } }
        yield { type: 'content_block_delta', delta: { type: 'text_delta', text: 'World!' } }
      })
    }
  })
}))

import Anthropic from '@anthropic-ai/sdk'
import { ClaudeAdapter } from '~/lib/ai/adapters/claude'

describe('ClaudeAdapter', () => {
  let adapter: ClaudeAdapter

  beforeEach(() => {
    vi.clearAllMocks()
    adapter = new ClaudeAdapter('test-api-key')
  })

  describe('constructor', () => {
    it('should create adapter with default model ID', () => {
      const defaultAdapter = new ClaudeAdapter('test-key')
      expect(defaultAdapter.modelId).toBe('claude-3-5-sonnet-20241022')
    })

    it('should create adapter with custom model ID', () => {
      const customAdapter = new ClaudeAdapter('test-key', 'claude-3-opus')
      expect(customAdapter.modelId).toBe('claude-3-opus')
    })

    it('should have correct name and provider', () => {
      expect(adapter.name).toBe('Claude')
      expect(adapter.provider).toBe('anthropic')
    })

    it('should initialize Anthropic client', () => {
      expect(Anthropic).toHaveBeenCalledWith({ apiKey: 'test-api-key' })
    })
  })

  describe('getCapabilities', () => {
    it('should return correct capabilities', () => {
      const capabilities = adapter.getCapabilities()

      expect(capabilities.supportsStreaming).toBe(true)
      expect(capabilities.supportsStructuredOutput).toBe(true)
      expect(capabilities.supportsVision).toBe(true)
      expect(capabilities.maxContextLength).toBe(200000)
      expect(capabilities.supportedLanguages).toContain('en')
      expect(capabilities.supportedLanguages).toContain('zh')
    })
  })

  describe('estimateCost', () => {
    it('should calculate cost for tokens', () => {
      // Claude 3.5 Sonnet: $3/1M input, $15/1M output
      const cost = adapter.estimateCost(1000)

      expect(cost.inputCost).toBeCloseTo(0.0015, 4) // 500 tokens * $3/1M
      expect(cost.outputCost).toBeCloseTo(0.0075, 4) // 500 tokens * $15/1M
      expect(cost.currency).toBe('USD')
    })

    it('should handle large token counts', () => {
      const cost = adapter.estimateCost(1000000)

      expect(cost.inputCost).toBe(1.5) // 500K * $3/1M
      expect(cost.outputCost).toBe(7.5) // 500K * $15/1M
    })

    it('should handle zero tokens', () => {
      const cost = adapter.estimateCost(0)

      expect(cost.inputCost).toBe(0)
      expect(cost.outputCost).toBe(0)
    })
  })

  describe('generateText', () => {
    it('should generate text successfully', async () => {
      const result = await adapter.generateText('Hello')

      expect(result).toBe('Hello, this is Claude!')
    })
  })

  describe('generateStream', () => {
    it('should yield text chunks from stream', async () => {
      const chunks: string[] = []
      for await (const chunk of adapter.generateStream('test')) {
        chunks.push(chunk)
      }

      expect(chunks).toEqual(['Hello ', 'World!'])
    })
  })

  describe('isAvailable', () => {
    it('should return true when API responds', async () => {
      const available = await adapter.isAvailable()
      expect(available).toBe(true)
    })
  })
})
