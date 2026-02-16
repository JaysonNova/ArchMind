import { randomUUID } from 'crypto'
import { dbClient } from '../client'
import type { DocumentChunk } from '@/types/document'

export class DocumentChunkDAO {
  // 批量创建文档块
  static async createMany (chunks: Omit<DocumentChunk, 'id' | 'createdAt'>[]): Promise<DocumentChunk[]> {
    if (chunks.length === 0) { return [] }

    const now = new Date().toISOString()
    const ids: string[] = []
    const values: any[] = []

    let paramIndex = 1
    const sqlParts: string[] = []

    for (const chunk of chunks) {
      const id = randomUUID()
      ids.push(id)
      sqlParts.push(`($${paramIndex}, $${paramIndex + 1}, $${paramIndex + 2}, $${paramIndex + 3}, $${paramIndex + 4}, $${paramIndex + 5})`)
      values.push(id, chunk.documentId, chunk.chunkIndex, chunk.content, JSON.stringify(chunk.metadata || {}), now)
      paramIndex += 6
    }

    const sql = `
      INSERT INTO document_chunks (id, document_id, chunk_index, content, metadata, created_at)
      VALUES ${sqlParts.join(', ')}
      RETURNING *
    `

    const result = await dbClient.query<any>(sql, values)

    return result.rows.map(row => this.mapRowToChunk(row))
  }

  // 按 ID 批量查询
  static async findByIds (ids: string[]): Promise<DocumentChunk[]> {
    if (ids.length === 0) { return [] }

    const placeholders = ids.map((_, i) => `$${i + 1}`).join(', ')
    const sql = `SELECT * FROM document_chunks WHERE id IN (${placeholders})`

    const result = await dbClient.query<any>(sql, ids)

    return result.rows.map(row => this.mapRowToChunk(row))
  }

  // 按文档 ID 查询所有块
  static async findByDocumentId (documentId: string): Promise<DocumentChunk[]> {
    const sql = `
      SELECT * FROM document_chunks
      WHERE document_id = $1
      ORDER BY chunk_index ASC
    `

    const result = await dbClient.query<any>(sql, [documentId])

    return result.rows.map(row => this.mapRowToChunk(row))
  }

  // 删除文档的所有块
  static async deleteByDocumentId (documentId: string): Promise<number> {
    const sql = 'DELETE FROM document_chunks WHERE document_id = $1'
    const result = await dbClient.query(sql, [documentId])
    return result.rowCount || 0
  }

  // 统计文档的块数量
  static async countByDocumentId (documentId: string): Promise<number> {
    const sql = 'SELECT COUNT(*) as count FROM document_chunks WHERE document_id = $1'
    const result = await dbClient.query<{ count: string }>(sql, [documentId])
    return parseInt(result.rows[0].count, 10)
  }

  private static mapRowToChunk (row: any): DocumentChunk {
    return {
      id: row.id,
      documentId: row.document_id,
      chunkIndex: row.chunk_index,
      content: row.content,
      metadata: typeof row.metadata === 'string' ? JSON.parse(row.metadata) : row.metadata,
      createdAt: row.created_at
    }
  }
}
