#!/usr/bin/env node
/**
 * 数据库迁移脚本 - 添加 logic_maps 表
 */

import dotenv from 'dotenv'
import { dbClient } from './client'
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

// 加载环境变量
dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

async function migrate() {
  try {
    console.log('开始数据库迁移: 添加 logic_maps 表...')

    const sql = readFileSync(
      join(__dirname, 'migrations', 'add_logic_maps_table.sql'),
      'utf-8'
    )

    await dbClient.query(sql)

    console.log('✓ logic_maps 表创建成功')
    console.log('✓ 数据库迁移完成')
    process.exit(0)
  } catch (error) {
    console.error('✗ 数据库迁移失败:', error)
    process.exit(1)
  }
}

migrate()
