#!/usr/bin/env node

/**
 * 数据库迁移脚本 - 扩展 documents 表
 *
 * 添加存储相关字段:
 * - storage_provider (存储提供商)
 * - storage_bucket (存储桶)
 * - storage_key (对象键)
 * - content_hash (文件哈希，用于去重)
 * - processing_status (处理状态)
 * - processing_error (处理错误信息)
 * - retry_count (重试次数)
 * - chunks_count (块数量)
 * - vectors_count (向量数量)
 * - processing_started_at (处理开始时间)
 * - processing_completed_at (处理完成时间)
 *
 * 使用方式:
 * pnpm tsx scripts/migrate-documents-schema.ts
 */

import 'dotenv/config'
import { dbClient } from '../lib/db/client'

async function migrateDocumentsSchema() {
  console.log('🔄 开始迁移 documents 表结构...\n')

  try {
    // 1. 添加存储相关字段
    console.log('1️⃣ 添加存储相关字段...')
    await dbClient.query(`
      ALTER TABLE documents
      ADD COLUMN IF NOT EXISTS storage_provider TEXT DEFAULT 'local',
      ADD COLUMN IF NOT EXISTS storage_bucket TEXT,
      ADD COLUMN IF NOT EXISTS storage_key TEXT,
      ADD COLUMN IF NOT EXISTS content_hash TEXT
    `)
    console.log('   ✅ 存储字段添加成功\n')

    // 2. 添加处理状态字段
    console.log('2️⃣ 添加处理状态字段...')
    await dbClient.query(`
      ALTER TABLE documents
      ADD COLUMN IF NOT EXISTS processing_status TEXT DEFAULT 'pending'
        CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed', 'retrying')),
      ADD COLUMN IF NOT EXISTS processing_error TEXT,
      ADD COLUMN IF NOT EXISTS retry_count INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS chunks_count INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS vectors_count INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS processing_started_at TIMESTAMP WITH TIME ZONE,
      ADD COLUMN IF NOT EXISTS processing_completed_at TIMESTAMP WITH TIME ZONE
    `)
    console.log('   ✅ 处理状态字段添加成功\n')

    // 3. 创建索引
    console.log('3️⃣ 创建索引...')
    await dbClient.query(`
      CREATE INDEX IF NOT EXISTS idx_documents_storage_key ON documents(storage_key);
      CREATE INDEX IF NOT EXISTS idx_documents_content_hash ON documents(content_hash);
      CREATE INDEX IF NOT EXISTS idx_documents_processing_status ON documents(processing_status);
    `)
    console.log('   ✅ 索引创建成功\n')

    // 4. 更新现有记录的 storage_provider
    console.log('4️⃣ 更新现有记录的 storage_provider...')
    const result = await dbClient.query(`
      UPDATE documents
      SET storage_provider = 'local'
      WHERE storage_provider IS NULL
      RETURNING id
    `)
    console.log(`   ✅ 更新了 ${result.rowCount} 条记录\n`)

    console.log('🎉 数据库迁移完成!\n')
    console.log('📋 新增字段列表:')
    console.log('   - storage_provider (存储提供商)')
    console.log('   - storage_bucket (存储桶)')
    console.log('   - storage_key (对象键)')
    console.log('   - content_hash (文件哈希)')
    console.log('   - processing_status (处理状态)')
    console.log('   - processing_error (处理错误)')
    console.log('   - retry_count (重试次数)')
    console.log('   - chunks_count (块数量)')
    console.log('   - vectors_count (向量数量)')
    console.log('   - processing_started_at (处理开始时间)')
    console.log('   - processing_completed_at (处理完成时间)')

  } catch (error) {
    console.error('❌ 迁移失败:', error)
    throw error
  } finally {
    await dbClient.close()
  }
}

// 运行迁移
migrateDocumentsSchema().catch(error => {
  console.error('\n❌ 迁移失败:', error)
  process.exit(1)
})
