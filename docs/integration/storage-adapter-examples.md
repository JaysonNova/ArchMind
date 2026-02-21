# 存储适配器使用示例

## 快速开始

### 1. 选择存储后端

通过环境变量 `STORAGE_PROVIDER` 选择存储后端:

```bash
# 本地开发 - 使用 MinIO
STORAGE_PROVIDER=minio

# 生产环境 - 使用华为云 OBS
STORAGE_PROVIDER=huawei-obs
```

### 2. 初始化客户端

```typescript
import { getStorageClient } from '~/lib/storage/storage-factory'

const storage = getStorageClient()
// 自动根据 STORAGE_PROVIDER 返回 MinioAdapter 或 HuaweiOBSAdapter
```

## API 使用示例

### 上传文件

```typescript
import { getStorageClient, generateObjectKey } from '~/lib/storage/storage-factory'
import { readFile } from 'fs/promises'

// 读取文件
const fileBuffer = await readFile('/path/to/document.pdf')

// 生成对象键(格式: 2024/02/uuid_filename.pdf)
const objectKey = generateObjectKey('document.pdf')

// 上传文件
const storage = getStorageClient()
const result = await storage.uploadFile(objectKey, fileBuffer, {
  'Content-Type': 'application/pdf',
  'x-user-id': '123',
  'x-upload-timestamp': new Date().toISOString()
})

console.log(result)
// {
//   objectKey: '2024/02/abc123_document.pdf',
//   etag: '"d41d8cd98f00b204e9800998ecf8427e"',
//   size: 102400,
//   provider: 'huawei-obs'
// }
```

### 生成下载链接

```typescript
import { getStorageClient } from '~/lib/storage/storage-factory'

const storage = getStorageClient()

// 生成 1 小时有效的预签名 URL
const downloadUrl = await storage.generatePresignedUrl(
  '2024/02/abc123_document.pdf',
  3600  // 3600 秒 = 1 小时
)

console.log(downloadUrl)
// https://archmind-documents.obs.cn-north-4.myhuaweicloud.com/2024/02/abc123_document.pdf?...
```

### 检查文件是否存在

```typescript
const exists = await storage.fileExists('2024/02/abc123_document.pdf')

if (exists) {
  console.log('文件存在')
} else {
  console.log('文件不存在')
}
```

### 删除文件

```typescript
await storage.deleteFile('2024/02/abc123_document.pdf')
console.log('文件已删除')
```

### 复制文件(版本控制)

```typescript
// 创建文档版本
await storage.copyFile(
  '2024/02/abc123_document.pdf',           // 源文件
  'versions/2024/02/abc123_document_v2.pdf' // 目标路径
)
```

### 批量删除

```typescript
const objectKeys = [
  '2024/02/file1.pdf',
  '2024/02/file2.pdf',
  '2024/02/file3.pdf'
]

await storage.deleteFiles(objectKeys)
console.log('批量删除完成')
```

### 健康检查

```typescript
const storage = getStorageClient()

if (storage.healthCheck) {
  const isHealthy = await storage.healthCheck()

  if (isHealthy) {
    console.log('✅ 存储服务正常')
  } else {
    console.error('❌ 存储服务异常')
  }
}
```

## Nuxt API 端点示例

### 文档上传 API

