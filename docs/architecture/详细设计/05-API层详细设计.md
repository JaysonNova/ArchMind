# API 层详细设计文档

## 文档版本信息

* **版本：** v1.0
* **创建日期：** 2026-02-01
* **最后更新：** 2026-02-01
* **文档状态：** Draft
* **基于文档：** 架构设计文档 v1.0

---

## 1. 文档概述

### 1.1 文档目的

本文档详细描述 ArchMind AI API 层的实现规范，包括:
- RESTful API 接口定义
- 请求/响应格式
- 错误处理规范
- 认证和授权
- API 路由实现

### 1.2 目标读者

- 后端开发工程师
- 前端开发工程师
- API 集成工程师

### 1.3 API 设计原则

- **RESTful 风格** - 使用标准 HTTP 方法
- **统一响应格式** - 所有 API 返回一致的数据结构
- **错误处理** - 明确的错误码和错误信息
- **版本控制** - 支持 API 版本演进
- **文档化** - 完整的 API 文档

---

## 2. API 路由结构

### 2.1 路由命名规范

**Nuxt 3 Server Routes 约定:**
- 集合操作: `index.{method}.ts`
- 单项操作: `[id]/index.{method}.ts`
- 特殊操作: `{action}.{method}.ts`

**示例:**
```
server/api/
├── documents/
│   ├── index.get.ts          # GET /api/documents
│   ├── index.post.ts         # POST /api/documents
│   ├── upload.post.ts        # POST /api/documents/upload
│   └── [id]/
│       ├── index.get.ts      # GET /api/documents/:id
│       ├── index.put.ts      # PUT /api/documents/:id
│       └── index.delete.ts   # DELETE /api/documents/:id
```

### 2.2 统一响应格式

**成功响应:**
```typescript
{
  success: true,
  data: {
    // 实际数据
  }
}
```

**错误响应:**
```typescript
{
  success: false,
  error: string,
  code?: string
}
```

---

## 3. 文档管理 API

### 3.1 上传文档

**端点:** `POST /api/documents/upload`

**文件:** `server/api/documents/upload.post.ts`

**请求:**
- Content-Type: `multipart/form-data`
- Body: FormData with `file` field

**响应:**
```typescript
{
  success: boolean;
  data?: {
    id: string;
    title: string;
    fileType: string;
    fileSize: number;
    createdAt: string;
  };
  error?: string;
}
```

**实现:**
```typescript
import { defineEventHandler, readMultipartFormData } from 'h3';
import { DocumentDAO } from '@/lib/db/dao/document-dao';
import { DocumentProcessor } from '@/lib/rag/document-processor';
import fs from 'fs';
import path from 'path';
import { nanoid } from 'nanoid';

export default defineEventHandler(async (event) => {
  try {
    const formData = await readMultipartFormData(event);

    if (!formData || formData.length === 0) {
      return { success: false, error: 'No file uploaded' };
    }

    const fileData = formData.find(item => item.name === 'file');

    if (!fileData || !fileData.filename) {
      return { success: false, error: 'Invalid file data' };
    }

    // 验证文件类型
    const allowedTypes = ['.pdf', '.docx', '.md', '.markdown'];
    const ext = path.extname(fileData.filename).toLowerCase();

    if (!allowedTypes.includes(ext)) {
      return {
        success: false,
        error: `File type ${ext} not supported. Allowed: ${allowedTypes.join(', ')}`,
      };
    }

    // 验证文件大小 (10MB)
    const maxSize = 10 * 1024 * 1024;
    if (fileData.data.length > maxSize) {
      return { success: false, error: 'File size exceeds 10MB limit' };
    }

    // 保存文件
    const uploadDir = './public/uploads';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const filename = `${nanoid()}-${fileData.filename}`;
    const filePath = path.join(uploadDir, filename);
    fs.writeFileSync(filePath, fileData.data);

    // 提取文本内容
    const processor = new DocumentProcessor();
    const content = await processor.extractText(filePath, ext);

    // 保存到数据库
    const document = DocumentDAO.create({
      title: fileData.filename,
      filePath: `/uploads/${filename}`,
      fileType: ext.slice(1),
      fileSize: fileData.data.length,
      content,
      metadata: {
        originalName: fileData.filename,
        uploadedAt: new Date().toISOString(),
      },
    });

    return {
      success: true,
      data: {
        id: document.id,
        title: document.title,
        fileType: document.fileType,
        fileSize: document.fileSize,
        createdAt: document.createdAt.toISOString(),
      },
    };
  } catch (error: any) {
    console.error('Upload error:', error);
    return {
      success: false,
      error: error.message || 'Failed to upload document',
    };
  }
});
```

