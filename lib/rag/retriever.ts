/**
 * RAG 检索器
 * 使用向量相似度搜索从数据库中检索相关文档
 * 支持纯向量检索、纯关键词检索和混合检索(RRF)
 */

import type { IEmbeddingAdapter } from './embedding-adapter'
import { VectorDAO } from '~/lib/db/dao/vector-dao'
import { DocumentChunkDAO } from '~/lib/db/dao/document-chunk-dao'
import { DocumentDAO } from '~/lib/db/dao/document-dao'
import { dbClient } from '~/lib/db/client'

export interface RetrievalOptions {
  topK?: number;
  threshold?: number;
}

export interface RetrievedChunk {
  id: string;
  documentId: string;
  documentTitle: string;
  content: string;
  similarity: number;
}

export class RAGRetriever {
  private embeddingAdapter: IEmbeddingAdapter
  private topK: number
  private threshold: number

  constructor (embeddingAdapter: IEmbeddingAdapter, topK: number = 5, threshold: number = 0.7) {
    this.embeddingAdapter = embeddingAdapter
    this.topK = topK
    this.threshold = threshold
  }

  /**
   * 根据查询文本检索相关文档块
   */
  async retrieve (query: string, options?: RetrievalOptions): Promise<RetrievedChunk[]> {
    const topK = options?.topK ?? this.topK
    const threshold = options?.threshold ?? this.threshold

    try {
      // 获取查询的向量表示
      const queryEmbedding = await this.embeddingAdapter.embed(query)

      // 执行向量相似度搜索
      const results = await VectorDAO.similaritySearch(queryEmbedding, topK, threshold)

      if (results.length === 0) {
        return []
      }

      // 获取详细的块信息
      const chunkIds = results.map(r => r.chunkId)
      const chunks = await DocumentChunkDAO.findByIds(chunkIds)

      // 创建块 ID 到相似度的映射
      const similarityMap = new Map(results.map(r => [r.chunkId, r.score]))

      // 获取文档信息并组合结果
      const retrievedChunks: RetrievedChunk[] = []

      for (const chunk of chunks) {
        const doc = await DocumentDAO.findById(chunk.documentId)
        if (doc) {
          retrievedChunks.push({
            id: chunk.id,
            documentId: chunk.documentId,
            documentTitle: doc.title,
            content: chunk.content,
            similarity: similarityMap.get(chunk.id) || 0
          })
        }
      }

      // 按相似度排序
      retrievedChunks.sort((a, b) => b.similarity - a.similarity)

      return retrievedChunks
    } catch (error) {
      console.error('Retrieval error:', error)
      throw error
    }
  }

  /**
   * 获取检索结果的摘要文本
   */
  summarizeResults (results: RetrievedChunk[]): string {
    return results
      .map((r, i) => `[文档 ${i + 1}: ${r.documentTitle}]\n${r.content}\n`)
      .join('\n---\n')
  }

  /**
   * 关键词搜索(PostgreSQL 全文检索)
   */
  async keywordSearch (query: string, topK: number = 10): Promise<RetrievedChunk[]> {
    try {
      const result = await dbClient.query(`
        SELECT
          dc.id,
          dc.document_id,
          d.title as document_title,
          dc.content,
          ts_rank(d.tsv, plainto_tsquery('english', $1)) as score
        FROM document_chunks dc
        JOIN documents d ON dc.document_id = d.id
        WHERE d.tsv @@ plainto_tsquery('english', $1)
        ORDER BY score DESC
        LIMIT $2
      `, [query, topK])

      return result.rows.map(row => ({
        id: row.id,
        documentId: row.document_id,
        documentTitle: row.document_title,
        content: row.content,
        similarity: row.score
      }))
    } catch (error) {
      console.error('Keyword search error:', error)
      throw error
    }
  }

  /**
   * 混合搜索: 结合关键词和向量检索(使用 RRF 算法)
   *
   * RRF (Reciprocal Rank Fusion) 倒数排名融合算法
   * 对每个结果的排名取倒数,然后加权求和
   */
  async hybridSearch (
    query: string,
    options?: {
      topK?: number;
      threshold?: number;
      keywordWeight?: number;
      vectorWeight?: number;
    }
  ): Promise<RetrievedChunk[]> {
    const topK = options?.topK ?? this.topK
    const threshold = options?.threshold ?? this.threshold
    const keywordWeight = options?.keywordWeight ?? 0.3
    const vectorWeight = options?.vectorWeight ?? 0.7

    try {
      // 1. 执行关键词搜索
      const keywordResults = await this.keywordSearch(query, topK * 2)

      // 2. 执行向量检索
      const vectorResults = await this.retrieve(query, { topK: topK * 2, threshold })

      // 3. 使用 RRF 融合结果
      const fusedResults = this.reciprocalRankFusion(
        keywordResults,
        vectorResults,
        keywordWeight,
        vectorWeight
      )

      // 4. 返回 top-K 结果
      return fusedResults.slice(0, topK)
    } catch (error) {
      console.error('Hybrid search error:', error)
      throw error
    }
  }

  /**
   * 倒数排名融合算法(Reciprocal Rank Fusion)
   *
   * 公式: score(d) = Σ [ w_i / (k + rank_i(d)) ]
   * 其中:
   * - w_i 是第 i 个检索器的权重
   * - k 是常数(通常为 60)
   * - rank_i(d) 是文档 d 在第 i 个检索器中的排名
   */
  private reciprocalRankFusion (
    keywordResults: RetrievedChunk[],
    vectorResults: RetrievedChunk[],
    keywordWeight: number,
    vectorWeight: number
  ): RetrievedChunk[] {
    const k = 60 // RRF 常数
    const scores = new Map<string, { chunk: RetrievedChunk; score: number }>()

    // 处理关键词结果
    keywordResults.forEach((chunk, rank) => {
      const rrfScore = keywordWeight / (k + rank + 1)
      scores.set(chunk.id, { chunk, score: rrfScore })
    })

    // 处理向量结果
    vectorResults.forEach((chunk, rank) => {
      const rrfScore = vectorWeight / (k + rank + 1)
      const existing = scores.get(chunk.id)

      if (existing) {
        // 如果已存在,累加分数
        existing.score += rrfScore
        // 更新相似度为融合后的分数
        existing.chunk.similarity = existing.score
      } else {
        scores.set(chunk.id, { chunk, score: rrfScore })
      }
    })

    // 按融合分数排序
    return Array.from(scores.values())
      .sort((a, b) => b.score - a.score)
      .map(item => ({
        ...item.chunk,
        similarity: item.score // 使用融合分数作为相似度
      }))
  }
}
