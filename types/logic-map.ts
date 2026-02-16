/**
 * 逻辑图谱类型定义
 */

export type LogicMapNodeType = 'feature' | 'role' | 'entity'

export type LogicMapEdgeType = 'dependency' | 'interaction' | 'dataflow'

export interface LogicMapNodeData {
  id: string
  type: LogicMapNodeType
  label: string
  description: string
}

export interface LogicMapEdgeData {
  source: string
  target: string
  label: string
  type: LogicMapEdgeType
}

export interface LogicMapData {
  nodes: LogicMapNodeData[]
  edges: LogicMapEdgeData[]
  summary: string
}

export interface LogicMapGenerateRequest {
  prdId: string
  modelId?: string
  temperature?: number
  maxTokens?: number
}

export interface LogicMapGenerateResponse {
  success: boolean
  data?: LogicMapData
  error?: string
}