### 3.2 获取文档列表

**端点:** `GET /api/documents`

**文件:** `server/api/documents/index.get.ts`

**查询参数:**
- `limit`: number (default: 50)
- `offset`: number (default: 0)
- `orderBy`: 'created_at' | 'updated_at' | 'title'
- `order`: 'ASC' | 'DESC'

**实现:**
```typescript
import { defineEventHandler, getQuery } from 'h3';
import { DocumentDAO } from '@/lib/db/dao/document-dao';

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event);

    const options = {
      limit: Number(query.limit) || 50,
      offset: Number(query.offset) || 0,
      orderBy: (query.orderBy as any) || 'created_at',
      order: (query.order as any) || 'DESC',
    };

    const documents = DocumentDAO.findAll(options);
    const total = DocumentDAO.count();

    return {
      success: true,
      data: {
        documents: documents.map(doc => ({
          id: doc.id,
          title: doc.title,
          fileType: doc.fileType,
          fileSize: doc.fileSize,
          createdAt: doc.createdAt.toISOString(),
          updatedAt: doc.updatedAt.toISOString(),
        })),
        total,
        limit: options.limit,
        offset: options.offset,
      },
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to fetch documents',
    };
  }
});
```

---

## 4. RAG 检索 API

### 4.1 文档向量化

**端点:** `POST /api/rag/embed`

**文件:** `server/api/rag/embed.post.ts`

**请求体:**
```typescript
{
  documentId: string;
}
```

**实现:**
```typescript
import { defineEventHandler, readBody } from 'h3';
import { DocumentIndexer } from '@/lib/rag/document-indexer';

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    const { documentId } = body;

    if (!documentId) {
      return { success: false, error: 'Document ID is required' };
    }

    const indexer = new DocumentIndexer();
    await indexer.indexDocument(documentId);

    return {
      success: true,
      data: { documentId, status: 'indexed' },
    };
  } catch (error: any) {
    console.error('Embedding error:', error);
    return {
      success: false,
      error: error.message || 'Failed to embed document',
    };
  }
});
```

---

## 5. AI 生成 API

### 5.1 生成 PRD

**端点:** `POST /api/ai/generate`

**文件:** `server/api/ai/generate.post.ts`

**请求体:**
```typescript
{
  userInput: string;
  modelId?: string;
  options?: {
    temperature?: number;
    maxTokens?: number;
  };
}
```

**实现:**
```typescript
import { defineEventHandler, readBody } from 'h3';
import { PRDGenerator } from '@/lib/prd/prd-generator';
import { ModelManager } from '@/lib/ai/model-manager';
import { RAGRetriever } from '@/lib/rag/retriever';

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    const { userInput, modelId, options } = body;

    if (!userInput) {
      return { success: false, error: 'User input is required' };
    }

    const modelManager = new ModelManager();
    const ragRetriever = new RAGRetriever();
    const generator = new PRDGenerator(modelManager, ragRetriever);

    const startTime = Date.now();
    const prdDocument = await generator.generate(userInput, {
      modelId,
      ...options,
    });
    const generationTime = Date.now() - startTime;

    return {
      success: true,
      data: {
        id: prdDocument.id,
        title: prdDocument.title,
        content: prdDocument.content,
        modelUsed: prdDocument.modelUsed,
        generationTime,
      },
    };
  } catch (error: any) {
    console.error('Generation error:', error);
    return {
      success: false,
      error: error.message || 'Failed to generate PRD',
    };
  }
});
```

---

## 6. 总结

本文档详细描述了 ArchMind AI API 层的完整实现规范，包括:

✅ **API 路由结构** - Nuxt 3 Server Routes 约定
✅ **统一响应格式** - 成功和错误响应
✅ **文档管理 API** - 上传、列表、详情、删除
✅ **RAG 检索 API** - 向量化、语义检索
✅ **AI 生成 API** - PRD 生成、流式输出

**关键设计决策:**
- RESTful 风格的 API 设计
- 统一的响应格式
- 完善的错误处理
- 文件上传验证
- 请求参数验证

**下一步:**
- 实现前端架构详细设计

