# ArchMind 技术架构文档

> 系统架构设计与技术实现详解

---

## 目录

- [系统概述](#系统概述)
- [架构设计](#架构设计)
- [核心模块](#核心模块)
- [数据流](#数据流)
- [数据库设计](#数据库设计)
- [安全架构](#安全架构)
- [部署架构](#部署架构)
- [性能优化](#性能优化)
- [扩展性设计](#扩展性设计)

---

## 系统概述

### 设计目标

ArchMind AI 采用**本地优先 (Local-First)** 架构，核心设计目标：

1. **数据主权**: 所有文档存储在本地 PostgreSQL，用户完全控制数据
2. **模型灵活**: 支持 8+ AI 提供商，可按需切换
3. **隐私保护**: 支持 Ollama 本地模型，完全离线运行
4. **企业级**: 多工作区、版本控制、审计日志

### 技术选型理由

| 技术 | 选型理由 |
|------|----------|
| Nuxt 3 | 前后端统一框架，SSR/SSG 支持，优秀的 DX |
| TypeScript | 类型安全，减少运行时错误 |
| PostgreSQL + pgvector | 关系型 + 向量检索一体化 |
| shadcn/ui | 高度可定制，无依赖锁定 |
| Drizzle ORM | 轻量级，类型安全，性能好 |
| LangChain.js | AI 应用开发标准框架 |

---

## 架构设计

### 整体架构

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              客户端层                                    │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                    Nuxt 3 (Vue 3 + TypeScript)                   │   │
│  │  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐       │   │
│  │  │   Pages   │ │Components │ │Composables│ │  Stores   │       │   │
│  │  │  (13个)   │ │  (209个)  │ │   (8个)   │ │   (3个)   │       │   │
│  │  └─────┬─────┘ └─────┬─────┘ └─────┬─────┘ └─────┬─────┘       │   │
│  │        └─────────────┴─────────────┴─────────────┘              │   │
│  │                           │                                      │   │
│  │                    shadcn/ui + Tailwind                          │   │
│  └───────────────────────────┬─────────────────────────────────────┘   │
└──────────────────────────────┬──────────────────────────────────────────┘
                               │ HTTP/SSE
┌──────────────────────────────┴──────────────────────────────────────────┐
│                              服务端层                                    │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                    Nuxt 3 Server Engine                          │   │
│  │  ┌──────────────────────────────────────────────────────────┐   │   │
│  │  │                   API Routes (91 files)                   │   │   │
│  │  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐        │   │   │
│  │  │  │   Auth  │ │Document │ │   PRD   │ │  Chat   │        │   │   │
│  │  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘        │   │   │
│  │  └──────────────────────────────────────────────────────────┘   │   │
│  │  ┌──────────────────────────────────────────────────────────┐   │   │
│  │  │                   Middleware                              │   │   │
│  │  │  ┌──────────┐ ┌──────────┐ ┌──────────┐                 │   │   │
│  │  │  │   Auth   │ │  Logger  │ │  Error   │                 │   │   │
│  │  │  └──────────┘ └──────────┘ └──────────┘                 │   │   │
│  │  └──────────────────────────────────────────────────────────┘   │   │
│  └──────────────────────────────────────────────────────────────────┘   │
└──────────────────────────────┬──────────────────────────────────────────┘
                               │
┌──────────────────────────────┴──────────────────────────────────────────┐
│                            核心业务层                                    │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                          lib/                                    │   │
│  │  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐   │   │
│  │  │     AI     │ │    RAG     │ │    PRD     │ │   Storage  │   │   │
│  │  │  Adapters  │ │   Engine   │ │ Generator  │ │  MinIO/OBS │   │   │
│  │  │   (8个)    │ │            │ │            │ │            │   │   │
│  │  └────────────┘ └────────────┘ └────────────┘ └────────────┘   │   │
│  │  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐   │   │
│  │  │    Chat    │ │ Logic Map  │ │ Prototype  │ │    Auth    │   │   │
│  │  │   Engine   │ │  Builder   │ │ Generator  │ │   Service  │   │   │
│  │  └────────────┘ └────────────┘ └────────────┘ └────────────┘   │   │
│  └──────────────────────────────────────────────────────────────────┘   │
└──────────────────────────────┬──────────────────────────────────────────┘
                               │
┌──────────────────────────────┴──────────────────────────────────────────┐
│                            数据访问层                                    │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                        lib/db/dao/                               │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐           │   │
│  │  │DocumentDAO│ │  PrdDAO  │ │ ChatDAO  │ │WorkspaceDAO│          │   │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘           │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐           │   │
│  │  │  UserDAO │ │  TagDAO  │ │CategoryDAO│ │ AssetDAO │           │   │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘           │   │
│  └──────────────────────────────────────────────────────────────────┘   │
└──────────────────────────────┬──────────────────────────────────────────┘
                               │
┌──────────────────────────────┴──────────────────────────────────────────┐
│                           基础设施层                                    │
│  ┌────────────────┐ ┌────────────────┐ ┌────────────────┐              │
│  │   PostgreSQL   │ │     MinIO      │ │    AI APIs     │              │
│  │   + pgvector   │ │  华为云 OBS    │ │  Multi-Model   │              │
│  └────────────────┘ └────────────────┘ └────────────────┘              │
└─────────────────────────────────────────────────────────────────────────┘
```

### 分层职责

| 层级 | 职责 | 示例 |
|------|------|------|
| 客户端层 | UI 渲染、用户交互、状态管理 | Vue 组件、Pinia Stores |
| 服务端层 | 请求处理、路由、认证 | Nuxt API Routes |
| 核心业务层 | 业务逻辑、AI 处理、RAG | lib/ai, lib/rag, lib/prd |
| 数据访问层 | 数据库操作、事务管理 | DAO 类 |
| 基础设施层 | 存储、数据库、外部 API | PostgreSQL, MinIO |

---

## 核心模块

### 1. AI 模块 (lib/ai/)

#### 架构图

```
┌─────────────────────────────────────────────────────────────┐
│                      ModelManager                            │
│  ┌─────────────────────────────────────────────────────┐    │
│  │           模型选择 & 路由 & 缓存                      │    │
│  └──────────────────────────┬──────────────────────────┘    │
│                             │                                │
│  ┌───────────────────────────────────────────────────────┐  │
│  │                 AIModelAdapter (Interface)             │  │
│  │  - generateText(prompt): Promise<string>               │  │
│  │  - generateStream(prompt): AsyncIterator<string>       │  │
│  │  - generateStructured<T>(prompt, schema): Promise<T>   │  │
│  └──────────────────────────┬────────────────────────────┘  │
│                             │                                │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐    │
│  │ Claude │ │ OpenAI │ │ Gemini │ │  GLM   │ │ Ollama │    │
│  │Adapter │ │Adapter │ │Adapter │ │Adapter │ │Adapter │    │
│  └────────┘ └────────┘ └────────┘ └────────┘ └────────┘    │
│  ┌────────┐ ┌────────┐ ┌────────┐                           │
│  │ Qwen   │ │ Wenxin │ │DeepSeek│                           │
│  │Adapter │ │Adapter │ │Adapter │                           │
│  └────────┘ └────────┘ └────────┘                           │
└─────────────────────────────────────────────────────────────┘
```

#### 模型适配器接口

```typescript
interface AIModelAdapter {
  // 基本信息
  readonly name: string
  readonly provider: string
  readonly maxTokens: number

  // 文本生成
  generateText(prompt: string, options?: GenerateOptions): Promise<string>

  // 流式生成
  generateStream(prompt: string, options?: GenerateOptions): AsyncIterator<string>

  // 结构化输出
  generateStructured<T>(
    prompt: string,
    schema: JSONSchema,
    options?: GenerateOptions
  ): Promise<T>

  // 成本估算
  estimateCost(inputTokens: number, outputTokens: number): number
}
```

#### 模型选择策略

```yaml
# config/ai-models.yaml
ai_models:
  default: glm-4
  fallback: [glm-4.5-air, gpt-4o, claude-3.5-sonnet]

  preferences:
    prd_generation: [claude-3.5-sonnet, gpt-4o, glm-4]
    chinese_content: [glm-4, qwen-max, wenxin-4.0]
    code_tasks: [gpt-4o, deepseek-chat]
    large_context: [gemini-1.5-pro]  # 200K context

  cost_limits:
    max_cost_per_request: 0.5  # USD
    daily_budget: 10.0         # USD
```

### 2. RAG 模块 (lib/rag/)

#### 处理流程

```
┌──────────────────────────────────────────────────────────────────┐
│                        RAG Pipeline                               │
│                                                                   │
│  ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐       │
│  │  Load   │───▶│  Split  │───▶│  Embed  │───▶│  Store  │       │
│  │         │    │         │    │         │    │         │       │
│  │PDF/DOCX │    │1000/200 │    │ Vector  │    │pgvector │       │
│  │ Markdown│    │ chunks  │    │1536-dim │    │  Table  │       │
│  └─────────┘    └─────────┘    └─────────┘    └─────────┘       │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                      Retrieval                               │ │
│  │  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐     │ │
│  │  │   Keyword   │    │   Vector    │    │   Hybrid    │     │ │
│  │  │   Search    │    │   Search    │    │    RRF      │     │ │
│  │  │  (tsvector) │    │ (cosine sim)│    │   Fusion    │     │ │
│  │  └─────────────┘    └─────────────┘    └─────────────┘     │ │
│  └─────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────┘
```

#### 文本分块策略

```typescript
interface ChunkConfig {
  chunkSize: number      // 1000 字符
  chunkOverlap: number   // 200 字符
  separators: string[]   // ['\n\n', '\n', '. ', ' ']
}

// 分块结果
interface DocumentChunk {
  id: string
  documentId: string
  content: string
  embedding?: number[]    // 1536 维向量
  metadata: {
    pageNumber?: number
    startOffset: number
    endOffset: number
  }
}
```

#### 混合搜索算法

```typescript
async function hybridSearch(query: string, options: SearchOptions) {
  // 1. 关键词搜索
  const keywordResults = await keywordSearch(query, options.topK * 2)

  // 2. 向量搜索
  const vectorResults = await vectorSearch(query, options.topK * 2)

  // 3. RRF 融合
  const fused = reciprocalRankFusion(
    keywordResults,
    vectorResults,
    options.keywordWeight,  // 0.3
    options.vectorWeight    // 0.7
  )

  return fused.slice(0, options.topK)
}

function reciprocalRankFusion(results1, results2, w1, w2, k = 60) {
  const scores = new Map<string, number>()

  for (const [rank, item] of results1.entries()) {
    scores.set(item.id, w1 / (k + rank + 1))
  }

  for (const [rank, item] of results2.entries()) {
    const current = scores.get(item.id) || 0
    scores.set(item.id, current + w2 / (k + rank + 1))
  }

  return Array.from(scores.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([id, score]) => ({ id, score }))
}
```

### 3. PRD 模块 (lib/prd/)

#### 生成流程

```
┌──────────────────────────────────────────────────────────────────┐
│                     PRD Generation Flow                           │
│                                                                   │
│  ┌─────────────┐                                                │
│  │ User Input  │  "设计一个用户登录功能..."                       │
│  └──────┬──────┘                                                │
│         │                                                        │
│         ▼                                                        │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐         │
│  │     RAG     │───▶│   Context   │───▶│    Model    │         │
│  │  Retrieval  │    │   Builder   │    │  Selection  │         │
│  │  (Top-5)    │    │             │    │  (Claude)   │         │
│  └─────────────┘    └─────────────┘    └─────────────┘         │
│                                                │                  │
│                                                ▼                  │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐         │
│  │   Persist   │◀───│  Validate   │◀───│  Generate   │         │
│  │   (DB)      │    │  (Quality)  │    │  (Stream)   │         │
│  └─────────────┘    └─────────────┘    └─────────────┘         │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
```

#### PRD 模板结构

```typescript
interface PRDDocument {
  id: string
  title: string
  content: string           // Markdown
  sections: {
    overview: string        // 概述
    background: string      // 背景
    goals: string[]         // 目标
    requirements: {         // 功能需求
      functional: string[]
      nonFunctional: string[]
    }
    userStories: string[]   // 用户故事
    acceptance: string[]    // 验收标准
    timeline: string        // 时间线
    risks: string[]         // 风险评估
  }
  references: {
    documentId: string
    chunkIds: string[]
  }[]
  metadata: {
    model: string
    tokens: number
    generatedAt: Date
  }
}
```

### 4. 存储模块 (lib/storage/)

#### 统一抽象接口

```typescript
interface StorageAdapter {
  // 上传
  upload(key: string, data: Buffer, options?: UploadOptions): Promise<UploadResult>

  // 下载
  download(key: string): Promise<Buffer>

  // 获取预签名 URL
  getPresignedUrl(key: string, expiresIn?: number): Promise<string>

  // 删除
  delete(key: string): Promise<void>

  // 批量删除
  deleteMany(keys: string[]): Promise<void>

  // 检查存在
  exists(key: string): Promise<boolean>

  // 获取元数据
  getMetadata(key: string): Promise<FileMetadata>
}
```

#### 存储路径规范

```
workspaces/{workspaceId}/
├── documents/
│   ├── {documentId}/
│   │   ├── original.pdf
│   │   └── versions/
│   │       ├── v1.pdf
│   │       └── v2.pdf
│   └── ...
├── prd/
│   └── {prdId}.md
├── prototypes/
│   └── {prototypeId}/
│       └── pages/
│           └── {pageId}.json
└── temp/
    └── {sessionId}/
        └── upload_xxx.tmp  (7 天过期)
```

---

## 数据流

### 文档上传流程

```
┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐
│ Client  │───▶│  API    │───▶│ Storage │───▶│   DB    │
│         │    │ Server  │    │ MinIO   │    │Document │
└─────────┘    └────┬────┘    └─────────┘    └────┬────┘
                    │                              │
                    │         ┌─────────┐          │
                    └────────▶│   DB    │◀─────────┘
                              │ Status  │
                              │pending  │
                              └────┬────┘
                                   │
                    ┌──────────────┼──────────────┐
                    ▼              ▼              ▼
              ┌─────────┐   ┌─────────┐   ┌─────────┐
              │ Extract │──▶│  Chunk  │──▶│  Embed  │
              │  Text   │   │ Splitter│   │  Model  │
              └─────────┘   └─────────┘   └────┬────┘
                                               │
                    ┌──────────────────────────┤
                    ▼                          ▼
              ┌─────────┐                ┌─────────┐
              │   DB    │                │   DB    │
              │ Chunks  │                │ Status  │
              │+ Vectors│                │completed│
              └─────────┘                └─────────┘
```

### PRD 生成流程

```
┌─────────┐    ┌─────────┐    ┌─────────┐
│ Client  │───▶│  API    │───▶│   RAG   │
│ Request │    │ Server  │    │Retrieve │
└─────────┘    └─────────┘    └────┬────┘
                                   │
                    ┌──────────────┼──────────────┐
                    ▼              ▼              ▼
              ┌─────────┐   ┌─────────┐   ┌─────────┐
              │ Context │   │ Prompt  │   │  Model  │
              │ Builder │   │Template │   │ Select  │
              └────┬────┘   └─────────┘   └────┬────┘
                   │                           │
                   └───────────┬───────────────┘
                               ▼
                    ┌─────────────────┐
                    │  AI Generation  │
                    │    (Stream)     │
                    └────────┬────────┘
                             │
              ┌──────────────┼──────────────┐
              ▼              ▼              ▼
        ┌─────────┐   ┌─────────┐   ┌─────────┐
        │  SSE    │   │Validate │   │ Persist │
        │ Response│   │ Quality │   │   DB    │
        └─────────┘   └─────────┘   └─────────┘
```

---

## 数据库设计

### ER 图

```
┌─────────────────┐       ┌─────────────────┐
│   workspaces    │       │      users      │
├─────────────────┤       ├─────────────────┤
│ id (PK)         │       │ id (PK)         │
│ name            │       │ email (unique)  │
│ description     │       │ password_hash   │
│ created_at      │       │ name            │
└────────┬────────┘       │ avatar          │
         │                └────────┬────────┘
         │                         │
         │  ┌──────────────────────┴──────┐
         │  │                             │
         ▼  ▼                             ▼
┌─────────────────┐              ┌─────────────────┐
│workspace_members│              │ user_api_configs│
├─────────────────┤              ├─────────────────┤
│ workspace_id(FK)│              │ id (PK)         │
│ user_id (FK)    │              │ user_id (FK)    │
│ role            │              │ provider        │
│ joined_at       │              │ api_key_enc     │
└─────────────────┘              │ model_config    │
                                 └─────────────────┘
         │
         ▼
┌─────────────────┐       ┌─────────────────┐
│   documents     │       │ document_chunks │
├─────────────────┤       ├─────────────────┤
│ id (PK)         │◀──────│ id (PK)         │
│ workspace_id(FK)│       │ document_id (FK)│
│ title           │       │ content         │
│ file_name       │       │ embedding       │
│ file_size       │       │ metadata        │
│ mime_type       │       │ (vector 1536)   │
│ file_hash       │       └─────────────────┘
│ status          │
│ tags            │       ┌─────────────────┐
│ category        │       │document_versions│
│ created_at      │       ├─────────────────┤
│ updated_at      │       │ id (PK)         │
└────────┬────────┘       │ document_id (FK)│
         │                │ version         │
         │                │ storage_key     │
         ▼                │ description     │
┌─────────────────┐       │ created_at      │
│ prd_documents   │       └─────────────────┘
├─────────────────┤
│ id (PK)         │       ┌─────────────────┐
│ workspace_id(FK)│       │prd_references   │
│ title           │       ├─────────────────┤
│ content         │◀──────│ prd_id (FK)     │
│ model_used      │       │ document_id (FK)│
│ tokens          │       │ chunk_ids       │
│ created_at      │       └─────────────────┘
└────────┬────────┘
         │
         ▼
┌─────────────────┐       ┌─────────────────┐
│  prototypes     │       │ conversations   │
├─────────────────┤       ├─────────────────┤
│ id (PK)         │       │ id (PK)         │
│ prd_id (FK)     │       │ workspace_id(FK)│
│ name            │       │ title           │
│ status          │       │ document_ids    │
│ created_at      │       │ created_at      │
└────────┬────────┘       └────────┬────────┘
         │                         │
         ▼                         ▼
┌─────────────────┐       ┌─────────────────┐
│prototype_pages  │       │conversation_msgs│
├─────────────────┤       ├─────────────────┤
│ id (PK)         │       │ id (PK)         │
│ prototype_id(FK)│       │ conversation_id │
│ name            │       │ role            │
│ content (jsonb) │       │ content         │
│ order           │       │ references      │
│ created_at      │       │ created_at      │
└─────────────────┘       └─────────────────┘
```

### 核心表设计

#### documents 表

```sql
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  title VARCHAR(500) NOT NULL,
  file_name VARCHAR(500) NOT NULL,
  file_size BIGINT NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  file_hash VARCHAR(64) NOT NULL,  -- SHA-256
  storage_key VARCHAR(500) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  tags TEXT[],
  category VARCHAR(100),
  description TEXT,
  chunk_count INTEGER DEFAULT 0,
  processing_log JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 索引
CREATE INDEX idx_documents_workspace ON documents(workspace_id);
CREATE INDEX idx_documents_status ON documents(status);
CREATE INDEX idx_documents_hash ON documents(file_hash);
CREATE INDEX idx_documents_tags ON documents USING GIN(tags);
CREATE INDEX idx_documents_created ON documents(created_at DESC);

-- 全文检索
ALTER TABLE documents ADD COLUMN search_vector tsvector;
CREATE INDEX idx_documents_search ON documents USING GIN(search_vector);
```

#### document_chunks 表 (向量检索)

```sql
CREATE TABLE document_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  embedding vector(1536),  -- OpenAI text-embedding-3-small
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 向量索引 (IVFFlat)
CREATE INDEX idx_chunks_embedding
ON document_chunks
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- 文档索引
CREATE INDEX idx_chunks_document ON document_chunks(document_id);
```

---

## 安全架构

### 认证流程

```
┌─────────┐     ┌─────────┐     ┌─────────┐
│ Client  │────▶│  Auth   │────▶│   DB    │
│ Login   │     │ Service │     │  User   │
└─────────┘     └────┬────┘     └─────────┘
                     │
                     ▼
              ┌─────────────┐
              │   bcrypt    │
              │  password   │
              │   verify    │
              └──────┬──────┘
                     │
                     ▼
              ┌─────────────┐
              │    JWT      │
              │   generate  │
              │   token     │
              └──────┬──────┘
                     │
                     ▼
              ┌─────────────┐
              │   Client    │
              │  Store Token│
              └─────────────┘
```

### 安全措施

| 层级 | 措施 | 实现 |
|------|------|------|
| 传输层 | HTTPS | TLS 1.3 |
| 认证 | JWT | HS256, 24h 过期 |
| 密码 | bcrypt | cost factor 10 |
| API Key | AES-256 | 加密存储 |
| 文件 | 预签名 URL | 1 小时过期 |
| 输入 | Zod | 请求验证 |

### 权限模型

```typescript
enum WorkspaceRole {
  OWNER = 'owner',       // 完全控制
  ADMIN = 'admin',       // 管理成员和配置
  MEMBER = 'member',     // 读写文档
  VIEWER = 'viewer'      // 只读访问
}

// 权限检查
const permissions = {
  owner: ['*'],
  admin: ['manage_members', 'manage_settings', 'create', 'read', 'update', 'delete'],
  member: ['create', 'read', 'update', 'delete:own'],
  viewer: ['read']
}
```

---

## 部署架构

### 单机部署

```
┌─────────────────────────────────────────────────────────────┐
│                        Host Server                           │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                 Docker Compose                       │   │
│  │  ┌───────────────┐  ┌───────────────┐               │   │
│  │  │   Nuxt App    │  │   PostgreSQL  │               │   │
│  │  │   (Port 3000) │  │   (Port 5432) │               │   │
│  │  └───────────────┘  └───────────────┘               │   │
│  │  ┌───────────────┐                                  │   │
│  │  │    MinIO      │                                  │   │
│  │  │ (Port 9000)   │                                  │   │
│  │  └───────────────┘                                  │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │   Nginx     │  │   PM2       │  │   Logs      │        │
│  │  (Reverse)  │  │ (Process)   │  │   (JSON)    │        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
└─────────────────────────────────────────────────────────────┘
```

### 生产部署

```
┌─────────────────────────────────────────────────────────────────┐
│                           Load Balancer                         │
│                         (Nginx / ALB)                           │
└───────────────────────────┬─────────────────────────────────────┘
                            │
            ┌───────────────┼───────────────┐
            ▼               ▼               ▼
     ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
     │  Nuxt App   │ │  Nuxt App   │ │  Nuxt App   │
     │  Instance 1 │ │  Instance 2 │ │  Instance 3 │
     └──────┬──────┘ └──────┬──────┘ └──────┬──────┘
            │               │               │
            └───────────────┼───────────────┘
                            │
     ┌──────────────────────┼──────────────────────┐
     │                      │                      │
     ▼                      ▼                      ▼
┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│ PostgreSQL  │      │  华为云 OBS  │      │   Redis     │
│ + pgvector  │      │   Storage   │      │   (Cache)   │
│  (Primary)  │      │             │      │             │
└──────┬──────┘      └─────────────┘      └─────────────┘
       │
       ▼
┌─────────────┐
│ PostgreSQL  │
│  (Replica)  │
└─────────────┘
```

---

## 性能优化

### 数据库优化

```sql
-- 1. 连接池配置
DATABASE_POOL_MIN=5
DATABASE_POOL_MAX=20

-- 2. 索引优化
CREATE INDEX CONCURRENTLY idx_chunks_embedding
ON document_chunks USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- 3. 分区（大数据量）
CREATE TABLE document_chunks_2024 PARTITION OF document_chunks
FOR VALUES FROM ('2024-01-01') TO ('2025-01-01');

-- 4. 查询优化
EXPLAIN ANALYZE SELECT ...;
```

### 缓存策略

```typescript
// Redis 缓存配置
const cacheConfig = {
  // 用户配置缓存
  userConfig: { ttl: 3600 },        // 1 小时

  // 文档列表缓存
  documentList: { ttl: 300 },       // 5 分钟

  // 向量搜索结果缓存
  searchResults: { ttl: 60 },       // 1 分钟

  // AI 响应缓存（相同问题）
  aiResponse: { ttl: 3600 }         // 1 小时
}
```

### 前端优化

```typescript
// 1. 代码分割
export default defineNuxtConfig({
  nitro: {
    experimental: {
      compressPublicAssets: true
    }
  },
  vite: {
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            'ai-vendor': ['@anthropic-ai/sdk', 'openai'],
            'ui-vendor': ['radix-vue', 'class-variance-authority']
          }
        }
      }
    }
  }
})

// 2. 懒加载组件
const HeavyComponent = defineAsyncComponent(() =>
  import('~/components/HeavyComponent.vue')
)

// 3. 图片优化
<NuxtImg src="..." format="webp" quality="80" />
```

---

## 扩展性设计

### 插件架构

```typescript
// AI 适配器插件
interface AIPlugin {
  name: string
  provider: string
  register(manager: ModelManager): void
}

// 存储适配器插件
interface StoragePlugin {
  name: string
  register(): StorageAdapter
}

// 文档处理器插件
interface DocumentProcessorPlugin {
  supportedTypes: string[]
  process(file: Buffer): Promise<string>
}
```

### 事件系统

```typescript
// 事件总线
eventBus.on('document:uploaded', async (doc) => {
  await processDocument(doc)
})

eventBus.on('prd:generated', async (prd) => {
  await notifyUser(prd)
  await updateStats(prd.workspaceId)
})
```

### 钩子系统

```typescript
// 文档处理钩子
hooks.on('document:beforeProcess', async (doc) => {
  // 自定义预处理
})

hooks.on('document:afterProcess', async (doc, result) => {
  // 自定义后处理
})

// PRD 生成钩子
hooks.on('prd:beforeGenerate', async (context) => {
  // 自定义上下文
})
```

---

## 监控与日志

### 日志配置

```typescript
// 结构化日志
const logger = createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: format.json(),
  transports: [
    new transports.Console(),
    new transports.File({ filename: 'error.log', level: 'error' }),
    new transports.File({ filename: 'combined.log' })
  ]
})

// 请求日志
{
  "timestamp": "2024-01-01T00:00:00Z",
  "level": "info",
  "method": "POST",
  "path": "/api/documents/upload",
  "userId": "uuid",
  "workspaceId": "uuid",
  "duration": 1234,
  "status": 201
}
```

### 健康检查

```typescript
// /api/health
{
  "status": "healthy",
  "version": "1.0.0",
  "uptime": 86400,
  "checks": {
    "database": "ok",
    "storage": "ok",
    "ai": "degraded"  // 部分模型不可用
  }
}
```

---

*最后更新: 2026-02-16*
