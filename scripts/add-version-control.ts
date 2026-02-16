/**
 * 添加文档版本控制支持
 *
 * 功能:
 * 1. 为 documents 表添加 current_version 字段
 * 2. 创建 document_versions 表
 * 3. 添加相关索引
 */

import 'dotenv/config'
import { dbClient } from '~/lib/db/client'

async function addVersionControl() {
  const query = dbClient.query.bind(dbClient)
  console.log('🚀 开始添加文档版本控制支持...\n')

  try {
    // 1. 为 documents 表添加版本字段
    console.log('📝 添加 current_version 字段...')
    await query(`
      ALTER TABLE documents
      ADD COLUMN IF NOT EXISTS current_version INTEGER DEFAULT 1
    `)
    console.log('✅ current_version 字段添加成功\n')

    // 2. 创建 document_versions 表
    console.log('📝 创建 document_versions 表...')
    await query(`
      CREATE TABLE IF NOT EXISTS document_versions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
        version INTEGER NOT NULL,
        storage_key TEXT NOT NULL,
        file_size INTEGER,
        content TEXT,
        content_hash TEXT,
        change_summary TEXT,
        created_by UUID,
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(document_id, version)
      )
    `)
    console.log('✅ document_versions 表创建成功\n')

    // 3. 创建索引
    console.log('📝 创建索引...')
    await query(`
      CREATE INDEX IF NOT EXISTS idx_document_versions_document
      ON document_versions(document_id)
    `)
    await query(`
      CREATE INDEX IF NOT EXISTS idx_document_versions_created
      ON document_versions(created_at DESC)
    `)
    console.log('✅ 索引创建成功\n')

    // 4. 为现有文档设置初始版本
    console.log('📝 为现有文档设置初始版本...')
    const result = await query(`
      UPDATE documents
      SET current_version = 1
      WHERE current_version IS NULL
    `)
    console.log(`✅ 已更新 ${result.rowCount} 个文档的版本号\n`)

    console.log('🎉 文档版本控制支持添加完成!')
  } catch (error) {
    console.error('❌ 错误:', error)
    throw error
  } finally {
    await dbClient.close()
  }
}

// 运行迁移
addVersionControl().catch(console.error)
