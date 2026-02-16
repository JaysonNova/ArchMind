import { randomUUID } from 'crypto'
import { dbClient } from '../client'

export interface DocumentVersion {
  id: string
  documentId: string
  version: number
  storageKey: string
  fileSize?: number
  content?: string
  contentHash?: string
  changeSummary?: string
  createdBy?: string
  createdAt: Date
}

export class DocumentVersionDAO {
  /**
   * 创建新版本
   */
  static async create(data: {
    documentId: string
    version: number
    storageKey: string
    fileSize?: number
    content?: string
    contentHash?: string
    changeSummary?: string
    createdBy?: string
  }): Promise<DocumentVersion> {
    const id = randomUUID()
    const now = new Date().toISOString()

    const sql = `
      INSERT INTO document_versions (
        id, document_id, version, storage_key, file_size,
        content, content_hash, change_summary, created_by, created_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `

    const result = await dbClient.query<any>(sql, [
      id,
      data.documentId,
      data.version,
      data.storageKey,
      data.fileSize || null,
      data.content || null,
      data.contentHash || null,
      data.changeSummary || null,
      data.createdBy || null,
      now
    ])

    return this.mapRowToVersion(result.rows[0])
  }

  /**
   * 查询文档的所有版本
   */
  static async findByDocumentId(documentId: string): Promise<DocumentVersion[]> {
    const sql = `
      SELECT * FROM document_versions
      WHERE document_id = $1
      ORDER BY version DESC
    `

    const result = await dbClient.query<any>(sql, [documentId])
    return result.rows.map(row => this.mapRowToVersion(row))
  }

  /**
   * 查询特定版本
   */
  static async findByDocumentIdAndVersion(
    documentId: string,
    version: number
  ): Promise<DocumentVersion | null> {
    const sql = `
      SELECT * FROM document_versions
      WHERE document_id = $1 AND version = $2
    `

    const result = await dbClient.query<any>(sql, [documentId, version])
    return result.rows.length > 0 ? this.mapRowToVersion(result.rows[0]) : null
  }

  /**
   * 查询文档的最新版本号
   */
  static async getLatestVersion(documentId: string): Promise<number> {
    const sql = `
      SELECT MAX(version) as max_version
      FROM document_versions
      WHERE document_id = $1
    `

    const result = await dbClient.query<any>(sql, [documentId])
    return result.rows[0]?.max_version || 0
  }

  /**
   * 删除文档的所有版本
   */
  static async deleteByDocumentId(documentId: string): Promise<void> {
    const sql = 'DELETE FROM document_versions WHERE document_id = $1'
    await dbClient.query(sql, [documentId])
  }

  /**
   * 统计文档的版本数量
   */
  static async countByDocumentId(documentId: string): Promise<number> {
    const sql = `
      SELECT COUNT(*) as count
      FROM document_versions
      WHERE document_id = $1
    `

    const result = await dbClient.query<{ count: string }>(sql, [documentId])
    return parseInt(result.rows[0].count, 10)
  }

  private static mapRowToVersion(row: any): DocumentVersion {
    return {
      id: row.id,
      documentId: row.document_id,
      version: row.version,
      storageKey: row.storage_key,
      fileSize: row.file_size,
      content: row.content,
      contentHash: row.content_hash,
      changeSummary: row.change_summary,
      createdBy: row.created_by,
      createdAt: new Date(row.created_at)
    }
  }
}
