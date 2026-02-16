import { Client } from 'minio'
import type { StorageAdapter, UploadResult } from '../storage-adapter'

/**
 * MinIO 存储适配器
 * 用于本地开发和私有化部署
 */
export class MinioAdapter implements StorageAdapter {
  private client: Client
  private bucket: string
  private host: string
  private port: number
  private useSSL: boolean

  constructor() {
    const endpoint = process.env.MINIO_ENDPOINT || 'localhost:9000'
    const [host, portStr] = endpoint.split(':')
    this.host = host
    this.port = parseInt(portStr || '9000')
    this.useSSL = process.env.MINIO_USE_SSL === 'true'

    this.bucket = process.env.MINIO_BUCKET_DOCUMENTS || 'archmind-documents'

    this.client = new Client({
      endPoint: this.host,
      port: this.port,
      useSSL: this.useSSL,
      accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
      secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin123'
    })
  }

  /**
   * 上传文件到 MinIO
   */
  async uploadFile(
    objectKey: string,
    fileBuffer: Buffer,
    metadata?: Record<string, string>
  ): Promise<UploadResult> {
    try {
      const uploadInfo = await this.client.putObject(
        this.bucket,
        objectKey,
        fileBuffer,
        fileBuffer.length,
        metadata
      )

      return {
        objectKey,
        etag: uploadInfo.etag,
        size: fileBuffer.length,
        provider: 'minio',
        versionId: uploadInfo.versionId ?? undefined
      }
    } catch (error) {
      console.error('MinIO 上传失败:', error)
      throw new Error(`Failed to upload to MinIO: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * 生成预签名下载 URL
   */
  async generatePresignedUrl(
    objectKey: string,
    expirySeconds: number = 3600
  ): Promise<string> {
    try {
      return await this.client.presignedGetObject(
        this.bucket,
        objectKey,
        expirySeconds
      )
    } catch (error) {
      console.error('生成预签名 URL 失败:', error)
      throw new Error(`Failed to generate presigned URL: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * 生成公开访问 URL（适用于公开读的对象）
   * MinIO 公开访问 URL 格式: http(s)://{host}:{port}/{bucket}/{objectKey}
   */
  getPublicUrl(objectKey: string): string {
    const protocol = this.useSSL ? 'https' : 'http'
    return `${protocol}://${this.host}:${this.port}/${this.bucket}/${objectKey}`
  }

  /**
   * 获取文件内容
   */
  async getFile(objectKey: string): Promise<{ buffer: Buffer; contentType: string }> {
    try {
      const stream = await this.client.getObject(this.bucket, objectKey)
      const chunks: Buffer[] = []

      for await (const chunk of stream) {
        chunks.push(Buffer.from(chunk))
      }

      // 获取文件元数据以确定 Content-Type
      const stat = await this.client.statObject(this.bucket, objectKey)
      const contentType = stat.metaData?.['content-type'] || 'application/octet-stream'

      return {
        buffer: Buffer.concat(chunks),
        contentType
      }
    } catch (error) {
      console.error('MinIO 获取文件失败:', error)
      throw new Error(`Failed to get file from MinIO: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * 删除文件
   */
  async deleteFile(objectKey: string): Promise<void> {
    try {
      await this.client.removeObject(this.bucket, objectKey)
    } catch (error) {
      console.error('删除文件失败:', error)
      throw new Error(`Failed to delete from MinIO: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * 检查文件是否存在
   */
  async fileExists(objectKey: string): Promise<boolean> {
    try {
      await this.client.statObject(this.bucket, objectKey)
      return true
    } catch (error: any) {
      if (error.code === 'NotFound') {
        return false
      }
      throw error
    }
  }

  /**
   * 复制文件
   */
  async copyFile(sourceKey: string, targetKey: string): Promise<void> {
    try {
      await this.client.copyObject(
        this.bucket,
        targetKey,
        `/${this.bucket}/${sourceKey}`
      )
    } catch (error) {
      console.error('复制文件失败:', error)
      throw new Error(`Failed to copy file in MinIO: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * 批量删除文件
   */
  async deleteFiles(objectKeys: string[]): Promise<void> {
    try {
      await this.client.removeObjects(this.bucket, objectKeys)
    } catch (error) {
      console.error('批量删除失败:', error)
      throw new Error(`Failed to delete files from MinIO: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * 获取存储提供商名称
   */
  getProviderName(): string {
    return 'minio'
  }

  /**
   * 健康检查
   */
  async healthCheck(): Promise<boolean> {
    try {
      const bucketExists = await this.client.bucketExists(this.bucket)
      return bucketExists
    } catch (error) {
      console.error('MinIO 健康检查失败:', error)
      return false
    }
  }
}
