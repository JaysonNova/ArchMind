/**
 * RAG 检索测试脚本(带详细日志)
 */

import { dbClient } from '~/lib/db/client'
import { VectorDAO } from '~/lib/db/dao/vector-dao'
import { GLMEmbeddingAdapter } from '~/lib/rag/adapters/glm-embedding'

async function testRAG() {
  console.log('=== RAG 检索测试 ===\n')
  console.log('DATABASE_URL:', process.env.DATABASE_URL ? '已配置' : '未配置')

  // 1. 测试数据库连接
  const ok = await dbClient.healthCheck()
  if (!ok) {
    console.error('数据库连接失败')
    process.exit(1)
  }

  // 2. 检查数据
  const countResult = await dbClient.query('SELECT COUNT(*) FROM document_embeddings WHERE model_name = $1', ['embedding-3'])
  console.log(`向量数据: ${countResult.rows[0].count} 条`)

  // 3. 检查默认模型配置
  const defaultModel = await VectorDAO.getDefaultModel()
  console.log(`默认模型: ${defaultModel.name} (${defaultModel.dimensions}维)`)

  // 4. 生成查询向量
  const glmApiKey = process.env.GLM_API_KEY
  if (!glmApiKey) {
    console.error('GLM_API_KEY 未配置')
    process.exit(1)
  }

  const embeddingAdapter = new GLMEmbeddingAdapter(glmApiKey)
  const query = '用户群体分层'
  console.log(`\n查询: "${query}"`)

  const queryEmbedding = await embeddingAdapter.embed(query)
  console.log(`查询向量维度: ${queryEmbedding.length}`)

  // 5. 直接调用 VectorDAO.similaritySearch
  console.log('\n--- 调用 VectorDAO.similaritySearch ---')
  try {
    const results = await VectorDAO.similaritySearch(queryEmbedding, 5, 0.3)
    console.log(`结果数量: ${results.length}`)
    results.forEach((r, i) => {
      console.log(`${i + 1}. [${(r.score * 100).toFixed(1)}%] ${r.content.substring(0, 80)}...`)
    })
  } catch (error) {
    console.error('检索失败:', error)
  }

  // 6. 直接用原始 SQL 测试
  console.log('\n--- 直接 SQL 测试 ---')
  try {
    const sql = `
      SELECT
        e.chunk_id,
        1 - ((e.embedding::halfvec(2048)) <-> $1::halfvec(2048)) as similarity,
        LEFT(c.content, 80) as content_preview
      FROM document_embeddings e
      JOIN document_chunks c ON e.chunk_id = c.id
      WHERE e.model_name = 'embedding-3'
      ORDER BY (e.embedding::halfvec(2048)) <-> $1::halfvec(2048)
      LIMIT 5
    `
    const result = await dbClient.query(sql, [JSON.stringify(queryEmbedding)])
    console.log(`结果数量: ${result.rows.length}`)
    result.rows.forEach((r: any, i: number) => {
      console.log(`${i + 1}. [${(parseFloat(r.similarity) * 100).toFixed(1)}%] ${r.content_preview}`)
    })
  } catch (error) {
    console.error('SQL 测试失败:', error)
  }

  await dbClient.close()
  process.exit(0)
}

testRAG().catch((error) => {
  console.error('脚本执行失败:', error)
  process.exit(1)
})
