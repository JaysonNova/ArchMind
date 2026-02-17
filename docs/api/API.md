# ArchMind API 文档

> 完整的 API 端点参考文档

---

## 目录

- [认证](#认证)
- [文档管理](#文档管理)
- [搜索](#搜索)
- [版本控制](#版本控制)
- [PRD 生成](#prd-生成)
- [对话系统](#对话系统)
- [工作区](#工作区)
- [用户配置](#用户配置)
- [标签与分类](#标签与分类)
- [原型管理](#原型管理)
- [错误处理](#错误处理)

---

## 认证

所有 API 请求需要在 Header 中携带 JWT Token：

```
Authorization: Bearer <token>
```

### 登录

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

**响应:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "用户名"
    }
  }
}
```

### 注册

```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "name": "用户名"
}
```

### 获取当前用户

```http
GET /api/auth/me
Authorization: Bearer <token>
```

### 更新用户信息

```http
PATCH /api/auth/profile
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "新用户名",
  "avatar": "https://..."
}
```

---

## 文档管理

### 获取文档列表

```http
GET /api/documents?workspaceId={uuid}&status={status}&page={n}&limit={n}
```

**查询参数:**

| 参数 | 类型 | 必填 | 描述 |
|------|------|------|------|
| workspaceId | string (uuid) | 是 | 工作区 ID |
| status | string | 否 | 筛选状态: pending, processing, completed, error |
| page | number | 否 | 页码，默认 1 |
| limit | number | 否 | 每页数量，默认 20，最大 100 |

**响应:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "uuid",
        "title": "文档标题",
        "fileName": "document.pdf",
        "fileSize": 1024000,
        "mimeType": "application/pdf",
        "status": "completed",
        "tags": ["标签1", "标签2"],
        "category": "分类",
        "createdAt": "2024-01-01T00:00:00Z",
        "updatedAt": "2024-01-01T00:00:00Z"
      }
    ],
    "total": 100,
    "page": 1,
    "limit": 20,
    "totalPages": 5
  }
}
```

### 获取文档详情

```http
GET /api/documents/:id
```

**响应:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "文档标题",
    "fileName": "document.pdf",
    "fileSize": 1024000,
    "mimeType": "application/pdf",
    "status": "completed",
    "tags": ["标签1", "标签2"],
    "category": "分类",
    "description": "文档描述",
    "fileHash": "sha256...",
    "chunkCount": 15,
    "processingLog": {
      "stages": [
        { "stage": "upload", "status": "completed", "timestamp": "..." },
        { "stage": "extract", "status": "completed", "timestamp": "..." },
        { "stage": "chunk", "status": "completed", "timestamp": "..." },
        { "stage": "embed", "status": "completed", "timestamp": "..." },
        { "stage": "store", "status": "completed", "timestamp": "..." }
      ]
    },
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  }
}
```

### 上传文档

```http
POST /api/documents/upload
Content-Type: multipart/form-data

file: <binary>
workspaceId: <uuid>
title: 文档标题 (可选)
tags: 标签1,标签2 (可选)
category: 分类 (可选)
```

**响应:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "文档标题",
    "status": "processing"
  }
}
```

### 批量上传文档

```http
POST /api/documents/batch-upload
Content-Type: multipart/form-data

files[]: <binary[]>
files[]: <binary[]>
workspaceId: <uuid>
```

**响应:**
```json
{
  "success": true,
  "data": {
    "uploaded": [
      { "id": "uuid1", "fileName": "doc1.pdf", "status": "processing" },
      { "id": "uuid2", "fileName": "doc2.docx", "status": "processing" }
    ],
    "total": 2,
    "skipped": [
      { "fileName": "duplicate.pdf", "reason": "duplicate", "existingId": "uuid" }
    ]
  }
}
```

### 更新文档

```http
PATCH /api/documents/:id
Content-Type: application/json

{
  "title": "新标题",
  "tags": ["新标签1", "新标签2"],
  "category": "新分类",
  "description": "新描述"
}
```

### 删除文档

```http
DELETE /api/documents/:id
```

**响应:**
```json
{
  "success": true,
  "message": "文档已删除"
}
```

### 下载文档

```http
GET /api/documents/:id/download
```

**响应:** 重定向到预签名 URL 或直接返回文件流

### 导出文档

```http
POST /api/documents/export
Content-Type: application/json

{
  "documentIds": ["uuid1", "uuid2", "uuid3"]
}
```

**响应:**
```json
{
  "success": true,
  "data": {
    "downloadUrl": "https://...",
    "expiresAt": "2024-01-01T01:00:00Z",
    "fileCount": 3,
    "totalSize": 3072000
  }
}
```

### 获取重复文档

```http
GET /api/documents/duplicates?workspaceId={uuid}
```

**响应:**
```json
{
  "success": true,
  "data": {
    "groups": [
      {
        "fileHash": "sha256...",
        "files": [
          { "id": "uuid1", "fileName": "doc1.pdf", "createdAt": "..." },
          { "id": "uuid2", "fileName": "copy.pdf", "createdAt": "..." }
        ]
      }
    ],
    "totalGroups": 1,
    "totalDuplicates": 2
  }
}
```

### 清理重复文档

```http
POST /api/documents/duplicates/cleanup
Content-Type: application/json

{
  "keepOldest": true
}
```

---

## 搜索

### 混合搜索

```http
POST /api/documents/search
Content-Type: application/json

{
  "query": "用户认证流程",
  "workspaceId": "uuid",
  "mode": "hybrid",
  "topK": 5,
  "keywordWeight": 0.3,
  "vectorWeight": 0.7,
  "filters": {
    "tags": ["标签1"],
    "category": "分类",
    "dateFrom": "2024-01-01",
    "dateTo": "2024-12-31"
  }
}
```

**搜索模式:**

| 模式 | 描述 |
|------|------|
| keyword | 仅关键词搜索 (PostgreSQL 全文检索) |
| vector | 仅向量搜索 (语义相似度) |
| hybrid | 混合搜索 (RRF 算法融合) |

**响应:**
```json
{
  "success": true,
  "data": {
    "results": [
      {
        "id": "uuid",
        "title": "文档标题",
        "chunk": "匹配的文本片段...",
        "score": 0.95,
        "keywordScore": 0.9,
        "vectorScore": 0.98,
        "highlights": ["<em>用户认证</em>流程..."]
      }
    ],
    "total": 10,
    "mode": "hybrid",
    "query": "用户认证流程"
  }
}
```

---

## 版本控制

### 创建版本

```http
POST /api/documents/:id/versions
Content-Type: application/json

{
  "description": "版本说明",
  "file": "<new-file-optional>"
}
```

**响应:**
```json
{
  "success": true,
  "data": {
    "version": 2,
    "description": "版本说明",
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

### 获取版本历史

```http
GET /api/documents/:id/versions
```

**响应:**
```json
{
  "success": true,
  "data": {
    "versions": [
      {
        "version": 2,
        "description": "更新内容",
        "fileSize": 1024000,
        "createdAt": "2024-01-02T00:00:00Z",
        "createdBy": "用户名"
      },
      {
        "version": 1,
        "description": "初始版本",
        "fileSize": 1020000,
        "createdAt": "2024-01-01T00:00:00Z",
        "createdBy": "用户名"
      }
    ],
    "total": 2
  }
}
```

### 下载特定版本

```http
GET /api/documents/:id/versions/:version/download
```

### 恢复到特定版本

```http
POST /api/documents/:id/versions/:version/restore
```

---

## PRD 生成

### 生成 PRD

```http
POST /api/prd
Content-Type: application/json

{
  "userInput": "设计一个用户登录功能，支持手机号和邮箱登录",
  "workspaceId": "uuid",
  "documentIds": ["doc1", "doc2"],
  "options": {
    "model": "claude-3.5-sonnet",
    "template": "default",
    "language": "zh-CN"
  }
}
```

**响应:**
```json
{
  "success": true,
  "data": {
    "id": "prd-uuid",
    "title": "用户登录功能 PRD",
    "content": "# 产品需求文档\n\n## 1. 概述\n...",
    "references": [
      { "documentId": "doc1", "chunkIds": ["chunk1", "chunk2"] }
    ],
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

### 流式生成 PRD

```http
POST /api/prd/stream
Content-Type: application/json

{
  "userInput": "设计...",
  "workspaceId": "uuid",
  "stream": true
}
```

**响应:** Server-Sent Events (SSE)

```
event: start
data: {"id": "prd-uuid"}

event: chunk
data: {"content": "# 产品需求文档\n\n"}

event: chunk
data: {"content": "## 1. 概述\n\n"}

event: done
data: {"id": "prd-uuid", "totalTokens": 1500}
```

### 获取 PRD 列表

```http
GET /api/prd?workspaceId={uuid}&page={n}&limit={n}
```

### 获取 PRD 详情

```http
GET /api/prd/:id
```

### 更新 PRD

```http
PATCH /api/prd/:id
Content-Type: application/json

{
  "title": "新标题",
  "content": "更新内容"
}
```

### 删除 PRD

```http
DELETE /api/prd/:id
```

### 导出 PRD

```http
GET /api/prd/:id/export?format=markdown|pdf|docx
```

### 质量验证

```http
POST /api/prd/:id/validate
```

**响应:**
```json
{
  "success": true,
  "data": {
    "score": 85,
    "issues": [
      {
        "type": "warning",
        "section": "功能需求",
        "message": "缺少验收标准"
      }
    ],
    "suggestions": [
      "建议添加用户故事格式",
      "建议补充非功能性需求"
    ]
  }
}
```

---

## 对话系统

### 创建对话

```http
POST /api/chat/conversations
Content-Type: application/json

{
  "workspaceId": "uuid",
  "title": "新对话",
  "documentIds": ["doc1", "doc2"]
}
```

### 获取对话列表

```http
GET /api/chat/conversations?workspaceId={uuid}
```

### 发送消息

```http
POST /api/chat
Content-Type: application/json

{
  "conversationId": "uuid",
  "message": "请帮我分析这份文档的主要内容",
  "documentIds": ["doc1"]
}
```

**响应:**
```json
{
  "success": true,
  "data": {
    "id": "msg-uuid",
    "role": "assistant",
    "content": "根据文档分析，主要内容如下...",
    "references": [
      { "documentId": "doc1", "chunkId": "chunk1", "text": "引用文本..." }
    ],
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

### 流式对话

```http
POST /api/chat/stream
Content-Type: application/json

{
  "conversationId": "uuid",
  "message": "..."
}
```

**响应:** Server-Sent Events (SSE)

### 获取对话历史

```http
GET /api/chat/conversations/:id/messages?page={n}&limit={n}
```

### 删除对话

```http
DELETE /api/chat/conversations/:id
```

---

## 工作区

### 获取工作区列表

```http
GET /api/workspaces
```

**响应:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "uuid",
        "name": "工作区名称",
        "description": "描述",
        "memberCount": 5,
        "documentCount": 100,
        "createdAt": "2024-01-01T00:00:00Z"
      }
    ],
    "total": 3
  }
}
```

### 创建工作区

```http
POST /api/workspaces
Content-Type: application/json

{
  "name": "新工作区",
  "description": "工作区描述"
}
```

### 获取工作区详情

```http
GET /api/workspaces/:id
```

### 更新工作区

```http
PATCH /api/workspaces/:id
Content-Type: application/json

{
  "name": "新名称",
  "description": "新描述"
}
```

### 删除工作区

```http
DELETE /api/workspaces/:id
```

### 获取工作区成员

```http
GET /api/workspaces/:id/members
```

### 添加工作区成员

```http
POST /api/workspaces/:id/members
Content-Type: application/json

{
  "email": "user@example.com",
  "role": "member"
}
```

### 移除工作区成员

```http
DELETE /api/workspaces/:id/members/:userId
```

---

## 用户配置

### 获取用户 API 配置

```http
GET /api/user/api-configs
```

**响应:**
```json
{
  "success": true,
  "data": {
    "configs": [
      {
        "id": "uuid",
        "provider": "openai",
        "modelName": "gpt-4o",
        "isActive": true,
        "createdAt": "2024-01-01T00:00:00Z"
      }
    ]
  }
}
```

### 添加 API 配置

```http
POST /api/user/api-configs
Content-Type: application/json

{
  "provider": "openai",
  "apiKey": "sk-...",
  "modelConfig": {
    "model": "gpt-4o",
    "temperature": 0.7,
    "maxTokens": 8000
  }
}
```

### 更新 API 配置

```http
PATCH /api/user/api-configs/:id
Content-Type: application/json

{
  "apiKey": "sk-...",
  "isActive": true
}
```

### 删除 API 配置

```http
DELETE /api/user/api-configs/:id
```

### 测试 API 配置

```http
POST /api/user/api-configs/:id/test
```

---

## 标签与分类

### 获取标签列表

```http
GET /api/tags?workspaceId={uuid}
```

### 创建标签

```http
POST /api/tags
Content-Type: application/json

{
  "workspaceId": "uuid",
  "name": "标签名",
  "color": "#FF5733"
}
```

### 更新标签

```http
PATCH /api/tags/:id
Content-Type: application/json

{
  "name": "新标签名",
  "color": "#00FF00"
}
```

### 删除标签

```http
DELETE /api/tags/:id
```

### 获取分类树

```http
GET /api/categories?workspaceId={uuid}
```

**响应:**
```json
{
  "success": true,
  "data": {
    "categories": [
      {
        "id": "uuid",
        "name": "技术文档",
        "parentId": null,
        "children": [
          {
            "id": "uuid2",
            "name": "API 文档",
            "parentId": "uuid",
            "children": []
          }
        ]
      }
    ]
  }
}
```

### 创建分类

```http
POST /api/categories
Content-Type: application/json

{
  "workspaceId": "uuid",
  "name": "分类名",
  "parentId": "parent-uuid"
}
```

---

## 原型管理

### 获取原型列表

```http
GET /api/prototypes?workspaceId={uuid}
```

### 创建原型

```http
POST /api/prototypes
Content-Type: application/json

{
  "workspaceId": "uuid",
  "prdId": "prd-uuid",
  "name": "原型名称"
}
```

### 获取原型详情

```http
GET /api/prototypes/:id
```

### 获取原型页面

```http
GET /api/prototypes/:id/pages
```

### 创建原型页面

```http
POST /api/prototypes/:id/pages
Content-Type: application/json

{
  "name": "页面名称",
  "content": {},
  "order": 1
}
```

### 生成原型

```http
POST /api/prototypes/:id/generate
Content-Type: application/json

{
  "prdContent": "...",
  "style": "modern"
}
```

---

## 错误处理

### 错误响应格式

```json
{
  "success": false,
  "error": {
    "code": "DOCUMENT_NOT_FOUND",
    "message": "文档不存在",
    "details": {
      "documentId": "uuid"
    }
  }
}
```

### 错误码

| HTTP 状态码 | 错误码 | 描述 |
|------------|--------|------|
| 400 | VALIDATION_ERROR | 请求参数验证失败 |
| 401 | UNAUTHORIZED | 未授权，需要登录 |
| 403 | FORBIDDEN | 无权限访问 |
| 404 | NOT_FOUND | 资源不存在 |
| 409 | CONFLICT | 资源冲突（如重复） |
| 413 | PAYLOAD_TOO_LARGE | 文件过大 |
| 415 | UNSUPPORTED_MEDIA_TYPE | 不支持的文件类型 |
| 422 | UNPROCESSABLE_ENTITY | 业务逻辑错误 |
| 429 | RATE_LIMITED | 请求频率超限 |
| 500 | INTERNAL_ERROR | 服务器内部错误 |
| 503 | SERVICE_UNAVAILABLE | 服务不可用 |

### 常见错误示例

**验证错误:**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "参数验证失败",
    "details": {
      "fields": {
        "email": "必须是有效的邮箱地址",
        "password": "长度至少 8 个字符"
      }
    }
  }
}
```

**文件上传错误:**
```json
{
  "success": false,
  "error": {
    "code": "UNSUPPORTED_MEDIA_TYPE",
    "message": "不支持的文件类型",
    "details": {
      "supportedTypes": ["pdf", "docx", "md"],
      "receivedType": "xlsx"
    }
  }
}
```

---

## 速率限制

| 端点类型 | 限制 | 窗口 |
|----------|------|------|
| 一般 API | 100 次 | 1 分钟 |
| 文件上传 | 10 次 | 1 分钟 |
| AI 生成 | 20 次 | 1 分钟 |
| 搜索 | 30 次 | 1 分钟 |

超出限制时返回：
```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMITED",
    "message": "请求频率超限，请稍后重试",
    "details": {
      "retryAfter": 30
    }
  }
}
```

---

## 分页

所有列表接口支持分页，使用以下参数：

| 参数 | 默认值 | 最大值 |
|------|--------|--------|
| page | 1 | - |
| limit | 20 | 100 |

响应包含分页信息：
```json
{
  "data": {
    "items": [...],
    "total": 100,
    "page": 1,
    "limit": 20,
    "totalPages": 5
  }
}
```

---

## 版本信息

当前 API 版本: **v1**

基础 URL: `http://localhost:3000/api`

---

*最后更新: 2026-02-16*
