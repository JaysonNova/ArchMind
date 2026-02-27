/**
 * 前端设计方案 DAO
 */

import { randomUUID } from 'crypto'
import type { PoolClient } from 'pg'
import { dbClient } from '../client'
import type { DesignDocument } from '~/types/design-doc'

export class DesignDocDAO {
  static async create(doc: Omit<DesignDocument, 'id' | 'createdAt' | 'updatedAt'>): Promise<DesignDocument> {
    const id = randomUUID()
    const now = new Date().toISOString()

    const sql = `
      INSERT INTO design_documents (
        id, user_id, workspace_id, title, feishu_url, feishu_doc_title,
        feishu_doc_content, content, model_used, generation_time,
        token_count, estimated_cost, status, metadata, created_at, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      RETURNING *
    `

    const result = await dbClient.query<any>(sql, [
      id,
      doc.userId,
      doc.workspaceId || null,
      doc.title,
      doc.feishuUrl || null,
      doc.feishuDocTitle || null,
      doc.feishuDocContent || null,
      doc.content,
      doc.modelUsed || null,
      doc.generationTime || null,
      doc.tokenCount || null,
      doc.estimatedCost || null,
      doc.status || 'draft',
      JSON.stringify(doc.metadata || {}),
      now,
      now
    ])

    return this.mapRow(result.rows[0])
  }

  static async createWithClient(
    client: PoolClient,
    doc: Omit<DesignDocument, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<DesignDocument> {
    const id = randomUUID()
    const now = new Date().toISOString()

    const sql = `
      INSERT INTO design_documents (
        id, user_id, workspace_id, title, feishu_url, feishu_doc_title,
        feishu_doc_content, content, model_used, generation_time,
        token_count, estimated_cost, status, metadata, created_at, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      RETURNING *
    `

    const result = await client.query<any>(sql, [
      id,
      doc.userId,
      doc.workspaceId || null,
      doc.title,
      doc.feishuUrl || null,
      doc.feishuDocTitle || null,
      doc.feishuDocContent || null,
      doc.content,
      doc.modelUsed || null,
      doc.generationTime || null,
      doc.tokenCount || null,
      doc.estimatedCost || null,
      doc.status || 'draft',
      JSON.stringify(doc.metadata || {}),
      now,
      now
    ])

    return this.mapRow(result.rows[0])
  }

  static async findById(id: string): Promise<DesignDocument | null> {
    const sql = 'SELECT * FROM design_documents WHERE id = $1'
    const result = await dbClient.query<any>(sql, [id])
    if (result.rows.length === 0) return null
    return this.mapRow(result.rows[0])
  }

  static async findAll(options?: {
    limit?: number
    offset?: number
    userId?: string
    workspaceId?: string
    orderBy?: 'created_at' | 'updated_at'
    order?: 'ASC' | 'DESC'
  }): Promise<{ items: DesignDocument[]; total: number }> {
    const {
      limit = 20,
      offset = 0,
      userId,
      workspaceId,
      orderBy = 'created_at',
      order = 'DESC'
    } = options || {}

    const conditions: string[] = []
    const params: any[] = []
    let paramIndex = 1

    if (userId) {
      conditions.push(`user_id = $${paramIndex++}`)
      params.push(userId)
    }
    if (workspaceId) {
      conditions.push(`workspace_id = $${paramIndex++}`)
      params.push(workspaceId)
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

    const countSql = `SELECT COUNT(*) as total FROM design_documents ${whereClause}`
    const countResult = await dbClient.query<{ total: string }>(countSql, params)
    const total = parseInt(countResult.rows[0].total, 10)

    const dataSql = `
      SELECT * FROM design_documents
      ${whereClause}
      ORDER BY ${orderBy} ${order}
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}
    `
    const dataResult = await dbClient.query<any>(dataSql, [...params, limit, offset])

    return {
      items: dataResult.rows.map((row: any) => this.mapRow(row)),
      total
    }
  }

  static async delete(id: string, userId: string): Promise<boolean> {
    const sql = 'DELETE FROM design_documents WHERE id = $1 AND user_id = $2'
    const result = await dbClient.query(sql, [id, userId])
    return (result.rowCount ?? 0) > 0
  }

  static async updateTitle(id: string, userId: string, title: string): Promise<DesignDocument | null> {
    const sql = `
      UPDATE design_documents
      SET title = $1, updated_at = NOW()
      WHERE id = $2 AND user_id = $3
      RETURNING *
    `
    const result = await dbClient.query<any>(sql, [title, id, userId])
    if (result.rows.length === 0) return null
    return this.mapRow(result.rows[0])
  }

  static async updateContent(id: string, userId: string, content: string, title?: string): Promise<DesignDocument | null> {
    const fields = ['content = $1', 'updated_at = NOW()']
    const params: any[] = [content]
    let paramIndex = 2

    if (title !== undefined) {
      fields.push(`title = $${paramIndex++}`)
      params.push(title)
    }

    params.push(id, userId)
    const sql = `
      UPDATE design_documents
      SET ${fields.join(', ')}
      WHERE id = $${paramIndex++} AND user_id = $${paramIndex++}
      RETURNING *
    `
    const result = await dbClient.query<any>(sql, params)
    if (result.rows.length === 0) return null
    return this.mapRow(result.rows[0])
  }

  private static mapRow(row: any): DesignDocument {
    return {
      id: row.id,
      userId: row.user_id,
      workspaceId: row.workspace_id,
      title: row.title,
      feishuUrl: row.feishu_url,
      feishuDocTitle: row.feishu_doc_title,
      feishuDocContent: row.feishu_doc_content,
      content: row.content,
      modelUsed: row.model_used,
      generationTime: row.generation_time,
      tokenCount: row.token_count,
      estimatedCost: row.estimated_cost ? parseFloat(row.estimated_cost) : undefined,
      status: row.status,
      metadata: row.metadata || {},
      createdAt: row.created_at?.toISOString?.() || row.created_at,
      updatedAt: row.updated_at?.toISOString?.() || row.updated_at
    }
  }
}
