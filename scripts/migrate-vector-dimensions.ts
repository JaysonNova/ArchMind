#!/usr/bin/env node

/**
 * 数据库迁移脚本 - 修改向量维度
 *
 * 将 document_chunks.embedding 列从 vector(1536) 修改为 vector(2048)
 * 以支持智谱 AI embedding-3 模型
 *
 * ⚠️ 警告: 此操作将清除所有现有向量数据
 *
 * 使用方式:
 * pnpm tsx scripts/migrate-vector-dimensions.ts
 */

import 'dotenv/config'
import { dbClient } from '../lib/db/client'

async function migrateVectorDimensions() {
  console.log('🔄 开始迁移向量维度...\n')
  console.log('⚠️  警告: 此操作将清除所有现有向量数据!\n')

  try {
    // 1. 检查当前向量列的维度
    console.log('1️⃣ 检查当前向量列维度...')
    const checkResult = await dbClient.query(`
      SELECT
        column_name,
        udt_name,
        data_type
      FROM information_schema.columns
      WHERE table_name = 'document_chunks'
        AND column_name = 'embedding'
    `)

    if (checkResult.rows.length === 0) {
      throw new Error('未找到 embedding 列')
    }

    console.log(`   当前类型: ${checkResult.rows[0].udt_name}`)
    console.log('   ✅ 检查完成\n')

    // 2. 删除现有的向量索引
    console.log('2️⃣ 删除现有的向量索引...')
    await dbClient.query(`
      DROP INDEX IF EXISTS idx_chunks_embedding_ivfflat CASCADE
    `)
    console.log('   ✅ 索引删除成功\n')

    // 3. 修改列类型为 vector(2048)
    console.log('3️⃣ 修改向量列维度为 2048...')
    await dbClient.query(`
      ALTER TABLE document_chunks
      ALTER COLUMN embedding TYPE vector(2048)
      USING NULL  -- 清除现有数据
    `)
    console.log('   ✅ 列类型修改成功\n')

    // 4. 重新创建向量索引
    console.log('4️⃣ 重新创建向量索引 (IVFFlat)...')
    await dbClient.query(`
      CREATE INDEX idx_chunks_embedding_ivfflat
      ON document_chunks
      USING ivfflat (embedding vector_cosine_ops)
      WITH (lists = 100)
    `)
    console.log('   ✅ 索引创建成功\n')

    // 5. 统计需要重新处理的文档数量
    console.log('5️⃣ 统计需要重新处理的文档...')
    const docCountResult = await dbClient.query(`
      SELECT COUNT(*) as count
      FROM documents
      WHERE processing_status = 'completed'
    `)
    const docCount = parseInt(docCountResult.rows[0].count, 10)
    console.log(`   需要重新处理的文档数量: ${docCount}\n`)

    // 6. 更新文档处理状态
    if (docCount > 0) {
      console.log('6️⃣ 更新文档处理状态为 pending...')
      await dbClient.query(`
        UPDATE documents
        SET
          processing_status = 'pending',
          vectors_count = 0,
          processing_completed_at = NULL
        WHERE processing_status = 'completed'
      `)
      console.log('   ✅ 文档状态更新成功\n')
    }

    console.log('🎉 向量维度迁移完成!\n')
    console.log('📋 迁移总结:')
    console.log(`   - 向量维度: 1536 → 2048`)
    console.log(`   - 需要重新向量化的文档: ${docCount} 个`)
    console.log('\n💡 下一步操作:')
    console.log('   1. 确保 .env 中配置了 GLM_API_KEY')
    console.log('   2. 默认模型会自动使用智谱 AI embedding-3 (2048 维)')
    console.log('   3. 重新上传文档或手动触发向量化处理')

  } catch (error) {
    console.error('❌ 迁移失败:', error)
    throw error
  } finally {
    await dbClient.close()
  }
}

// 运行迁移
migrateVectorDimensions().catch(error => {
  console.error('\n❌ 迁移失败:', error)
  process.exit(1)
})
