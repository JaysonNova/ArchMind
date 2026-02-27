/**
 * 设计方案模板功能测试
 * 测试自定义模板的章节提取和完整性校验
 */

import { describe, it, expect } from 'vitest'
import { extractSectionsFromTemplate, isContentCompleteForTemplate } from '~/lib/design-doc/template'

describe('Design Doc Template Functions', () => {
  describe('extractSectionsFromTemplate', () => {
    it('should extract sections from default template (10 sections)', () => {
      const template = `# 前端开发设计方案

## 1. 需求概述
内容...

## 2. 页面结构设计
内容...

## 3. 组件设计
内容...

## 4. 状态管理设计
内容...

## 5. API 对接设计
内容...

## 6. 数据模型
内容...

## 7. 交互与动效设计
内容...

## 8. 响应式与适配
内容...

## 9. 技术风险与难点
内容...

## 10. 开发任务拆解
内容...`

      const sections = extractSectionsFromTemplate(template)
      expect(sections.size).toBe(10)
      expect(sections.has(1)).toBe(true)
      expect(sections.has(10)).toBe(true)
    })

    it('should extract sections from custom template (5 sections)', () => {
      const customTemplate = `# 自定义设计方案

## 1. 概述
内容...

## 2. 技术选型
内容...

## 3. 架构设计
内容...

## 4. 实现细节
内容...

## 5. 测试计划
内容...`

      const sections = extractSectionsFromTemplate(customTemplate)
      expect(sections.size).toBe(5)
      expect(sections.has(1)).toBe(true)
      expect(sections.has(5)).toBe(true)
      expect(sections.has(10)).toBe(false)
    })

    it('should handle different section formats', () => {
      const template = `
## 1. 标题一
## 2 标题二
## 3、标题三
## 4  标题四
`
      const sections = extractSectionsFromTemplate(template)
      expect(sections.size).toBe(4)
      expect(sections.has(1)).toBe(true)
      expect(sections.has(2)).toBe(true)
      expect(sections.has(3)).toBe(true)
      expect(sections.has(4)).toBe(true)
    })

    it('should return empty set for template without sections', () => {
      const template = `# 标题\n\n这是一段文字，没有章节。`
      const sections = extractSectionsFromTemplate(template)
      expect(sections.size).toBe(0)
    })
  })

  describe('isContentCompleteForTemplate', () => {
    it('should return true when content has all template sections', () => {
      const template = `
## 1. 概述
## 2. 设计
## 3. 实现
`
      const content = `
# 设计方案

## 1. 概述
这是概述内容...

## 2. 设计
这是设计内容...

## 3. 实现
这是实现内容...
`
      expect(isContentCompleteForTemplate(content, template)).toBe(true)
    })

    it('should return false when content is missing sections', () => {
      const template = `
## 1. 概述
## 2. 设计
## 3. 实现
`
      const content = `
# 设计方案

## 1. 概述
这是概述内容...

## 2. 设计
这是设计内容...
`
      // 缺少第 3 章节
      expect(isContentCompleteForTemplate(content, template)).toBe(false)
    })

    it('should return true when content has extra sections', () => {
      const template = `
## 1. 概述
## 2. 设计
`
      const content = `
# 设计方案

## 1. 概述
内容...

## 2. 设计
内容...

## 3. 额外章节
内容...
`
      // 内容包含模板的所有章节，额外章节不影响
      expect(isContentCompleteForTemplate(content, template)).toBe(true)
    })

    it('should return false for empty content', () => {
      const template = `## 1. 概述`
      expect(isContentCompleteForTemplate('', template)).toBe(false)
    })

    it('should return false for empty template', () => {
      const content = `## 1. 概述`
      expect(isContentCompleteForTemplate(content, '')).toBe(false)
    })

    it('should work with 10-section default template', () => {
      const template = `
## 1. 需求概述
## 2. 页面结构设计
## 3. 组件设计
## 4. 状态管理设计
## 5. API 对接设计
## 6. 数据模型
## 7. 交互与动效设计
## 8. 响应式与适配
## 9. 技术风险与难点
## 10. 开发任务拆解
`
      const completeContent = `
# 前端开发设计方案

## 1. 需求概述
内容...

## 2. 页面结构设计
内容...

## 3. 组件设计
内容...

## 4. 状态管理设计
内容...

## 5. API 对接设计
内容...

## 6. 数据模型
内容...

## 7. 交互与动效设计
内容...

## 8. 响应式与适配
内容...

## 9. 技术风险与难点
内容...

## 10. 开发任务拆解
内容...
`
      expect(isContentCompleteForTemplate(completeContent, template)).toBe(true)

      const incompleteContent = `
# 前端开发设计方案

## 1. 需求概述
内容...

## 2. 页面结构设计
内容...

## 3. 组件设计
内容...
`
      expect(isContentCompleteForTemplate(incompleteContent, template)).toBe(false)
    })
  })
})
