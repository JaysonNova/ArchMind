#!/usr/bin/env node

/**
 * 工作区功能数据库迁移脚本
 *
 * 功能:
 * 1. 创建 workspaces 表
 * 2. 为 documents 和 prd_documents 添加 workspace_id 字段
 * 3. 创建默认工作区
 * 4. 初始化系统配置
 */

import 'dotenv/config'
import { dbClient } from '../lib/db/client.js'
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

async function runMigration() {
  console.log('🚀 开始工作区功能迁移...\n')

  try {
    // 读取迁移 SQL 文件
    const migrationSQL = readFileSync(
      join(__dirname, '../migrations/add-workspaces-support.sql'),
      'utf-8'
    )

    // 执行迁移
    console.log('📝 执行数据库迁移...')
    await dbClient.query(migrationSQL)
    console.log('✅ 数据库迁移完成\n')

    // 验证迁移结果
    console.log('🔍 验证迁移结果...')

    const workspaceCheck = await dbClient.query(
      "SELECT COUNT(*) as count FROM workspaces WHERE id = 'default'"
    )

    if (parseInt(workspaceCheck.rows[0].count) > 0) {
      console.log('✅ 默认工作区创建成功')
    } else {
      throw new Error('默认工作区创建失败')
    }

    // 检查 workspace_id 列是否添加成功
    const columnsCheck = await dbClient.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name IN ('documents', 'prd_documents')
      AND column_name = 'workspace_id'
    `)

    if (columnsCheck.rows.length === 2) {
      console.log('✅ workspace_id 字段添加成功')
    } else {
      console.warn('⚠️  workspace_id 字段可能未完全添加')
    }

    console.log('\n🎉 工作区功能迁移完成!')
    console.log('\n下一步:')
    console.log('  1. 启动应用: pnpm dev')
    console.log('  2. 在首页可以看到工作区切换器')
    console.log('  3. 可以创建新的工作区来组织项目\n')

  } catch (error) {
    console.error('❌ 迁移失败:', error)
    throw error
  } finally {
    await dbClient.close()
  }
}

// 运行迁移
runMigration().catch((error) => {
  console.error('Migration failed:', error)
  process.exit(1)
})
