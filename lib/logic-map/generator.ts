/**
 * 逻辑图谱生成引擎
 * 从 PRD 内容中提取逻辑关系，生成结构化图谱数据
 */

import { ModelManager } from '~/lib/ai/manager'
import { buildLogicMapFromPRDPrompt } from '~/lib/ai/prompts/logic-map-system'
import type { LogicMapData } from '~/types/logic-map'

export interface LogicMapGenerateOptions {
  modelId?: string
  temperature?: number
  maxTokens?: number
}

export class LogicMapGenerator {
  private modelManager: ModelManager

  constructor (aiConfig?: Record<string, any>) {
    this.modelManager = new ModelManager(aiConfig)
  }

  /**
   * 从 PRD 内容生成逻辑图谱（非流式）
   */
  async generateFromPRD (
    prdContent: string,
    options?: LogicMapGenerateOptions
  ): Promise<LogicMapData> {
    const modelId = options?.modelId || 'glm-4.7'
    const adapter = this.modelManager.getAdapter(modelId)
    if (!adapter) throw new Error(`Model ${modelId} not available`)

    const prompt = buildLogicMapFromPRDPrompt(prdContent)

    const rawText = await adapter.generateText(prompt, {
      temperature: options?.temperature || 0.3,
      maxTokens: options?.maxTokens || 4000
    })

    return LogicMapGenerator.parseResponse(rawText)
  }

  /**
   * 从 AI 原始输出中解析 JSON
   * 使用多层兜底策略确保解析成功
   */
  static parseResponse (rawText: string): LogicMapData {
    const emptyResult: LogicMapData = {
      nodes: [],
      edges: [],
      summary: ''
    }

    if (!rawText || !rawText.trim()) {
      return emptyResult
    }

    let jsonText = rawText.trim()

    // 策略 1: 直接解析
    try {
      const parsed = JSON.parse(jsonText)
      return LogicMapGenerator.validateAndNormalize(parsed)
    } catch {
      // continue to next strategy
    }

    // 策略 2: 提取 ```json ... ``` 代码块
    const codeBlockMatch = jsonText.match(/```(?:json)?\s*\n([\s\S]*?)```/)
    if (codeBlockMatch) {
      try {
        const parsed = JSON.parse(codeBlockMatch[1].trim())
        return LogicMapGenerator.validateAndNormalize(parsed)
      } catch {
        // continue to next strategy
      }
    }

    // 策略 3: 提取首个 { 到末尾 } 之间的内容
    const firstBrace = jsonText.indexOf('{')
    const lastBrace = jsonText.lastIndexOf('}')
    if (firstBrace !== -1 && lastBrace > firstBrace) {
      try {
        const parsed = JSON.parse(jsonText.slice(firstBrace, lastBrace + 1))
        return LogicMapGenerator.validateAndNormalize(parsed)
      } catch {
        // fall through to default
      }
    }

    console.error('Failed to parse logic map response:', rawText.substring(0, 200))
    return emptyResult
  }

  /**
   * 校验并规范化解析结果
   */
  private static validateAndNormalize (data: any): LogicMapData {
    const nodes = Array.isArray(data.nodes) ? data.nodes : []
    const edges = Array.isArray(data.edges) ? data.edges : []
    const summary = typeof data.summary === 'string' ? data.summary : ''

    // 收集有效的节点 ID
    const validNodeIds = new Set(nodes.map((n: any) => n.id))

    // 校验节点结构
    const validNodes = nodes
      .filter((n: any) => n.id && n.type && n.label)
      .map((n: any) => ({
        id: String(n.id),
        type: ['feature', 'role', 'entity'].includes(n.type) ? n.type : 'feature',
        label: String(n.label),
        description: String(n.description || '')
      }))

    // 校验边结构，确保引用的节点存在
    const validEdges = edges
      .filter((e: any) => e.source && e.target && validNodeIds.has(e.source) && validNodeIds.has(e.target))
      .map((e: any) => ({
        source: String(e.source),
        target: String(e.target),
        label: String(e.label || ''),
        type: ['dependency', 'interaction', 'dataflow'].includes(e.type) ? e.type : 'dependency'
      }))

    return {
      nodes: validNodes,
      edges: validEdges,
      summary
    }
  }
}
