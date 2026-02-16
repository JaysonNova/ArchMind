import { dbClient } from '../client'

export interface ProcessingLog {
  id: string
  documentId: string
  stage: 'upload' | 'extract' | 'chunk' | 'embed' | 'store' | 'complete' | 'error'
  status: 'start' | 'progress' | 'complete' | 'error'
  message: string
  metadata?: Record<string, any>
  durationMs?: number
  createdAt: string
}

export class ProcessingLogDAO {
  /**
   * 创建处理日志
   */
  static async create(log: Omit<ProcessingLog, 'id' | 'createdAt'>): Promise<ProcessingLog> {
    const sql = `
      INSERT INTO document_processing_logs (
        document_id, stage, status, message, metadata, duration_ms
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `

    const result = await dbClient.query(sql, [
      log.documentId,
      log.stage,
      log.status,
      log.message,
      log.metadata ? JSON.stringify(log.metadata) : null,
      log.durationMs || null
    ])

    return this.mapRowToLog(result.rows[0])
  }

  /**
   * 查询文档的所有日志
   */
  static async findByDocumentId(documentId: string): Promise<ProcessingLog[]> {
    const sql = `
      SELECT * FROM document_processing_logs
      WHERE document_id = $1
      ORDER BY created_at ASC
    `

    const result = await dbClient.query(sql, [documentId])
    return result.rows.map(row => this.mapRowToLog(row))
  }

  /**
   * 查询最近的日志
   */
  static async findRecent(limit: number = 100): Promise<ProcessingLog[]> {
    const sql = `
      SELECT * FROM document_processing_logs
      ORDER BY created_at DESC
      LIMIT $1
    `

    const result = await dbClient.query(sql, [limit])
    return result.rows.map(row => this.mapRowToLog(row))
  }

  /**
   * 删除文档的所有日志
   */
  static async deleteByDocumentId(documentId: string): Promise<void> {
    await dbClient.query(
      'DELETE FROM document_processing_logs WHERE document_id = $1',
      [documentId]
    )
  }

  /**
   * 清理旧日志（超过指定天数）
   */
  static async cleanupOldLogs(days: number = 30): Promise<number> {
    const sql = `
      DELETE FROM document_processing_logs
      WHERE created_at < NOW() - INTERVAL '${days} days'
    `

    const result = await dbClient.query(sql)
    return result.rowCount || 0
  }

  private static mapRowToLog(row: any): ProcessingLog {
    return {
      id: row.id,
      documentId: row.document_id,
      stage: row.stage,
      status: row.status,
      message: row.message,
      metadata: row.metadata ? (typeof row.metadata === 'string' ? JSON.parse(row.metadata) : row.metadata) : undefined,
      durationMs: row.duration_ms,
      createdAt: row.created_at
    }
  }
}
