/**
 * 添加全文检索支持
 *
 * 功能:
 * 1. 为 documents 表添加 tsvector 列
 * 2. 创建全文检索索引
 * 3. 创建触发器自动更新 tsvector
 * 4. 为现有数据生成 tsvector
 */

import 'dotenv/config'
import { dbClient } from '~/lib/db/client'

async function addFullTextSearch() {
  const query = dbClient.query.bind(dbClient)
  console.log('🚀 开始添加全文检索支持...\n')

  try {
    // 1. 添加 tsvector 列
    console.log('📝 添加 tsvector 列...')
    await query(`
      ALTER TABLE documents
      ADD COLUMN IF NOT EXISTS tsv tsvector
    `)
    console.log('✅ tsvector 列添加成功\n')

    // 2. 创建触发器函数
    console.log('📝 创建触发器函数...')
    await query(`
      CREATE OR REPLACE FUNCTION documents_tsv_trigger() RETURNS trigger AS $$
      BEGIN
        NEW.tsv :=
          setweight(to_tsvector('english', coalesce(NEW.title, '')), 'A') ||
          setweight(to_tsvector('english', coalesce(NEW.content, '')), 'B');
        RETURN NEW;
      END
      $$ LANGUAGE plpgsql
    `)
    console.log('✅ 触发器函数创建成功\n')

    // 3. 创建触发器
    console.log('📝 创建触发器...')
    await query(`
      DROP TRIGGER IF EXISTS documents_tsv_update ON documents
    `)
    await query(`
      CREATE TRIGGER documents_tsv_update
      BEFORE INSERT OR UPDATE OF title, content
      ON documents
      FOR EACH ROW
      EXECUTE FUNCTION documents_tsv_trigger()
    `)
    console.log('✅ 触发器创建成功\n')

    // 4. 为现有数据生成 tsvector
    console.log('📝 为现有数据生成 tsvector...')
    const result = await query(`
      UPDATE documents
      SET tsv =
        setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
        setweight(to_tsvector('english', coalesce(content, '')), 'B')
      WHERE tsv IS NULL
    `)
    console.log(`✅ 已更新 ${result.rowCount} 条记录\n`)

    // 5. 创建 GIN 索引
    console.log('📝 创建 GIN 索引...')
    await query(`
      CREATE INDEX IF NOT EXISTS idx_documents_tsv
      ON documents
      USING gin(tsv)
    `)
    console.log('✅ GIN 索引创建成功\n')

    // 6. 验证索引
    const indexCheck = await query(`
      SELECT indexname, indexdef
      FROM pg_indexes
      WHERE tablename = 'documents' AND indexname = 'idx_documents_tsv'
    `)

    if (indexCheck.rows.length > 0) {
      console.log('✅ 索引验证成功:')
      console.log(`   索引名: ${indexCheck.rows[0].indexname}`)
      console.log(`   定义: ${indexCheck.rows[0].indexdef}\n`)
    }

    // 7. 测试全文检索
    console.log('📝 测试全文检索...')
    const testResult = await query(`
      SELECT id, title,
        ts_rank(tsv, plainto_tsquery('english', 'document')) as rank
      FROM documents
      WHERE tsv @@ plainto_tsquery('english', 'document')
      ORDER BY rank DESC
      LIMIT 3
    `)

    console.log(`✅ 测试成功,找到 ${testResult.rows.length} 条匹配记录`)
    if (testResult.rows.length > 0) {
      console.log('   示例结果:')
      testResult.rows.forEach((row, index) => {
        console.log(`   ${index + 1}. ${row.title} (rank: ${row.rank})`)
      })
    }
    console.log()

    console.log('🎉 全文检索支持添加完成!\n')
    console.log('功能清单:')
    console.log('  ✅ tsvector 列')
    console.log('  ✅ 自动更新触发器')
    console.log('  ✅ GIN 索引')
    console.log('  ✅ 现有数据已索引')
    console.log()
    console.log('使用示例:')
    console.log("  SELECT * FROM documents WHERE tsv @@ plainto_tsquery('english', 'your query')")
    console.log("  ORDER BY ts_rank(tsv, plainto_tsquery('english', 'your query')) DESC")
  } catch (error) {
    console.error('❌ 添加全文检索失败:', error)
    throw error
  }
}

// 运行迁移
addFullTextSearch()
  .then(() => {
    console.log('✨ 迁移完成')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 迁移失败:', error)
    process.exit(1)
  })
