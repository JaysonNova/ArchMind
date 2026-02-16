/**
 * 文档处理管道
 * 将文档加载、分块、向量化、存储整合在一个统一的管道中
 */

import { TextSplitter } from './text-splitter'
import type { IEmbeddingAdapter } from './embedding-adapter'
import { DocumentChunkDAO } from '~/lib/db/dao/document-chunk-dao'
import { VectorDAO } from '~/lib/db/dao/vector-dao'
import { ProcessingLogDAO } from '~/lib/db/dao/processing-log-dao'
import type { DocumentChunk } from '~/types/document'

export interface PipelineOptions {
  chunkSize?: number;
  chunkOverlap?: number;
  embeddingAdapter: IEmbeddingAdapter;
}

export interface ProcessResult {
  documentId: string;
  chunksCreated: number;
  vectorsAdded: number;
  processingTime: number;
}

export class DocumentProcessingPipeline {
  private splitter: TextSplitter
  private embeddingAdapter: IEmbeddingAdapter

  constructor (options: PipelineOptions) {
    const chunkSize = options.chunkSize || parseInt(process.env.CHUNK_SIZE || '1000', 10)
    const chunkOverlap = options.chunkOverlap || parseInt(process.env.CHUNK_OVERLAP || '200', 10)

    this.splitter = new TextSplitter({
      chunkSize,
      chunkOverlap
    })

    this.embeddingAdapter = options.embeddingAdapter
  }

  /**
   * 记录处理日志
   */
  private async logStage(
    documentId: string,
    stage: 'upload' | 'extract' | 'chunk' | 'embed' | 'store' | 'complete' | 'error',
    status: 'start' | 'progress' | 'complete' | 'error',
    message: string,
    metadata?: Record<string, any>,
    durationMs?: number
  ): Promise<void> {
    try {
      await ProcessingLogDAO.create({
        documentId,
        stage,
        status,
        message,
        metadata,
        durationMs
      })
    } catch (error) {
      console.error('Failed to log processing stage:', error)
      // 不抛出错误，避免影响主流程
    }
  }

  /**
   * 处理文档：分块、向量化、存储
   */
  async process (documentId: string, content: string): Promise<ProcessResult> {
    const startTime = Date.now()

    try {
      // 记录开始
      await this.logStage(documentId, 'chunk', 'start', 'Starting document processing')

      // 1. 分块
      const chunkStartTime = Date.now()
      const chunks = this.splitter.split(content)
      const chunkDuration = Date.now() - chunkStartTime

      await this.logStage(
        documentId,
        'chunk',
        'complete',
        `Split document into ${chunks.length} chunks`,
        { chunksCount: chunks.length, contentLength: content.length },
        chunkDuration
      )

      console.log(`Split document into ${chunks.length} chunks`)

      if (chunks.length === 0) {
        await this.logStage(
          documentId,
          'error',
          'error',
          'No chunks generated from content'
        )

        return {
          documentId,
          chunksCreated: 0,
          vectorsAdded: 0,
          processingTime: Date.now() - startTime
        }
      }

      // 2. 创建文档块记录
      await this.logStage(documentId, 'store', 'start', 'Storing document chunks')

      const storeStartTime = Date.now()
      const documentChunks: Omit<DocumentChunk, 'id' | 'createdAt'>[] = chunks.map((chunk, index) => ({
        documentId,
        chunkIndex: index,
        content: chunk,
        metadata: {
          source: 'document_chunk',
          length: chunk.length
        }
      }))

      const createdChunks = await DocumentChunkDAO.createMany(documentChunks)
      const storeDuration = Date.now() - storeStartTime

      await this.logStage(
        documentId,
        'store',
        'complete',
        `Stored ${createdChunks.length} chunk records`,
        { chunksStored: createdChunks.length },
        storeDuration
      )

      console.log(`Created ${createdChunks.length} chunk records`)

      // 3. 向量化
      await this.logStage(
        documentId,
        'embed',
        'start',
        `Generating embeddings for ${chunks.length} chunks`,
        { provider: this.embeddingAdapter.getModelInfo().provider }
      )

      const embedStartTime = Date.now()
      const embeddings = await this.embeddingAdapter.embedMany(chunks)
      const embedDuration = Date.now() - embedStartTime

      await this.logStage(
        documentId,
        'embed',
        'complete',
        `Generated ${embeddings.length} embeddings`,
        {
          embeddingsCount: embeddings.length,
          modelInfo: this.embeddingAdapter.getModelInfo()
        },
        embedDuration
      )

      console.log(`Generated ${embeddings.length} embeddings`)

      // 4. 存储向量
      await this.logStage(documentId, 'store', 'start', 'Storing vectors')

      const vectorStartTime = Date.now()
      const modelInfo = this.embeddingAdapter.getModelInfo()

      const embeddingChunks = createdChunks.map((chunk, index) => ({
        chunkId: chunk.id,
        embedding: embeddings[index],
        modelName: modelInfo.modelId,
        modelProvider: modelInfo.provider,
        dimensions: modelInfo.dimensions
      }))

      const vectorIds = await VectorDAO.addVectors(embeddingChunks)
      const vectorDuration = Date.now() - vectorStartTime

      await this.logStage(
        documentId,
        'store',
        'complete',
        `Stored ${vectorIds.length} vectors`,
        { vectorsStored: vectorIds.length },
        vectorDuration
      )

      console.log(`Stored ${vectorIds.length} vectors`)

      // 记录完成
      const totalDuration = Date.now() - startTime
      await this.logStage(
        documentId,
        'complete',
        'complete',
        `Processing completed successfully`,
        {
          chunksCreated: createdChunks.length,
          vectorsAdded: vectorIds.length,
          totalDuration
        },
        totalDuration
      )

      return {
        documentId,
        chunksCreated: createdChunks.length,
        vectorsAdded: vectorIds.length,
        processingTime: totalDuration
      }
    } catch (error) {
      console.error('Pipeline error:', error)

      // 记录错误
      await this.logStage(
        documentId,
        'error',
        'error',
        error instanceof Error ? error.message : 'Unknown error occurred',
        { error: error instanceof Error ? error.stack : String(error) }
      )

      throw error
    }
  }
}

