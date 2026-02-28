/**
 * 设计方案模板功能测试
 * 测试自定义模板的章节提取和完整性校验
 */

import { describe, it, expect } from 'vitest'
import { extractSectionsFromTemplate, isContentCompleteForTemplate, buildDesignDocPrompt, buildSystemPrompt } from '~/lib/design-doc/template'

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

    it('should fall back to counting all ## headings when no numbered sections', () => {
      const template = `# 设计方案

## 需求概述
内容...

## 架构设计
内容...

## 组件设计
内容...

## 开发计划
内容...`
      const sections = extractSectionsFromTemplate(template)
      expect(sections.size).toBe(4)
      expect(sections.has(1)).toBe(true)
      expect(sections.has(4)).toBe(true)
    })

    it('should prefer numbered sections over fallback counting', () => {
      const template = `# 方案

## 1. 概述
## 2. 设计
`
      const sections = extractSectionsFromTemplate(template)
      expect(sections.size).toBe(2)
      expect(sections.has(1)).toBe(true)
      expect(sections.has(2)).toBe(true)
    })

    it('should handle mermaid template with unnumbered sections', () => {
      const template = `# 前端设计方案

## 需求概述
### 业务流程图
\`\`\`mermaid
flowchart TD
    A --> B
\`\`\`

## 页面设计
内容...

## 组件设计
内容...`
      const sections = extractSectionsFromTemplate(template)
      expect(sections.size).toBe(3)
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

    it('should work with unnumbered template sections', () => {
      const template = `
## 需求概述
## 架构设计
## 组件设计
`
      // Template has 3 unnumbered sections -> mapped to {1, 2, 3}
      const completeContent = `
## 需求概述
内容...
## 架构设计
内容...
## 组件设计
内容...
`
      expect(isContentCompleteForTemplate(completeContent, template)).toBe(true)
    })
  })

  describe('buildDesignDocPrompt', () => {
    it('should include custom template in prompt when provided', () => {
      const customTemplate = `# 自定义方案\n## 概述\n## 设计`
      const prompt = buildDesignDocPrompt('doc content', 'doc title', undefined, customTemplate)
      expect(prompt).toContain('自定义模板')
      expect(prompt).toContain(customTemplate)
    })

    it('should not include custom template section when not provided', () => {
      const prompt = buildDesignDocPrompt('doc content', 'doc title')
      expect(prompt).not.toContain('自定义模板')
    })

    it('should include additional context when provided', () => {
      const prompt = buildDesignDocPrompt('doc content', 'doc title', '使用 Vue 3')
      expect(prompt).toContain('补充说明')
      expect(prompt).toContain('使用 Vue 3')
    })
  })

  describe('buildSystemPrompt', () => {
    it('should return default system prompt when no custom template', () => {
      const prompt = buildSystemPrompt()
      expect(prompt).toContain('全部 10 个章节')
    })

    it('should return custom system prompt with section count', () => {
      const customTemplate = `## 1. 概述\n## 2. 设计\n## 3. 实现`
      const prompt = buildSystemPrompt(customTemplate)
      expect(prompt).toContain('自定义模板')
      expect(prompt).toContain('全部 3 个章节')
    })

    it('should handle unnumbered custom template', () => {
      const customTemplate = `## 概述\n内容\n## 设计\n内容`
      const prompt = buildSystemPrompt(customTemplate)
      expect(prompt).toContain('自定义模板')
      expect(prompt).toContain('全部 2 个章节')
    })
  })
})
