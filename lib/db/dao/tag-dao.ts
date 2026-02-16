/**
 * TagDAO - 标签数据访问对象
 * 提供标签的 CRUD 操作和关联管理
 */

import { dbClient } from '../client'
import type { Tag, CreateTagInput, UpdateTagInput } from '~/types/tag'

export class TagDAO {
  /**
   * 查询所有标签
   */
  static async findAll(): Promise<Tag[]> {
    const sql = `
      SELECT * FROM tags
      ORDER BY usage_count DESC, name ASC
    `
    const result = await dbClient.query(sql)
    return result.rows.map(row => this.mapRowToTag(row))
  }

  /**
   * 根据 ID 查询标签
   */
  static async findById(id: string): Promise<Tag | null> {
    const sql = 'SELECT * FROM tags WHERE id = $1'
    const result = await dbClient.query(sql, [id])

    if (result.rows.length === 0) {
      return null
    }

    return this.mapRowToTag(result.rows[0])
  }

  /**
   * 根据名称查询标签
   */
  static async findByName(name: string): Promise<Tag | null> {
    const sql = 'SELECT * FROM tags WHERE name = $1'
    const result = await dbClient.query(sql, [name])

    if (result.rows.length === 0) {
      return null
    }

    return this.mapRowToTag(result.rows[0])
  }

  /**
   * 创建标签
   */
  static async create(input: CreateTagInput): Promise<Tag> {
    const sql = `
      INSERT INTO tags (name, color, description)
      VALUES ($1, $2, $3)
      RETURNING *
    `

    const result = await dbClient.query(sql, [
      input.name,
      input.color || '#3B82F6',
      input.description || null
    ])

    return this.mapRowToTag(result.rows[0])
  }

  /**
   * 更新标签
   */
  static async update(id: string, input: UpdateTagInput): Promise<Tag | null> {
    const fields: string[] = []
    const values: any[] = []
    let paramIndex = 1

    if (input.name !== undefined) {
      fields.push(`name = $${paramIndex}`)
      values.push(input.name)
      paramIndex++
    }

    if (input.color !== undefined) {
      fields.push(`color = $${paramIndex}`)
      values.push(input.color)
      paramIndex++
    }

    if (input.description !== undefined) {
      fields.push(`description = $${paramIndex}`)
      values.push(input.description)
      paramIndex++
    }

    if (fields.length === 0) {
      return await this.findById(id)
    }

    values.push(id)
    const sql = `
      UPDATE tags
      SET ${fields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `

    const result = await dbClient.query(sql, values)

    if (result.rows.length === 0) {
      return null
    }

    return this.mapRowToTag(result.rows[0])
  }

  /**
   * 删除标签
   */
  static async delete(id: string): Promise<boolean> {
    const sql = 'DELETE FROM tags WHERE id = $1'
    const result = await dbClient.query(sql, [id])
    return (result.rowCount ?? 0) > 0
  }

  /**
   * 为文档添加标签
   */
  static async addToDocument(documentId: string, tagId: string): Promise<void> {
    const sql = `
      INSERT INTO document_tags (document_id, tag_id)
      VALUES ($1, $2)
      ON CONFLICT (document_id, tag_id) DO NOTHING
    `
    await dbClient.query(sql, [documentId, tagId])
  }

  /**
   * 从文档移除标签
   */
  static async removeFromDocument(documentId: string, tagId: string): Promise<void> {
    const sql = 'DELETE FROM document_tags WHERE document_id = $1 AND tag_id = $2'
    await dbClient.query(sql, [documentId, tagId])
  }

  /**
   * 查询文档的所有标签
   */
  static async findByDocumentId(documentId: string): Promise<Tag[]> {
    const sql = `
      SELECT t.*
      FROM tags t
      JOIN document_tags dt ON t.id = dt.tag_id
      WHERE dt.document_id = $1
      ORDER BY t.name ASC
    `
    const result = await dbClient.query(sql, [documentId])
    return result.rows.map(row => this.mapRowToTag(row))
  }

  /**
   * 查询使用某标签的所有文档 ID
   */
  static async findDocumentsByTagId(tagId: string): Promise<string[]> {
    const sql = 'SELECT document_id FROM document_tags WHERE tag_id = $1'
    const result = await dbClient.query(sql, [tagId])
    return result.rows.map(row => row.document_id)
  }

  /**
   * 批量为文档设置标签（先清除旧标签，再添加新标签）
   */
  static async setDocumentTags(documentId: string, tagIds: string[]): Promise<void> {
    // 开始事务
    await dbClient.query('BEGIN')

    try {
      // 1. 删除文档的所有标签
      await dbClient.query('DELETE FROM document_tags WHERE document_id = $1', [documentId])

      // 2. 添加新标签
      if (tagIds.length > 0) {
        const values = tagIds.map((tagId, index) =>
          `($1, $${index + 2})`
        ).join(', ')

        const sql = `
          INSERT INTO document_tags (document_id, tag_id)
          VALUES ${values}
          ON CONFLICT (document_id, tag_id) DO NOTHING
        `

        await dbClient.query(sql, [documentId, ...tagIds])
      }

      // 提交事务
      await dbClient.query('COMMIT')
    } catch (error) {
      // 回滚事务
      await dbClient.query('ROLLBACK')
      throw error
    }
  }

  /**
   * 搜索标签（按名称模糊匹配）
   */
  static async search(keyword: string, limit: number = 20): Promise<Tag[]> {
    const sql = `
      SELECT * FROM tags
      WHERE name ILIKE $1
      ORDER BY usage_count DESC, name ASC
      LIMIT $2
    `
    const result = await dbClient.query(sql, [`%${keyword}%`, limit])
    return result.rows.map(row => this.mapRowToTag(row))
  }

  /**
   * 获取热门标签（使用次数最多）
   */
  static async findPopular(limit: number = 10): Promise<Tag[]> {
    const sql = `
      SELECT * FROM tags
      WHERE usage_count > 0
      ORDER BY usage_count DESC, name ASC
      LIMIT $1
    `
    const result = await dbClient.query(sql, [limit])
    return result.rows.map(row => this.mapRowToTag(row))
  }

  /**
   * 映射数据库行到 Tag 对象
   */
  private static mapRowToTag(row: any): Tag {
    return {
      id: row.id,
      name: row.name,
      color: row.color,
      description: row.description,
      usageCount: row.usage_count,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }
  }
}
