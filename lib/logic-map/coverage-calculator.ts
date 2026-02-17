import type { LogicMapData } from '@/types/logic-map'

export interface LogicCoverageMetrics {
  coverage: number // 总体覆盖率 (0-100)
  featureCoverage: number // 功能覆盖度
  roleCoverage: number // 角色覆盖度
  entityCoverage: number // 实体覆盖度
  relationshipDensity: number // 关系密度
  details: {
    totalNodes: number
    featureNodes: number
    roleNodes: number
    entityNodes: number
    totalEdges: number
    dependencyEdges: number
    interactionEdges: number
    dataflowEdges: number
    estimatedRequiredNodes: number // 基于 PRD 内容估算的应有节点数
    estimatedRequiredEdges: number // 基于节点数估算的应有边数
  }
}

/**
 * Logic Coverage 计算服务
 *
 * 计算公式:
 * - 功能覆盖度 (40%): 实际功能节点数 / 估算应有功能节点数
 * - 关系密度 (30%): 实际边数 / 理论最大边数
 * - 角色覆盖度 (20%): min(角色节点数 / 理想角色数, 1)
 * - 实体覆盖度 (10%): min(实体节点数 / 最小实体数, 1)
 */
export class LogicCoverageCalculator {
  /**
   * 计算 PRD 的 Logic Coverage
   * 如果没有 Logic Map，则基于 PRD 内容估算覆盖率
   */
  static calculate(prdContent: string, logicMapData: LogicMapData | null): LogicCoverageMetrics {
    // 如果没有 Logic Map，使用纯 PRD 估算
    if (!logicMapData || logicMapData.nodes.length === 0) {
      return this.estimateFromPrdOnly(prdContent)
    }

    // 统计节点数量
    const featureNodes = logicMapData.nodes.filter(n => n.type === 'feature').length
    const roleNodes = logicMapData.nodes.filter(n => n.type === 'role').length
    const entityNodes = logicMapData.nodes.filter(n => n.type === 'entity').length
    const totalNodes = logicMapData.nodes.length

    // 统计边数量
    const dependencyEdges = logicMapData.edges.filter(e => e.type === 'dependency').length
    const interactionEdges = logicMapData.edges.filter(e => e.type === 'interaction').length
    const dataflowEdges = logicMapData.edges.filter(e => e.type === 'dataflow').length
    const totalEdges = logicMapData.edges.length

    // 基于 PRD 内容估算应有的节点数
    const estimatedRequiredNodes = this.estimateRequiredNodes(prdContent)

    // 基于节点数估算理论应有的边数 (节点之间可能的连接)
    // 使用启发式: 平均每个节点有 1.5-2 个连接
    const estimatedRequiredEdges = Math.max(1, Math.floor(totalNodes * 1.75))

    // 1. 功能覆盖度 (40%权重)
    const featureCoverage = estimatedRequiredNodes.features > 0
      ? Math.min((featureNodes / estimatedRequiredNodes.features) * 100, 100)
      : 0

    // 2. 关系密度 (30%权重)
    // 理论最大边数 = n*(n-1)/2 (完全图),但我们使用估算值
    const relationshipDensity = estimatedRequiredEdges > 0
      ? Math.min((totalEdges / estimatedRequiredEdges) * 100, 100)
      : 0

    // 3. 角色覆盖度 (20%权重)
    // 理想角色数: 2-5 个
    const idealRoleCount = 3
    const roleCoverage = Math.min((roleNodes / idealRoleCount) * 100, 100)

    // 4. 实体覆盖度 (10%权重)
    // 最小实体数: 至少应该有功能数量的 50%
    const minEntityCount = Math.max(2, Math.floor(featureNodes * 0.5))
    const entityCoverage = minEntityCount > 0
      ? Math.min((entityNodes / minEntityCount) * 100, 100)
      : 0

    // 综合覆盖率
    const coverage = Math.round(
      featureCoverage * 0.4 +
      relationshipDensity * 0.3 +
      roleCoverage * 0.2 +
      entityCoverage * 0.1
    )

    return {
      coverage: Math.min(coverage, 100),
      featureCoverage: Math.round(featureCoverage),
      roleCoverage: Math.round(roleCoverage),
      entityCoverage: Math.round(entityCoverage),
      relationshipDensity: Math.round(relationshipDensity),
      details: {
        totalNodes,
        featureNodes,
        roleNodes,
        entityNodes,
        totalEdges,
        dependencyEdges,
        interactionEdges,
        dataflowEdges,
        estimatedRequiredNodes: estimatedRequiredNodes.total,
        estimatedRequiredEdges
      }
    }
  }

