/**
 * 系统配置 DAO
 */

import { dbClient } from '../client'

export interface SystemConfig {
  key: string;
  value: Record<string, any>;
  description?: string;
  updatedAt: string;
}

export class ConfigDAO {
  /**
   * 获取配置值
   */
  static async get (key: string): Promise<Record<string, any> | null> {
    const sql = 'SELECT value FROM system_config WHERE key = $1'
    const result = await dbClient.query<any>(sql, [key])

    if (result.rows.length === 0) {
      return null
    }

    const value = result.rows[0].value
    return typeof value === 'string' ? JSON.parse(value) : value
  }

  /**
   * 设置配置值
   */
  static async set (key: string, value: Record<string, any>, description?: string): Promise<SystemConfig> {
    const now = new Date().toISOString()

    const sql = `
      INSERT INTO system_config (key, value, description, updated_at)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (key) DO UPDATE SET
        value = $2,
        description = COALESCE($3, system_config.description),
        updated_at = $4
      RETURNING *
    `

    const result = await dbClient.query<any>(sql, [
      key,
      JSON.stringify(value),
      description || null,
      now
    ])

    return this.mapRowToConfig(result.rows[0])
  }

  /**
   * 获取所有配置
   */
  static async getAll (): Promise<SystemConfig[]> {
    const sql = 'SELECT * FROM system_config ORDER BY key'
    const result = await dbClient.query<any>(sql)

    return result.rows.map(row => this.mapRowToConfig(row))
  }

  /**
   * 删除配置
   */
  static async delete (key: string): Promise<boolean> {
    const sql = 'DELETE FROM system_config WHERE key = $1'
    const result = await dbClient.query(sql, [key])
    return result.rowCount! > 0
  }

  private static mapRowToConfig (row: any): SystemConfig {
    return {
      key: row.key,
      value: typeof row.value === 'string' ? JSON.parse(row.value) : row.value,
      description: row.description,
      updatedAt: row.updated_at
    }
  }
}
