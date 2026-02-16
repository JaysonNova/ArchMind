#!/usr/bin/env node

/**
 * 数据库数据填充脚本
 * 填充初始化数据用于开发和测试
 *
 * 用法: pnpm db:seed
 */

import { Pool } from 'pg'
import { v4 as uuidv4 } from 'uuid'

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://localhost:5432/archmind'

const pool = new Pool({
  connectionString: DATABASE_URL
})

/**
 * 创建默认用户
 */
async function seedUsers (client: any): Promise<void> {
  console.log('📝 Seeding users...')

  const userId = uuidv4()
  const now = new Date().toISOString()

  // 检查是否已存在
  const check = await client.query(
    'SELECT id FROM users WHERE email = $1',
    ['demo@example.com']
  )

  if (check.rows.length > 0) {
    console.log('⏭️  Users already exist, skipping...')
    return
  }

  await client.query(
    `INSERT INTO users (id, username, email, password_hash, full_name, is_active, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [
      userId,
      'demo',
      'demo@example.com',
      'hashed_password_placeholder',
      'Demo User',
      true,
      now,
      now
    ]
  )

  console.log('✅ Demo user created')
}

/**
 * 创建示例文档
 */
async function seedDocuments (client: any): Promise<void> {
  console.log('📝 Seeding sample documents...')

  const userId = (await client.query('SELECT id FROM users LIMIT 1')).rows[0]?.id

  if (!userId) {
    console.log('⚠️  No user found, skipping documents...')
    return
  }

  // 检查是否已存在
  const check = await client.query(
    'SELECT id FROM documents WHERE title = $1',
    ['Sample Product Requirements']
  )

  if (check.rows.length > 0) {
    console.log('⏭️  Documents already exist, skipping...')
    return
  }

  const documents = [
    {
      title: 'Sample Product Requirements',
      fileType: 'markdown',
      filePath: 'sample/requirements.md',
      content: `# Product Requirements Document

## Overview
This is a sample PRD for demonstration purposes.

## Features
- User authentication
- Document management
- Real-time collaboration
- Search functionality

## Technical Stack
- Frontend: Vue 3 + Nuxt 3
- Backend: Node.js
- Database: PostgreSQL
- AI: Multi-model support`,
      fileSize: 512
    },
    {
      title: 'Architecture Overview',
      fileType: 'markdown',
      filePath: 'sample/architecture.md',
      content: `# System Architecture

## Components
1. Frontend - Nuxt 3 application
2. API Server - Node.js with Nuxt Server
3. Database - PostgreSQL with pgvector
4. AI Service - Multi-model adapter pattern

## Data Flow
User Request → API Endpoint → Business Logic → Database → Response`,
      fileSize: 320
    }
  ]

  const now = new Date().toISOString()

  for (const doc of documents) {
    const docId = uuidv4()

    await client.query(
      `INSERT INTO documents (id, user_id, title, file_path, file_type, file_size, content, status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        docId,
        userId,
        doc.title,
        doc.filePath,
        doc.fileType,
        doc.fileSize,
        doc.content,
        'uploaded',
        now,
        now
      ]
    )

    console.log(`  ✅ Created document: ${doc.title}`)
  }
}

/**
 * 创建系统配置
 */
async function seedConfig (client: any): Promise<void> {
  console.log('📝 Seeding system configuration...')

  // 检查是否已存在
  const check = await client.query(
    'SELECT key FROM system_config WHERE key = $1',
    ['aiModel']
  )

  if (check.rows.length > 0) {
    console.log('⏭️  Configuration already exists, skipping...')
    return
  }

  const now = new Date().toISOString()

  const configs = [
    {
      key: 'aiModel',
      value: {
        defaultModel: 'claude-3.5-sonnet',
        temperature: 0.7,
        maxTokens: 8000
      },
      description: 'AI Model Configuration'
    },
    {
      key: 'rag',
      value: {
        chunkSize: 1000,
        chunkOverlap: 200,
        topK: 5,
        similarityThreshold: 0.7,
        embeddingModel: 'text-embedding-3-small'
      },
      description: 'RAG Configuration'
    }
  ]

  for (const config of configs) {
    await client.query(
      `INSERT INTO system_config (key, value, description, updated_at)
       VALUES ($1, $2, $3, $4)`,
      [
        config.key,
        JSON.stringify(config.value),
        config.description,
        now
      ]
    )

    console.log(`  ✅ Created config: ${config.key}`)
  }
}

async function seedDatabase (): Promise<void> {
  const client = await pool.connect()

  try {
    console.log('🌱 Starting database seeding...\n')

    // 开始事务
    await client.query('BEGIN')

    await seedUsers(client)
    await seedDocuments(client)
    await seedConfig(client)

    // 提交事务
    await client.query('COMMIT')

    console.log('\n✨ Database seeding complete!')
  } catch (error) {
    await client.query('ROLLBACK')
    console.error('❌ Database seeding failed:', error)
    process.exit(1)
  } finally {
    client.release()
    await pool.end()
  }
}

// 运行数据填充
seedDatabase().catch((error) => {
  console.error('Fatal error:', error)
  process.exit(1)
})
