/**
 * 文档类型定义
 */

export interface Document {
  id: string;
  userId?: string;
  workspaceId?: string;
  categoryId?: string | null;
  title: string;
  filePath: string;
  fileType: 'pdf' | 'docx' | 'markdown';
  fileSize: number;
  content?: string;
  metadata?: Record<string, any>;
  status?: string;

  // 存储相关字段
  storageProvider?: 'local' | 'minio' | 'huawei-obs' | 's3';
  storageBucket?: string;
  storageKey?: string;
  contentHash?: string;

  // 处理状态字段
  processingStatus?: 'pending' | 'processing' | 'completed' | 'failed' | 'retrying';
  processingError?: string;
  retryCount?: number;
  chunksCount?: number;
  vectorsCount?: number;
  processingStartedAt?: string;
  processingCompletedAt?: string;

  // 版本控制
  currentVersion?: number;

  createdAt: string;
  updatedAt: string;
}

export interface DocumentChunk {
  id: string;
  documentId: string;
  chunkIndex: number;
  content: string;
  metadata?: Record<string, any>;
  createdAt: string;
}

export interface DocumentUploadResponse {
  success: boolean;
  data: Document;
  message?: string;
}

export interface DocumentListResponse {
  success: boolean;
  data: {
    documents: Document[];
    total: number;
    page: number;
    limit: number;
  };
}
