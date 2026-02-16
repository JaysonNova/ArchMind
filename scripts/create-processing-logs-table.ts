#!/usr/bin/env node

/**
 * 数据库迁移脚本 - 创建文档处理日志表
 *
 * 用于记录文档处理过程中的每个步骤
 *
 * 使用方式:
 * pnpm tsx scripts/create-processing-logs-table.ts
 */

import 'dotenv/config'
import { dbClient } from '../lib/db/client'

async function createProcessingLogsTable() {
  console.log('🔄 开始创建 document_processing_logs 表...\n')

  try {
    // 创建表
    console.log('1️⃣ 创建表结构...')
    await dbClient.query(`
      CREATE TABLE IF NOT EXISTS document_processing_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
        stage TEXT NOT NULL,  -- 'upload', 'extract', 'chunk', 'embed', 'store', 'complete', 'error'
        status TEXT NOT NULL,  -- 'start', 'progress', 'complete', 'error'
        message TEXT,
        metadata JSONB,
        duration_ms INTEGER,  -- 耗时（毫秒）
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `)
    console.log('   ✅ 表创建成功\n')

    // 创建索引
    console.log('2️⃣ 创建索引...')
    await dbClient.query(`
      CREATE INDEX IF NOT EXISTS idx_processing_logs_document ON document_processing_logs(document_id);
      CREATE INDEX IF NOT EXISTS idx_processing_logs_created ON document_processing_logs(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_processing_logs_stage ON document_processing_logs(stage);
    `)
    console.log('   ✅ 索引创建成功\n')

    console.log('🎉 数据库迁移完成!\n')
    console.log('📋 document_processing_logs 表字段:')
    console.log('   - id: UUID 主键')
    console.log('   - document_id: 文档 ID (外键)')
    console.log('   - stage: 处理阶段 (upload/extract/chunk/embed/store/complete/error)')
    console.log('   - status: 状态 (start/progress/complete/error)')
    console.log('   - message: 日志消息')
    console.log('   - metadata: 附加元数据 (JSON)')
    console.log('   - duration_ms: 耗时（毫秒）')
    console.log('   - created_at: 创建时间')

  } catch (error) {
    console.error('❌ 迁移失败:', error)
    throw error
  } finally {
    await dbClient.close()
  }
}

// 运行迁移
createProcessingLogsTable().catch(error => {
  console.error('\n❌ 迁移失败:', error)
  process.exit(1)
})