  /**
   * 仅基于 PRD 内容估算覆盖率（无需逻辑图谱）
   * 使用启发式规则分析 PRD 文本的完整性和结构化程度
   */
  static estimateFromPrdOnly(prdContent: string): LogicCoverageMetrics {
    if (!prdContent || prdContent.trim().length === 0) {
      return {
        coverage: 0,
        featureCoverage: 0,
        roleCoverage: 0,
        entityCoverage: 0,
        relationshipDensity: 0,
        details: {
          totalNodes: 0,
          featureNodes: 0,
          roleNodes: 0,
          entityNodes: 0,
          totalEdges: 0,
          dependencyEdges: 0,
          interactionEdges: 0,
          dataflowEdges: 0,
          estimatedRequiredNodes: 0,
          estimatedRequiredEdges: 0
        }
      }
    }

    const estimated = this.estimateRequiredNodes(prdContent)
    const lowerContent = prdContent.toLowerCase()

    // 1. 功能覆盖度 (40%): 基于 PRD 中功能描述的完整性
    // 检测是否有结构化的功能章节
    const hasFeatureSection = lowerContent.includes('核心功能') ||
                              lowerContent.includes('功能需求') ||
                              lowerContent.includes('features') ||
                              lowerContent.includes('功能列表')
    const featureListItems = (prdContent.match(/^[-*•]\s+.+/gm) || []).length
    const featureCoverage = hasFeatureSection
      ? Math.min(100, 50 + featureListItems * 5) // 有章节给50分，每个列表项加5分
      : Math.min(100, featureListItems * 8) // 无章节，仅靠列表项

    // 2. 关系密度 (30%): 基于 PRD 中的关联描述
    // 检测是否有功能依赖、用户流程、数据流等描述
    const relationKeywords = ['依赖', '关联', '调用', '交互', '流程', '数据流', '接口', '联动', '触发']
    const relationMatches = relationKeywords.reduce((sum, kw) =>
      sum + (lowerContent.match(new RegExp(kw, 'gi'))?.length || 0), 0)
    const relationshipDensity = Math.min(100, relationMatches * 8)

    // 3. 角色覆盖度 (20%): 基于 PRD 中用户角色的描述
    const roleKeywords = ['用户', '角色', '管理员', '访客', '会员', '游客', '运营', '开发']
    const roleMatches = roleKeywords.reduce((sum, kw) =>
      sum + (lowerContent.match(new RegExp(kw, 'gi'))?.length || 0), 0)
    const roleCoverage = Math.min(100, Math.floor(roleMatches / 2) * 10)

    // 4. 实体覆盖度 (10%): 基于 PRD 中数据实体的描述
    const entityKeywords = ['数据', '表', '字段', '模型', '实体', '存储', '缓存', '数据库']
    const entityMatches = entityKeywords.reduce((sum, kw) =>
      sum + (lowerContent.match(new RegExp(kw, 'gi'))?.length || 0), 0)
    const entityCoverage = Math.min(100, Math.floor(entityMatches / 3) * 10)

    // 综合覆盖率
    const coverage = Math.round(
      featureCoverage * 0.4 +
      relationshipDensity * 0.3 +
      roleCoverage * 0.2 +
      entityCoverage * 0.1
    )

    return {
      coverage: Math.min(coverage, 100),
      featureCoverage: Math.round(featureCoverage),
      roleCoverage: Math.round(roleCoverage),
      entityCoverage: Math.round(entityCoverage),
      relationshipDensity: Math.round(relationshipDensity),
      details: {
        totalNodes: estimated.total,
        featureNodes: estimated.features,
        roleNodes: estimated.roles,
        entityNodes: estimated.entities,
        totalEdges: 0,
        dependencyEdges: 0,
        interactionEdges: 0,
        dataflowEdges: 0,
        estimatedRequiredNodes: estimated.total,
        estimatedRequiredEdges: Math.floor(estimated.total * 1.75)
      }
    }
  }

  /**
   * 基于 PRD 内容估算应有的节点数
   * 使用启发式规则分析 PRD 文本
   */
  private static estimateRequiredNodes(prdContent: string): {
    total: number
    features: number
    roles: number
    entities: number
  } {
    if (!prdContent || prdContent.trim().length === 0) {
      return { total: 0, features: 0, roles: 0, entities: 0 }
    }

    // 分析 PRD 内容长度
    const contentLength = prdContent.length

    // 基于内容长度的基础估算
    let baseFeatures = 3 // 默认至少3个功能点
    if (contentLength > 5000) baseFeatures = 8
    else if (contentLength > 3000) baseFeatures = 6
    else if (contentLength > 1500) baseFeatures = 4

    // 检测特定关键词来优化估算
    const featureKeywords = ['功能', 'feature', '模块', 'module', '页面', 'page', '接口', 'api', '需求']
    const roleKeywords = ['用户', 'user', '角色', 'role', '管理员', 'admin', '访客', 'guest']
    const entityKeywords = ['数据', 'data', '实体', 'entity', '对象', 'object', '表', 'table', '模型', 'model']

    // 统计关键词出现次数
    const lowerContent = prdContent.toLowerCase()
    const featureMatches = featureKeywords.reduce((sum, kw) =>
      sum + (lowerContent.match(new RegExp(kw, 'gi'))?.length || 0), 0)
    const roleMatches = roleKeywords.reduce((sum, kw) =>
      sum + (lowerContent.match(new RegExp(kw, 'gi'))?.length || 0), 0)
    const entityMatches = entityKeywords.reduce((sum, kw) =>
      sum + (lowerContent.match(new RegExp(kw, 'gi'))?.length || 0), 0)

    // 基于关键词调整估算
    const features = Math.max(baseFeatures, Math.min(Math.floor(featureMatches / 2), 15))
    const roles = Math.max(2, Math.min(Math.floor(roleMatches / 3), 6))
    const entities = Math.max(2, Math.min(Math.floor(entityMatches / 3), 10))

    return {
      features,
      roles,
      entities,
      total: features + roles + entities
    }
  }

  /**
   * 快速计算 Logic Coverage (仅返回百分比)
   */
  static calculateQuick(prdContent: string, logicMapData: LogicMapData | null): number {
    return this.calculate(prdContent, logicMapData).coverage
  }
}
