/**
 * PRD 质量验证器
 * 使用Zod Schema验证PRD结构，确保生成质量
 */

import { z } from 'zod'

/**
 * PRD结构验证Schema
 */
export const PRDValidationSchema = z.object({
  title: z.string().min(3).max(100),
  overview: z.object({
    productName: z.string().min(3),
    positioning: z.string().min(20),
    valueProps: z.array(z.string()).length(3)
  }),
  businessContext: z.object({
    marketOpportunity: z.string().min(50),
    painPoints: z.array(z.string()).min(3).max(5)
  }),
  userRequirements: z.object({
    personas: z.array(z.string()).min(2).max(3),
    userStories: z.array(z.string()).min(3),
    scenarios: z.array(z.string()).min(3).max(5)
  }),
  keyFeatures: z
    .array(
      z.object({
        name: z.string(),
        priority: z.enum(['Must-have', 'Should-have', 'Could-have']),
        description: z.string().min(150),
        userFlow: z.string().min(50),
        edgeCases: z.array(z.string()).min(3),
        dataRequirements: z.string()
      })
    )
    .min(1),
  technicalOverview: z.object({
    techStack: z.string().min(50),
    architecture: z.string().min(100),
    apiDesign: z.string().optional(),
    performanceRequirements: z.string()
  }),
  successMetrics: z
    .array(
      z.object({
        name: z.string(),
        definition: z.string(),
        target: z.string(), // 必须包含数字
        measurement: z.string(),
        dataSource: z.string(),
        trackingFrequency: z.string()
      })
    )
    .min(5),
  implementationPlan: z.object({
    phases: z.array(z.string()).min(2),
    milestones: z.array(z.string()).min(3),
    resourceNeeds: z.string()
  }),
  risksAndAssumptions: z.object({
    assumptions: z.array(z.string()).min(3),
    risks: z.array(
      z.object({
        risk: z.string(),
        mitigation: z.string()
      })
    ).min(3)
  }),
  competitiveAnalysis: z.object({
    existingSolutions: z.array(z.string()).min(2),
    differentiation: z.string().min(50)
  }),
  appendix: z
    .object({
      relatedDocs: z.array(z.string()).optional(),
      glossary: z.record(z.string()).optional()
    })
    .optional()
})

/**
 * 验证结果
 */
export interface PRDValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
  parsed?: any // 解析后的结构化数据
}

/**
 * 从Markdown解析PRD为结构化数据
 * 简化实现：提取关键章节内容
 */
