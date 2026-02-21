import { randomUUID } from 'crypto'
import { dbClient } from '../client'

export interface PrdChunk {
  id: string
  prdId: string
  chunkIndex: number
  content: string
  metadata?: Record<string, any>
  createdAt: string
}

export class PrdChunkDAO {
  // 批量创建 PRD 块
  static async createMany (chunks: Omit<PrdChunk, 'id' | 'createdAt'>[]): Promise<PrdChunk[]> {
    if (chunks.length === 0) { return [] }

    const now = new Date().toISOString()
    const values: any[] = []
    const sqlParts: string[] = []
    let paramIndex = 1

    for (const chunk of chunks) {
      sqlParts.push(`($${paramIndex}, $${paramIndex + 1}, $${paramIndex + 2}, $${paramIndex + 3}, $${paramIndex + 4}, $${paramIndex + 5})`)
      values.push(randomUUID(), chunk.prdId, chunk.chunkIndex, chunk.content, JSON.stringify(chunk.metadata || {}), now)
      paramIndex += 6
    }

    const sql = `
      INSERT INTO prd_chunks (id, prd_id, chunk_index, content, metadata, created_at)
      VALUES ${sqlParts.join(', ')}
      RETURNING *
    `

    const result = await dbClient.query<any>(sql, values)
    return result.rows.map(row => this.mapRow(row))
  }

  // 按 ID 批量查询
  static async findByIds (ids: string[]): Promise<PrdChunk[]> {
    if (ids.length === 0) { return [] }
    const placeholders = ids.map((_, i) => `$${i + 1}`).join(', ')
    const sql = `SELECT * FROM prd_chunks WHERE id IN (${placeholders})`
    const result = await dbClient.query<any>(sql, ids)
    return result.rows.map(row => this.mapRow(row))
  }

  // 按 PRD ID 查询所有块
  static async findByPrdId (prdId: string): Promise<PrdChunk[]> {
    const sql = `SELECT * FROM prd_chunks WHERE prd_id = $1 ORDER BY chunk_index ASC`
    const result = await dbClient.query<any>(sql, [prdId])
    return result.rows.map(row => this.mapRow(row))
  }

  // 删除 PRD 的所有块（重建索引前调用）
  static async deleteByPrdId (prdId: string): Promise<number> {
    // 先删除 document_embeddings 中关联的向量
    const chunksSql = `SELECT id FROM prd_chunks WHERE prd_id = $1`
    const chunksResult = await dbClient.query<{ id: string }>(chunksSql, [prdId])
    if (chunksResult.rows.length > 0) {
      const chunkIds = chunksResult.rows.map(r => r.id)
      const placeholders = chunkIds.map((_, i) => `$${i + 1}`).join(', ')
      await dbClient.query(`DELETE FROM document_embeddings WHERE chunk_id IN (${placeholders})`, chunkIds)
    }

    const sql = `DELETE FROM prd_chunks WHERE prd_id = $1`
    const result = await dbClient.query(sql, [prdId])
    return result.rowCount || 0
  }

  // 统计 PRD 的块数量
  static async countByPrdId (prdId: string): Promise<number> {
    const sql = `SELECT COUNT(*) as count FROM prd_chunks WHERE prd_id = $1`
    const result = await dbClient.query<{ count: string }>(sql, [prdId])
    return parseInt(result.rows[0].count, 10)
  }

  private static mapRow (row: any): PrdChunk {
    return {
      id: row.id,
      prdId: row.prd_id,
      chunkIndex: row.chunk_index,
      content: row.content,
      metadata: typeof row.metadata === 'string' ? JSON.parse(row.metadata) : row.metadata,
      createdAt: row.created_at
    }
  }
}
