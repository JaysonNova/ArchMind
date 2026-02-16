#!/usr/bin/env node

/**
 * 数据库迁移脚本 - 创建文档访问令牌表
 *
 * 用于实现临时分享链接功能
 *
 * 使用方式:
 * pnpm tsx scripts/create-document-access-tokens-table.ts
 */

import 'dotenv/config'
import { dbClient } from '../lib/db/client'

async function createDocumentAccessTokensTable() {
  console.log('🔄 开始创建 document_access_tokens 表...\n')

  try {
    // 创建表
    console.log('1️⃣ 创建表结构...')
    await dbClient.query(`
      CREATE TABLE IF NOT EXISTS document_access_tokens (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
        token TEXT NOT NULL UNIQUE,
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
        access_count INTEGER DEFAULT 0,
        max_access_count INTEGER DEFAULT 10,
        created_by UUID,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `)
    console.log('   ✅ 表创建成功\n')

    // 创建索引
    console.log('2️⃣ 创建索引...')
    await dbClient.query(`
      CREATE INDEX IF NOT EXISTS idx_access_tokens_document ON document_access_tokens(document_id);
      CREATE INDEX IF NOT EXISTS idx_access_tokens_token ON document_access_tokens(token);
      CREATE INDEX IF NOT EXISTS idx_access_tokens_expires ON document_access_tokens(expires_at);
    `)
    console.log('   ✅ 索引创建成功\n')

    console.log('🎉 数据库迁移完成!\n')
    console.log('📋 document_access_tokens 表字段:')
    console.log('   - id: UUID 主键')
    console.log('   - document_id: 文档 ID (外键)')
    console.log('   - token: 访问令牌 (唯一)')
    console.log('   - expires_at: 过期时间')
    console.log('   - access_count: 已访问次数')
    console.log('   - max_access_count: 最大访问次数')
    console.log('   - created_by: 创建者 ID')
    console.log('   - created_at: 创建时间')

  } catch (error) {
    console.error('❌ 迁移失败:', error)
    throw error
  } finally {
    await dbClient.close()
  }
}

// 运行迁移
createDocumentAccessTokensTable().catch(error => {
  console.error('\n❌ 迁移失败:', error)
  process.exit(1)
})
