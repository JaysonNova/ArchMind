import { dbClient } from '../client'
import type { LogicMapData } from '@/types/logic-map'

export interface LogicMapRecord {
  id: string
  prdId: string
  nodesData: LogicMapData['nodes']
  edgesData: LogicMapData['edges']
  summary: string
  metadata: Record<string, any>
  createdAt: string
  updatedAt: string
}

export class LogicMapDAO {
  /**
   * 保存或更新 Logic Map (一个 PRD 只有一个最新的 Logic Map)
   */
  static async upsert(prdId: string, data: LogicMapData, metadata?: Record<string, any>): Promise<LogicMapRecord> {
    const now = new Date().toISOString()

    const sql = `
      INSERT INTO logic_maps (prd_id, nodes_data, edges_data, summary, metadata, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (prd_id)
      DO UPDATE SET
        nodes_data = EXCLUDED.nodes_data,
        edges_data = EXCLUDED.edges_data,
        summary = EXCLUDED.summary,
        metadata = EXCLUDED.metadata,
        updated_at = EXCLUDED.updated_at
      RETURNING *
    `

    const result = await dbClient.query<any>(sql, [
      prdId,
      JSON.stringify(data.nodes),
      JSON.stringify(data.edges),
      data.summary,
      JSON.stringify(metadata || {}),
      now,
      now
    ])

    return this.mapRowToRecord(result.rows[0])
  }

  /**
   * 根据 PRD ID 获取 Logic Map
   */
  static async findByPrdId(prdId: string): Promise<LogicMapRecord | null> {
    const sql = 'SELECT * FROM logic_maps WHERE prd_id = $1'
    const result = await dbClient.query<any>(sql, [prdId])

    if (result.rows.length === 0) return null

    return this.mapRowToRecord(result.rows[0])
  }

  /**
   * 根据 ID 获取 Logic Map
   */
  static async findById(id: string): Promise<LogicMapRecord | null> {
    const sql = 'SELECT * FROM logic_maps WHERE id = $1'
    const result = await dbClient.query<any>(sql, [id])

    if (result.rows.length === 0) return null

    return this.mapRowToRecord(result.rows[0])
  }

  /**
   * 删除 Logic Map
   */
  static async delete(id: string): Promise<boolean> {
    const sql = 'DELETE FROM logic_maps WHERE id = $1'
    const result = await dbClient.query(sql, [id])
    return result.rowCount! > 0
  }

  /**
   * 根据 PRD ID 删除 Logic Map
   */
  static async deleteByPrdId(prdId: string): Promise<boolean> {
    const sql = 'DELETE FROM logic_maps WHERE prd_id = $1'
    const result = await dbClient.query(sql, [prdId])
    return result.rowCount! > 0
  }

  /**
   * 统计 Logic Map 数量
   */
  static async count(): Promise<number> {
    const sql = 'SELECT COUNT(*) as count FROM logic_maps'
    const result = await dbClient.query<{ count: string }>(sql)
    return parseInt(result.rows[0].count, 10)
  }

  /**
   * 转换为 LogicMapData 格式
   */
  static toLogicMapData(record: LogicMapRecord): LogicMapData {
    return {
      nodes: record.nodesData,
      edges: record.edgesData,
      summary: record.summary
    }
  }

  private static mapRowToRecord(row: any): LogicMapRecord {
    return {
      id: row.id,
      prdId: row.prd_id,
      nodesData: typeof row.nodes_data === 'string' ? JSON.parse(row.nodes_data) : row.nodes_data,
      edgesData: typeof row.edges_data === 'string' ? JSON.parse(row.edges_data) : row.edges_data,
      summary: row.summary,
      metadata: typeof row.metadata === 'string' ? JSON.parse(row.metadata) : row.metadata,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }
  }
}
