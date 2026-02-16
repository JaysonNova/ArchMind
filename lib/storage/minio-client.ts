/**
 * MinIO 对象存储客户端
 * 提供文件上传、下载、删除等操作
 */

import { Client } from 'minio'
import { createHash } from 'crypto'
import { readFile } from 'fs/promises'

interface MinioConfig {
  endPoint: string
  port: number
  useSSL: boolean
  accessKey: string
  secretKey: string
}

class MinioStorageClient {
  private client: Client
  private documentsBucket: string
  private tempBucket: string

  constructor() {
    const endpoint = process.env.MINIO_ENDPOINT || 'localhost:9000'
    const config: MinioConfig = {
      endPoint: endpoint.split(':')[0],
      port: parseInt(endpoint.split(':')[1] || '9000'),
      useSSL: process.env.MINIO_USE_SSL === 'true',
      accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
      secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin'
    }

    this.client = new Client(config)
    this.documentsBucket = process.env.MINIO_BUCKET_DOCUMENTS || 'archmind-documents'
    this.tempBucket = process.env.MINIO_BUCKET_TEMP || 'archmind-temp'
  }

  /**
   * 上传文件
   */
  async uploadFile(
    filePath: string,
    objectKey: string,
    metadata?: Record<string, string>
  ): Promise<{ objectKey: string; etag: string; size: number }> {
    const fileBuffer = await readFile(filePath)
    const size = fileBuffer.length

    const uploadInfo = await this.client.putObject(
      this.documentsBucket,
      objectKey,
      fileBuffer,
      size,
      metadata
    )

    return {
      objectKey,
      etag: uploadInfo.etag,
      size
    }
  }

  /**
   * 生成预签名下载 URL（有效期 1 小时）
   */
  async generatePresignedUrl(
    objectKey: string,
    expirySeconds: number = 3600
  ): Promise<string> {
    return await this.client.presignedGetObject(
      this.documentsBucket,
      objectKey,
      expirySeconds
    )
  }

  /**
   * 删除文件
   */
  async deleteFile(objectKey: string): Promise<void> {
    await this.client.removeObject(this.documentsBucket, objectKey)
  }

  /**
   * 检查文件是否存在
   */
  async fileExists(objectKey: string): Promise<boolean> {
    try {
      await this.client.statObject(this.documentsBucket, objectKey)
      return true
    } catch (error: any) {
      if (error.code === 'NotFound') {
        return false
      }
      throw error
    }
  }

  /**
   * 复制文件（用于版本控制）
   */
  async copyFile(sourceKey: string, targetKey: string): Promise<void> {
    await this.client.copyObject(
      this.documentsBucket,
      targetKey,
      `/${this.documentsBucket}/${sourceKey}`
    )
  }

  /**
   * 批量删除
   */
  async deleteFiles(objectKeys: string[]): Promise<void> {
    await this.client.removeObjects(this.documentsBucket, objectKeys)
  }
}

// 单例模式
let minioClient: MinioStorageClient | null = null

export function getMinioClient(): MinioStorageClient {
  if (!minioClient) {
    minioClient = new MinioStorageClient()
  }
  return minioClient
}

// 工具函数：生成对象 key
export function generateObjectKey(fileName: string): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const uuid = crypto.randomUUID()

  return `${year}/${month}/${uuid}_${fileName}`
}

// 计算文件哈希
export async function calculateFileHash(filePath: string): Promise<string> {
  const fileBuffer = await readFile(filePath)
  return createHash('sha256').update(fileBuffer).digest('hex')
}