```typescript
// server/api/documents/upload.post.ts
import { getStorageClient, generateObjectKey, calculateFileHash } from '~/lib/storage/storage-factory'

export default defineEventHandler(async (event) => {
  try {
    // 1. 接收文件
    const formData = await readMultipartFormData(event)
    if (!formData || formData.length === 0) {
      throw createError({ statusCode: 400, message: 'No file uploaded' })
    }

    const file = formData[0]
    const fileName = file.filename || 'unnamed'

    // 2. 计算文件哈希(用于去重)
    const fileHash = await calculateFileHash(file.data)

    // TODO: 检查数据库是否已存在相同哈希的文件

    // 3. 生成对象键
    const objectKey = generateObjectKey(fileName)

    // 4. 上传到存储服务
    const storage = getStorageClient()
    const uploadResult = await storage.uploadFile(objectKey, file.data, {
      'Content-Type': file.type || 'application/octet-stream',
      'X-Original-Filename': fileName,
      'X-File-Hash': fileHash
    })

    // 5. 保存到数据库
    // TODO: 创建 documents 表记录

    return {
      success: true,
      data: {
        objectKey: uploadResult.objectKey,
        fileName,
        size: uploadResult.size,
        hash: fileHash
      }
    }
  } catch (error) {
    console.error('Upload error:', error)
    throw createError({
      statusCode: 500,
      message: error instanceof Error ? error.message : 'Upload failed'
    })
  }
})
```

### 文档下载 API

```typescript
// server/api/documents/[id]/download.get.ts
import { getStorageClient } from '~/lib/storage/storage-factory'

export default defineEventHandler(async (event) => {
  const documentId = getRouterParam(event, 'id')

  if (!documentId) {
    throw createError({ statusCode: 400, message: 'Document ID required' })
  }

  try {
    // 1. 查询数据库获取对象键
    // TODO: 从 documents 表查询
    const document = { storageKey: '2024/02/abc123_example.pdf' }

    // 2. 生成预签名 URL
    const storage = getStorageClient()
    const downloadUrl = await storage.generatePresignedUrl(
      document.storageKey,
      3600  // 1 小时有效期
    )

    // 3. 重定向到预签名 URL
    return sendRedirect(event, downloadUrl)
  } catch (error) {
    console.error('Download error:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to generate download link'
    })
  }
})
```

### 文档删除 API

```typescript
// server/api/documents/[id]/index.delete.ts
import { getStorageClient } from '~/lib/storage/storage-factory'

export default defineEventHandler(async (event) => {
  const documentId = getRouterParam(event, 'id')

  if (!documentId) {
    throw createError({ statusCode: 400, message: 'Document ID required' })
  }

  try {
    // 1. 查询数据库
    // TODO: 从 documents 表查询
    const document = { storageKey: '2024/02/abc123_example.pdf' }

    // 2. 从存储服务删除文件
    const storage = getStorageClient()
    await storage.deleteFile(document.storageKey)

    // 3. 从数据库删除记录
    // TODO: 删除 documents 表记录

    return {
      success: true,
      message: 'Document deleted successfully'
    }
  } catch (error) {
    console.error('Delete error:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to delete document'
    })
  }
})
```

## Vue 组件示例

### 文件上传组件

```vue
<template>
  <div class="space-y-4">
    <input
      type="file"
      ref="fileInput"
      @change="handleFileSelect"
      class="hidden"
    />

    <Button @click="$refs.fileInput.click()">
      <Upload class="w-4 h-4 mr-2" />
      选择文件
    </Button>

    <div v-if="uploading" class="flex items-center gap-2">
      <Loader2 class="w-4 h-4 animate-spin" />
      <span>上传中...</span>
    </div>

    <div v-if="uploadedFile">
      <p class="text-sm text-green-600">
        ✅ 上传成功: {{ uploadedFile.fileName }}
      </p>
      <Button variant="outline" size="sm" @click="handleDownload">
        下载
      </Button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Button } from '~/components/ui/button'
import { Upload, Loader2 } from 'lucide-vue-next'

const fileInput = ref<HTMLInputElement>()
const uploading = ref(false)
const uploadedFile = ref<{ documentId: string; fileName: string } | null>(null)

async function handleFileSelect(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]

  if (!file) return

  uploading.value = true

  try {
    const formData = new FormData()
    formData.append('file', file)

    const response = await $fetch<{ success: boolean; data: any }>('/api/documents/upload', {
      method: 'POST',
      body: formData
    })

    if (response.success) {
      uploadedFile.value = {
        documentId: response.data.objectKey,
        fileName: file.name
      }
    }
  } catch (error) {
    console.error('Upload failed:', error)
    alert('上传失败,请重试')
  } finally {
    uploading.value = false
  }
}

async function handleDownload() {
  if (!uploadedFile.value) return

  // 跳转到下载 API,会自动重定向到预签名 URL
  window.location.href = `/api/documents/${uploadedFile.value.documentId}/download`
}
</script>
```