function parseMarkdownPRD (markdown: string): any {
  const sections: Record<string, string> = {}

  // 提取各章节
  const chapterRegex = /^##\s+(\d+)\.\s+(.+)$/gm
  let match
  const chapters: Array<{ number: string; title: string; start: number }> = []

  while ((match = chapterRegex.exec(markdown)) !== null) {
    chapters.push({
      number: match[1],
      title: match[2].trim(),
      start: match.index
    })
  }

  // 提取每个章节的内容
  for (let i = 0; i < chapters.length; i++) {
    const chapter = chapters[i]
    const nextChapter = chapters[i + 1]
    const content = markdown
      .slice(
        chapter.start,
        nextChapter ? nextChapter.start : markdown.length
      )
      .replace(/^##\s+\d+\.\s+.+$/, '') // 移除标题
      .trim()

    sections[chapter.title] = content
  }

  // 简化的结构化数据
  return {
    title: extractTitle(markdown),
    overview: extractOverview(sections['产品概述'] || ''),
    businessContext: {
      marketOpportunity: sections['业务背景'] || '',
      painPoints: extractListItems(sections['业务背景'] || '', 3, 5)
    },
    userRequirements: {
      personas: extractListItems(sections['用户需求分析'] || '', 2, 3),
      userStories: extractListItems(sections['用户需求分析'] || '', 3, 10),
      scenarios: extractListItems(sections['用户需求分析'] || '', 3, 5)
    },
    keyFeatures: extractFeatures(sections['核心功能'] || ''),
    technicalOverview: {
      techStack: sections['技术架构概览'] || '',
      architecture: sections['技术架构概览'] || '',
      performanceRequirements: ''
    },
    successMetrics: extractKPIs(sections['成功指标'] || ''),
    implementationPlan: {
      phases: extractListItems(sections['实施计划'] || '', 2, 5),
      milestones: extractListItems(sections['实施计划'] || '', 3, 10),
      resourceNeeds: ''
    },
    risksAndAssumptions: {
      assumptions: extractListItems(sections['风险与假设'] || '', 3, 10),
      risks: []
    },
    competitiveAnalysis: {
      existingSolutions: extractListItems(sections['竞争分析'] || '', 2, 5),
      differentiation: sections['竞争分析'] || ''
    }
  }
}

/**
 * 辅助函数：提取标题
 */
function extractTitle (markdown: string): string {
  const match = markdown.match(/^#\s+(.+)$/m)
  return match ? match[1].trim() : '未命名PRD'
}

/**
 * 辅助函数：提取概述
 */
function extractOverview (content: string): any {
  return {
    productName: extractFirstMatch(content, /产品名称[：:]\s*(.+)/) || '',
    positioning: extractFirstMatch(content, /一句话定位[：:]\s*(.+)/) || content.substring(0, 100),
    valueProps: ['价值1', '价值2', '价值3'] // 简化处理
  }
}

/**
 * 辅助函数：提取第一个匹配
 */
function extractFirstMatch (text: string, regex: RegExp): string | null {
  const match = text.match(regex)
  return match ? match[1].trim() : null
}

/**
 * 辅助函数：提取列表项
 */
function extractListItems (text: string, min: number, max: number): string[] {
  const items: string[] = []
  const regex = /^[-*]\s+(.+)$/gm
  let match

  while ((match = regex.exec(text)) !== null && items.length < max) {
    items.push(match[1].trim())
  }

  // 如果列表项不足，用空字符串填充到最小数量
  while (items.length < min) {
    items.push('')
  }

  return items
}

/**
 * 辅助函数：提取功能列表
 */
function extractFeatures (content: string): any[] {
  const features: any[] = []
  const featureRegex = /###\s+\d+\.\d+\s+(.+)/g
  let match

  while ((match = featureRegex.exec(content)) !== null) {
    features.push({
      name: match[1].trim(),
      priority: 'Must-have',
      description: content.substring(
        match.index,
        Math.min(match.index + 300, content.length)
      ),
      userFlow: '',
      edgeCases: ['', '', ''],
      dataRequirements: ''
    })
  }

  return features.length > 0 ? features : [{ name: '', priority: 'Must-have' as const, description: '', userFlow: '', edgeCases: ['', '', ''], dataRequirements: '' }]
}

/**
 * 辅助函数：提取KPI列表
 */
function extractKPIs (content: string): any[] {
  const kpis: any[] = []
  const kpiRegex = /###\s+\d+\.\d+\s+(.+)/g
  let match

  while ((match = kpiRegex.exec(content)) !== null && kpis.length < 10) {
    kpis.push({
      name: match[1].trim(),
      definition: '',
      target: extractFirstMatch(content.substring(match.index), /目标[：:]\s*(.+)/) || '0%',
      measurement: '',
      dataSource: '',
      trackingFrequency: '每周'
    })
  }

  // 确保至少5个KPI
  while (kpis.length < 5) {
    kpis.push({
      name: `KPI ${kpis.length + 1}`,
      definition: '',
      target: '0%',
      measurement: '',
      dataSource: '',
      trackingFrequency: '每周'
    })
  }

  return kpis
}

/**
 * 语义检查：KPI量化检查
 */
function checkKPIQuantification (kpis: any[]): string[] {
  const warnings: string[] = []

  kpis.forEach((kpi, i) => {
    // 检查target字段是否包含数字
    if (!kpi.target || !kpi.target.match(/\d+%|\d+天|>\d+|<\d+|\d+到\d+/)) {
      warnings.push(
        `KPI #${i + 1} ("${kpi.name}") 缺少量化目标 - 当前值: "${kpi.target}"`
      )
    }
  })

  return warnings
}

/**
 * 语义检查：功能描述长度检查
 */
function checkFeatureDescriptionLength (features: any[]): string[] {
  const warnings: string[] = []

  features.forEach((feature, i) => {
    if (feature.description.length < 150) {
      warnings.push(
        `功能 #${i + 1} ("${feature.name}") 描述过于简短 (${feature.description.length} 字，建议 >150 字)`
      )
    }
  })

  return warnings
}

/**
 * 验证PRD结构
 */
export function validatePRDStructure (prdContent: string): PRDValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  // 检查必需章节是否存在
  const requiredChapters = [
    '产品概述',
    '业务背景',
    '用户需求分析',
    '核心功能',
    '技术架构概览',
    '成功指标',
    '实施计划',
    '风险与假设',
    '竞争分析',
    '附录与参考'
  ]

  const missingChapters = requiredChapters.filter(chapter => !prdContent.includes(chapter))

  if (missingChapters.length > 0) {
    errors.push(`缺少必需章节: ${missingChapters.join(', ')}`)
  }

  // 检查字数范围
  const wordCount = prdContent.length
  if (wordCount < 2000) {
    warnings.push(`PRD字数不足 (${wordCount} 字，建议 3000-6000 字)`)
  } else if (wordCount > 8000) {
    warnings.push(`PRD字数过多 (${wordCount} 字，建议 3000-6000 字)`)
  }

  // 解析为结构化数据
  const parsed = parseMarkdownPRD(prdContent)

  // Schema验证
  const schemaResult = PRDValidationSchema.safeParse(parsed)
  if (!schemaResult.success) {
    schemaResult.error.errors.forEach(err => {
      errors.push(`${err.path.join('.')}: ${err.message}`)
    })
  }

  // 语义检查
  if (parsed.successMetrics) {
    warnings.push(...checkKPIQuantification(parsed.successMetrics))
  }

  if (parsed.keyFeatures) {
    warnings.push(...checkFeatureDescriptionLength(parsed.keyFeatures))
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    parsed: schemaResult.success ? schemaResult.data : parsed
  }
}

/**
 * 快速质量检查（轻量级）
 * 仅检查关键指标，不进行完整解析
 */
export function quickQualityCheck (prdContent: string): {
  hasAllChapters: boolean
  wordCount: number
  hasQuantifiedKPIs: boolean
  estimatedQuality: 'low' | 'medium' | 'high'
} {
  const requiredChapters = [
    '产品概述',
    '业务背景',
    '用户需求分析',
    '核心功能',
    '技术架构概览',
    '成功指标'
  ]

  const hasAllChapters = requiredChapters.every(chapter => prdContent.includes(chapter))

  const wordCount = prdContent.length

  // 检查是否有量化的KPI（包含数字）
  const kpiSection = prdContent.match(/##\s+6\.\s+成功指标[\s\S]*?(?=##|$)/)?.[0] || ''
  const hasQuantifiedKPIs = /\d+%|\d+天|>\d+|<\d+/.test(kpiSection)

  // 估算质量
  let estimatedQuality: 'low' | 'medium' | 'high' = 'low'
  if (hasAllChapters && wordCount >= 3000 && hasQuantifiedKPIs) {
    estimatedQuality = 'high'
  } else if (hasAllChapters && wordCount >= 2000) {
    estimatedQuality = 'medium'
  }

  return {
    hasAllChapters,
    wordCount,
    hasQuantifiedKPIs,
    estimatedQuality
  }
}
