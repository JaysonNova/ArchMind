/**
 * 统一存储适配器接口
 * 支持多种对象存储后端: MinIO, 华为云 OBS, 阿里云 OSS, 腾讯云 COS 等
 */

export interface UploadResult {
  objectKey: string
  etag: string
  size: number
  provider?: string
  versionId?: string
}

export interface StorageAdapter {
  /**
   * 上传文件
   * @param objectKey 对象键(路径)
   * @param fileBuffer 文件内容
   * @param metadata 元数据(可选)
   */
  uploadFile(
    objectKey: string,
    fileBuffer: Buffer,
    metadata?: Record<string, string>
  ): Promise<UploadResult>

  /**
   * 生成预签名下载 URL
   * @param objectKey 对象键
   * @param expirySeconds 过期时间(秒), 默认 3600 (1小时)
   */
  generatePresignedUrl(
    objectKey: string,
    expirySeconds?: number
  ): Promise<string>

  /**
   * 生成公开访问 URL（适用于公开读的对象）
   * @param objectKey 对象键
   */
  getPublicUrl?(objectKey: string): string

  /**
   * 删除文件
   * @param objectKey 对象键
   */
  deleteFile(objectKey: string): Promise<void>

  /**
   * 检查文件是否存在
   * @param objectKey 对象键
   */
  fileExists(objectKey: string): Promise<boolean>

  /**
   * 复制文件(用于版本控制)
   * @param sourceKey 源对象键
   * @param targetKey 目标对象键
   */
  copyFile(sourceKey: string, targetKey: string): Promise<void>

  /**
   * 获取文件内容
   * @param objectKey 对象键
   * @returns 文件内容和 Content-Type
   */
  getFile(objectKey: string): Promise<{ buffer: Buffer; contentType: string }>

  /**
   * 批量删除文件
   * @param objectKeys 对象键数组
   */
  deleteFiles(objectKeys: string[]): Promise<void>

  /**
   * 获取存储提供商名称
   */
  getProviderName(): string

  /**
   * 健康检查 - 验证存储服务连接是否正常
   */
  healthCheck?(): Promise<boolean>
}

/**
 * 存储配置接口
 */
export interface StorageConfig {
  provider: 'minio' | 'huawei-obs' | 'aliyun-oss' | 'tencent-cos'
  bucket: string
  region?: string
  endpoint?: string
  accessKey: string
  secretKey: string
  useSSL?: boolean
}

/**
 * 对象元数据
 */
export interface ObjectMetadata {
  key: string
  size: number
  lastModified: Date
  etag: string
  contentType?: string
  metadata?: Record<string, string>
}