## 测试脚本

### 健康检查

```bash
# 检查当前配置的存储服务
pnpm storage:health
```

### 华为云 OBS 连接测试

```bash
# 完整的连接测试(上传、下载、删除)
pnpm storage:test-obs
```

## 环境切换

### 开发环境(MinIO)

```bash
# .env
STORAGE_PROVIDER=minio
MINIO_ENDPOINT=localhost:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin123
```

启动 MinIO:
```bash
docker-compose -f docker-compose.minio.yml up -d
```

### 生产环境(华为云 OBS)

```bash
# .env.production
STORAGE_PROVIDER=huawei-obs
HUAWEI_OBS_REGION=cn-north-4
HUAWEI_OBS_ACCESS_KEY=your_ak_here
HUAWEI_OBS_SECRET_KEY=your_sk_here
HUAWEI_OBS_BUCKET=archmind-documents
```

## 最佳实践

### 1. 对象键命名规范

```typescript
// ✅ 推荐
const objectKey = generateObjectKey('用户文档.pdf')
// 输出: 2024/02/abc-123_用户文档.pdf

// ❌ 不推荐
const objectKey = 'uploads/用户文档.pdf'  // 缺少时间分区
const objectKey = '文档/2024/用户文档.pdf'  // 无 UUID,可能冲突
```

### 2. 元数据使用

```typescript
// 上传时添加有用的元数据
await storage.uploadFile(objectKey, fileBuffer, {
  'Content-Type': 'application/pdf',
  'X-User-Id': userId,
  'X-Upload-Timestamp': new Date().toISOString(),
  'X-Original-Filename': originalFileName,
  'X-Document-Type': 'technical-spec'
})
```

### 3. 错误处理

```typescript
try {
  await storage.uploadFile(objectKey, fileBuffer)
} catch (error) {
  if (error.message.includes('NoSuchBucket')) {
    console.error('存储桶不存在')
  } else if (error.message.includes('Access Denied')) {
    console.error('权限不足')
  } else {
    console.error('上传失败:', error)
  }

  // 记录到日志系统
  // logger.error('Storage upload failed', { error, objectKey })
}
```

### 4. 预签名 URL 缓存

```typescript
// 缓存预签名 URL 避免频繁生成
const urlCache = new Map<string, { url: string; expiresAt: number }>()

async function getCachedPresignedUrl(objectKey: string): Promise<string> {
  const cached = urlCache.get(objectKey)

  if (cached && cached.expiresAt > Date.now()) {
    return cached.url
  }

  const storage = getStorageClient()
  const url = await storage.generatePresignedUrl(objectKey, 3600)

  urlCache.set(objectKey, {
    url,
    expiresAt: Date.now() + 3500 * 1000  // 提前 100 秒过期
  })

  return url
}
```

## 故障排查

### 问题: 上传失败

**检查清单:**
1. 确认 `STORAGE_PROVIDER` 配置正确
2. 检查存储服务是否运行(`pnpm storage:health`)
3. 验证 AK/SK 或访问凭证
4. 确认网络连接

### 问题: 下载 404

**可能原因:**
1. 对象键不存在(使用 `fileExists` 检查)
2. 权限不足
3. 预签名 URL 已过期

### 问题: 性能慢

**优化建议:**
1. 使用 CDN 加速下载
2. 启用预签名 URL 缓存
3. 使用华为云 VPC Endpoint(内网访问)
4. 批量操作使用并发上传

## 相关文档

- [MinIO 部署指南](./minio-setup.md)
- [华为云 OBS 部署指南](./huawei-obs-deployment.md)
- [数据迁移指南](./storage-migration.md)
