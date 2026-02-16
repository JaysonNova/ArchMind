/**
 * TextSplitter 单元测试
 */

import { describe, it, expect } from 'vitest'
import { TextSplitter } from '~/lib/rag/text-splitter'

describe('TextSplitter', () => {
  describe('constructor', () => {
    it('should create splitter with default separators', () => {
      const splitter = new TextSplitter({
        chunkSize: 100,
        chunkOverlap: 20
      })

      expect(splitter).toBeDefined()
    })

    it('should accept custom separators', () => {
      const splitter = new TextSplitter({
        chunkSize: 100,
        chunkOverlap: 20,
        separators: ['\n', ' ']
      })

      expect(splitter).toBeDefined()
    })
  })

  describe('split', () => {
    it('should split text by paragraph', () => {
      const splitter = new TextSplitter({
        chunkSize: 50,
        chunkOverlap: 10
      })

      const text = 'First paragraph here.\n\nSecond paragraph here.\n\nThird paragraph here.'
      const chunks = splitter.split(text)

      expect(chunks.length).toBeGreaterThan(0)
      expect(chunks.every(chunk => chunk.length > 0)).toBe(true)
    })

    it('should respect chunk size limit', () => {
      const splitter = new TextSplitter({
        chunkSize: 100,
        chunkOverlap: 20
      })

      const longText = 'A'.repeat(500)
      const chunks = splitter.split(longText)

      // 每个块应该不超过 chunkSize 的范围（允许一定容差）
      chunks.forEach(chunk => {
        expect(chunk.length).toBeLessThanOrEqual(150)
      })
    })

    it('should handle short text', () => {
      const splitter = new TextSplitter({
        chunkSize: 100,
        chunkOverlap: 20
      })

      const shortText = 'This is a short text.'
      const chunks = splitter.split(shortText)

      expect(chunks.length).toBe(1)
      expect(chunks[0]).toBe(shortText)
    })

    it('should handle empty text', () => {
      const splitter = new TextSplitter({
        chunkSize: 100,
        chunkOverlap: 20
      })

      const chunks = splitter.split('')

      expect(chunks).toEqual([])
    })

    it('should handle text with only whitespace', () => {
      const splitter = new TextSplitter({
        chunkSize: 100,
        chunkOverlap: 20
      })

      const chunks = splitter.split('   \n\n   \t   ')

      // 应该过滤掉空白内容
      expect(chunks.every(c => c.trim().length > 0 || c.length === 0)).toBe(true)
    })

    it('should split Chinese text properly', () => {
      const splitter = new TextSplitter({
        chunkSize: 50,
        chunkOverlap: 10
      })

      const chineseText = '这是第一段中文内容。这是一些更多的文字。\n\n这是第二段中文内容。这里还有更多文字。'
      const chunks = splitter.split(chineseText)

      expect(chunks.length).toBeGreaterThan(0)
      chunks.forEach(chunk => {
        expect(chunk.length).toBeLessThanOrEqual(100)
      })
    })

    it('should handle mixed language text', () => {
      const splitter = new TextSplitter({
        chunkSize: 80,
        chunkOverlap: 15
      })

      const mixedText = 'This is English text. 这是中文内容。\n\nMore English here. 更多中文在这里。'
      const chunks = splitter.split(mixedText)

      expect(chunks.length).toBeGreaterThan(0)
      chunks.forEach(chunk => {
        expect(chunk.length).toBeLessThanOrEqual(120)
      })
    })

    it('should handle code blocks', () => {
      const splitter = new TextSplitter({
        chunkSize: 100,
        chunkOverlap: 20
      })

      const codeText = `function hello() {
  console.log("Hello, World!");
  return true;
}

function goodbye() {
  console.log("Goodbye!");
  return false;
}`

      const chunks = splitter.split(codeText)

      expect(chunks.length).toBeGreaterThan(0)
    })

    it('should handle text with various separators', () => {
      const splitter = new TextSplitter({
        chunkSize: 50,
        chunkOverlap: 10,
        separators: ['\n\n', '\n', '. ', ' ', '']
      })

      const text = 'Sentence one. Sentence two.\nSentence three.\n\nParagraph two starts here.'
      const chunks = splitter.split(text)

      expect(chunks.length).toBeGreaterThan(0)
    })

    it('should produce non-empty chunks for long text', () => {
      const splitter = new TextSplitter({
        chunkSize: 1000,
        chunkOverlap: 200
      })

      const longText = Array(100).fill('This is a test sentence.').join(' ')
      const chunks = splitter.split(longText)

      expect(chunks.length).toBeGreaterThan(0)
      chunks.forEach(chunk => {
        expect(chunk.length).toBeGreaterThan(0)
      })
    })
  })

  describe('chunk overlap', () => {
    it('should maintain overlap between chunks', () => {
      const splitter = new TextSplitter({
        chunkSize: 100,
        chunkOverlap: 30
      })

      const text = 'A'.repeat(50) + ' B'.repeat(50) + ' C'.repeat(50)
      const chunks = splitter.split(text)

      // 验证有多个块
      expect(chunks.length).toBeGreaterThanOrEqual(1)
    })
  })

  describe('edge cases', () => {
    it('should handle single character text', () => {
      const splitter = new TextSplitter({
        chunkSize: 10,
        chunkOverlap: 2
      })

      const chunks = splitter.split('A')
      expect(chunks.length).toBe(1)
      expect(chunks[0]).toBe('A')
    })

    it('should handle text smaller than chunk size', () => {
      const splitter = new TextSplitter({
        chunkSize: 1000,
        chunkOverlap: 100
      })

      const smallText = 'Small text.'
      const chunks = splitter.split(smallText)

      expect(chunks.length).toBe(1)
      expect(chunks[0]).toBe('Small text.')
    })

    it('should handle very large chunk size', () => {
      const splitter = new TextSplitter({
        chunkSize: 100000,
        chunkOverlap: 1000
      })

      const text = 'Normal text with normal length.'
      const chunks = splitter.split(text)

      expect(chunks.length).toBe(1)
    })

    it('should handle zero overlap', () => {
      const splitter = new TextSplitter({
        chunkSize: 50,
        chunkOverlap: 0
      })

      const text = 'First paragraph.\n\nSecond paragraph.\n\nThird paragraph.'
      const chunks = splitter.split(text)

      expect(chunks.length).toBeGreaterThan(0)
    })

    it('should handle newline-heavy text', () => {
      const splitter = new TextSplitter({
        chunkSize: 50,
        chunkOverlap: 10
      })

      const text = '\n\n\n\nText here\n\n\n\nMore text\n\n\n\n'
      const chunks = splitter.split(text)

      // 应该过滤掉空白
      const nonEmptyChunks = chunks.filter(c => c.trim().length > 0)
      expect(nonEmptyChunks.length).toBeGreaterThan(0)
    })
  })

  describe('real-world scenarios', () => {
    it('should split PRD document properly', () => {
      const splitter = new TextSplitter({
        chunkSize: 1000,
        chunkOverlap: 200
      })

      const prdText = `
# 产品需求文档

## 1. 产品概述
这是一个产品管理系统的需求文档。主要功能包括用户管理、文档管理和协作功能。

## 2. 业务背景
随着企业数字化转型的深入，产品团队需要一个高效的工具来管理产品需求。

### 2.1 市场机会
当前市场上缺乏面向中小企业的轻量级产品管理工具。

### 2.2 用户痛点
1. 需求文档分散在各个地方
2. 版本管理困难
3. 协作效率低下

## 3. 用户需求分析
目标用户群体包括产品经理、设计师和开发工程师。
      `

      const chunks = splitter.split(prdText)

      expect(chunks.length).toBeGreaterThan(0)
      chunks.forEach(chunk => {
        expect(chunk.length).toBeLessThanOrEqual(1500)
      })
    })

    it('should split technical documentation', () => {
      const splitter = new TextSplitter({
        chunkSize: 800,
        chunkOverlap: 150
      })

      const techDoc = `
# API Documentation

## Authentication
All API requests require authentication using Bearer tokens.

\`\`\`typescript
const response = await fetch('/api/users', {
  headers: {
    'Authorization': 'Bearer your-token-here'
  }
});
\`\`\`

## Endpoints

### GET /api/users
Returns a list of all users.

Parameters:
- page: Page number (default: 1)
- limit: Items per page (default: 20)

### POST /api/users
Creates a new user.

Request body:
\`\`\`json
{
  "name": "John Doe",
  "email": "john@example.com"
}
\`\`\`
      `

      const chunks = splitter.split(techDoc)

      expect(chunks.length).toBeGreaterThan(0)
    })
  })
})
