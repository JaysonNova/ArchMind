# ArchMind AI 技术路线与架构文档

## 文档版本信息

* **版本：** v1.0
* **创建日期：** 2026-02-01
* **最后更新：** 2026-02-01
* **文档状态：** Draft
* **基于 PRD 版本：** ArchMind AI 产品需求文档 v1.0

---

## 1. 技术路线概览

### 1.1 开发阶段规划

ArchMind AI 采用渐进式开发策略，分为三个主要阶段：

```
Phase 1: 核心 MVP (2-3 个月)
├── 文档管理基础功能
├── RAG 检索引擎
├── 单模型 PRD 生成
└── 本地数据存储

Phase 2: 多模型集成 (1-2 个月)
├── 多模型适配器架构
├── 模型智能路由
├── 流式输出优化
└── UI 识别模块（可选）

Phase 3: 增强与优化 (持续迭代)
├── 逻辑补完算子
├── 变更影响分析
├── 性能优化
└── 用户体验提升
```

### 1.2 技术选型原则

* **简单优先：** MVP 阶段避免过度设计，优先验证核心价值
* **本地优先：** 数据存储和处理优先在本地完成，保护隐私
* **渐进增强：** 从单一模型到多模型，从基础功能到高级特性
* **成本可控：** 优先使用开源方案和性价比高的服务
* **可扩展性：** 架构设计考虑未来扩展需求

---

## 2. 系统架构设计

### 2.1 整体架构图

```
┌─────────────────────────────────────────────────────────────┐
│                    用户界面层 (UI Layer)                      │
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  文档管理    │  │  PRD 生成    │  │  设置中心    │      │
│  │  Document    │  │  Generator   │  │  Settings    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                               │
│           Nuxt 3 + Vue 3 (Composition API) + TypeScript       │
│              Nuxt UI / PrimeVue + Tailwind CSS                │
└───────────────────────────┬─────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────┐
│                  API 路由层 (API Routes)                      │
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  文档 API    │  │  RAG API     │  │  AI API      │      │
│  │  /api/docs   │  │  /api/rag    │  │  /api/ai     │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                               │
│              Nuxt 3 Server Routes + Middleware                 │
└───────────────────────────┬─────────────────────────────────┘
                            │
        ┌───────────────────┴───────────────────┐
        │                                       │
┌───────▼────────────┐              ┌──────────▼──────────────┐
│   业务逻辑层        │              │   AI 服务层              │
│  (Business Logic)  │              │  (AI Service Layer)     │
│                    │              │                          │
│ ┌────────────────┐ │              │ ┌──────────────────┐   │
│ │ 文档处理服务   │ │              │ │  AI 模型管理器   │   │
│ │ Document Svc   │ │              │ │  Model Manager   │   │
│ └────────────────┘ │              │ └──────────────────┘   │
│                    │              │                          │
│ ┌────────────────┐ │              │ ┌──────────────────┐   │
│ │ RAG 检索服务   │ │              │ │  模型适配器层    │   │
│ │ RAG Service    │ │              │ │  Model Adapters  │   │
│ └────────────────┘ │              │ └──────────────────┘   │
│                    │              │  │  │  │  │  │  │  │   │
│ ┌────────────────┐ │              │  │  │  │  │  │  │  │   │
│ │ PRD 生成服务   │ │              │  ▼  ▼  ▼  ▼  ▼  ▼  ▼   │
│ │ PRD Generator  │ │              │  C  G  G  Q  W  D  O   │
│ └────────────────┘ │              │  l  P  e  w  e  e  l   │
│                    │              │  a  T  m  e  n  e  l   │
│ ┌────────────────┐ │              │  u  -  i  n  x  p  a   │
│ │ 向量化服务     │ │              │  d  4  n     i  S  m   │
│ │ Embedding Svc  │ │              │  e  o  i     n  e  a   │
│ └────────────────┘ │              │                 e     │
└────────────────────┘              └──────────────────────────┘
        │                                       │
        │                                       │
┌───────▼────────────────────────────────────────────────────┐
│                   数据持久层 (Data Layer)                   │
│                                                              │
│  ┌──────────────────┐  ┌──────────────────┐               │
│  │ PostgreSQL 数据库│  │  本地文件系统    │               │
│  │                  │  │                  │               │
│  │ • 文档元数据     │  │ • 原始文档文件   │               │
│  │ • 向量索引       │  │ • 上传的图片     │               │
│  │ • 用户数据       │  │ • 生成的 PRD     │               │
│  │ • 生成历史       │  │ • 临时文件       │               │
│  │                  │  │                  │               │
│  │  pgvector 扩展   │  │  Node.js fs      │               │
│  └──────────────────┘  └──────────────────┘               │
└────────────────────────────────────────────────────────────┘
```

### 2.2 核心模块说明

#### 2.2.1 用户界面层

**技术栈：**
* Nuxt 3
* Vue 3 (Composition API)
* TypeScript 5.x
* Nuxt UI / PrimeVue + Tailwind CSS
* VeeValidate / Formkit (表单管理)
* Pinia (状态管理)

**核心页面：**
* `/` - 首页/仪表板
* `/documents` - 文档管��中心
* `/generate` - PRD 生成页面
* `/settings` - 系统设置

#### 2.2.2 API 路由层

**核心 API 端点：**

```typescript
// 文档管理 API
POST   /api/documents/upload      // 上传文档
GET    /api/documents              // 获取文档列表
GET    /api/documents/:id          // 获取文档详情
DELETE /api/documents/:id          // 删除文档
PUT    /api/documents/:id          // 更新文档

// RAG 检索 API
POST   /api/rag/search             // 语义检索
POST   /api/rag/embed              // 文档向量化

// AI 生成 API
POST   /api/ai/generate            // 生成 PRD
POST   /api/ai/stream              // 流式生成
GET    /api/ai/models              // 获取可用模型列表
POST   /api/ai/analyze-image       // 图像分析（可选）

// 系统配置 API
GET    /api/config                 // 获取配置
PUT    /api/config                 // 更新配置
```

---

## 3. 核心技术模块详细设计

### 3.1 RAG 检索引擎

#### 3.1.1 架构设计

```
文档输入
    │
    ▼
┌─────────────────┐
│  文档加载器      │  ← LangChain Document Loaders
│  (支持多格式)    │     • PDF Loader
└────────┬────────┘     • DOCX Loader
         │              • Markdown Loader
         ▼
┌─────────────────┐
│  文本分块器      │  ← Text Splitter
│  (Chunking)     │     • RecursiveCharacterTextSplitter
└────────┬────────┘     • Chunk Size: 1000
         │              • Overlap: 200
         ▼
┌─────────────────┐
│  向量化引擎      │  ← Embedding Model
│  (Embedding)    │     • OpenAI text-embedding-3-small
└────────┬────────┘     • 或其他 embedding 模型
         │
         ▼
┌─────────────────┐
│  向量数据库      │  ← PostgreSQL + pgvector
│  (Vector Store) │     • 原生向量存储
└────────┬────────┘     • 余弦相似度检索
         │
         ▼
┌─────────────────┐
│  检索器          │  ← Retriever
│  (Retriever)    │     • Top-K 检索 (K=5)
└─────────────────┘     • 相似度阈值: 0.7
```

#### 3.1.2 核心代码结构

```typescript
// src/lib/rag/document-loader.ts
export class DocumentLoader {
  async loadDocument(filePath: string): Promise<Document[]>
  async loadPDF(filePath: string): Promise<Document[]>
  async loadDOCX(filePath: string): Promise<Document[]>
  async loadMarkdown(filePath: string): Promise<Document[]>
}

// src/lib/rag/text-splitter.ts
export class TextSplitter {
  constructor(chunkSize: number, overlap: number)
  async splitDocuments(docs: Document[]): Promise<Document[]>
}

// src/lib/rag/embedding-service.ts
export class EmbeddingService {
  async embedDocuments(texts: string[]): Promise<number[][]>
  async embedQuery(text: string): Promise<number[]>
}

// src/lib/rag/vector-store.ts
export class VectorStore {
  async addDocuments(docs: Document[], embeddings: number[][]): Promise<void>
  async similaritySearch(query: string, k: number): Promise<Document[]>
  async deleteDocument(docId: string): Promise<void>
}

// src/lib/rag/retriever.ts
export class RAGRetriever {
  async retrieve(query: string, options?: RetrieveOptions): Promise<Document[]>
}
```

#### 3.1.3 数据库 Schema

```sql
-- 启用 pgvector 扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";

-- 文档表
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(500) NOT NULL,
  file_path TEXT NOT NULL,
  file_type VARCHAR(20) NOT NULL,
  file_size INTEGER NOT NULL,
  content TEXT,
  metadata JSONB DEFAULT '{}',
  status VARCHAR(20) DEFAULT 'uploaded',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 文档块表（用于向量检索）
CREATE TABLE document_chunks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
  chunk_index INTEGER NOT NULL,
  content TEXT NOT NULL,
  embedding vector(1536), -- OpenAI text-embedding-3-small
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 索引
CREATE INDEX idx_documents_created_at ON documents(created_at DESC);
CREATE INDEX idx_documents_status ON documents(status);
CREATE INDEX idx_chunks_document_id ON document_chunks(document_id);

-- 向量相似度搜索索引（IVFFlat）
CREATE INDEX idx_chunks_embedding_ivfflat
ON document_chunks
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);
```

### 3.2 多模型 AI 服务层

#### 3.2.1 统一接口设计

**核心接口定义：**

```typescript
// src/lib/ai/types.ts
export interface AIModelAdapter {
  // 基础信息
  name: string;
  provider: string;
  modelId: string;

  // 核心能力
  generateText(prompt: string, options?: GenerateOptions): Promise<string>;
  generateStream(prompt: string, options?: GenerateOptions): AsyncIterator<string>;
  generateStructured<T>(prompt: string, schema: JSONSchema): Promise<T>;

  // 多模态能力（可选）
  analyzeImage?(image: Buffer, prompt: string): Promise<string>;

  // 模型配置
  getCapabilities(): ModelCapabilities;
  estimateCost(tokens: number): CostEstimate;
  isAvailable(): Promise<boolean>;
}

export interface GenerateOptions {
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  stopSequences?: string[];
  systemPrompt?: string;
}

export interface ModelCapabilities {
  supportsStreaming: boolean;
  supportsStructuredOutput: boolean;
  supportsVision: boolean;
  maxContextLength: number;
  supportedLanguages: string[];
}

export interface CostEstimate {
  inputCost: number;
  outputCost: number;
  currency: string;
}
```

#### 3.2.2 模型管理器

```typescript
// src/lib/ai/model-manager.ts
export class ModelManager {
  private adapters: Map<string, AIModelAdapter>;
  private config: ModelConfig;

  constructor(config: ModelConfig) {
    this.config = config;
    this.adapters = new Map();
    this.initializeAdapters();
  }

  // 注册模型适配器
  registerAdapter(adapter: AIModelAdapter): void {
    this.adapters.set(adapter.modelId, adapter);
  }

  // 获取模型适配器
  getAdapter(modelId: string): AIModelAdapter | undefined {
    return this.adapters.get(modelId);
  }

  // 智能路由：根据任务类型选择最佳模型
  async selectModel(taskType: TaskType, options?: SelectOptions): Promise<AIModelAdapter> {
    const preferences = this.config.preferences[taskType];

    // 尝试首选模型
    for (const modelId of preferences) {
      const adapter = this.adapters.get(modelId);
      if (adapter && await adapter.isAvailable()) {
        return adapter;
      }
    }

    // 降级到备用模型
    for (const modelId of this.config.fallback) {
      const adapter = this.adapters.get(modelId);
      if (adapter && await adapter.isAvailable()) {
        return adapter;
      }
    }

    throw new Error('No available model found');
  }

  // 获取所有可用模型
  async getAvailableModels(): Promise<AIModelAdapter[]> {
    const available: AIModelAdapter[] = [];
    for (const adapter of this.adapters.values()) {
      if (await adapter.isAvailable()) {
        available.push(adapter);
      }
    }
    return available;
  }
}

export enum TaskType {
  PRD_GENERATION = 'prd_generation',
  CHINESE_CONTENT = 'chinese_content',
  LARGE_DOCUMENT = 'large_document',
  COST_SENSITIVE = 'cost_sensitive',
  PRIVACY_MODE = 'privacy_mode',
}
```

#### 3.2.3 模型适配器实现示例

**Claude 适配器：**

```typescript
// src/lib/ai/adapters/claude-adapter.ts
import Anthropic from '@anthropic-ai/sdk';

export class ClaudeAdapter implements AIModelAdapter {
  name = 'Claude 3.5 Sonnet';
  provider = 'Anthropic';
  modelId = 'claude-3.5-sonnet';

  private client: Anthropic;

  constructor(apiKey: string) {
    this.client = new Anthropic({ apiKey });
  }

  async generateText(prompt: string, options?: GenerateOptions): Promise<string> {
    const response = await this.client.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: options?.maxTokens || 4096,
      temperature: options?.temperature || 0.7,
      messages: [{ role: 'user', content: prompt }],
      system: options?.systemPrompt,
    });

    return response.content[0].type === 'text' ? response.content[0].text : '';
  }

  async *generateStream(prompt: string, options?: GenerateOptions): AsyncIterator<string> {
    const stream = await this.client.messages.stream({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: options?.maxTokens || 4096,
      temperature: options?.temperature || 0.7,
      messages: [{ role: 'user', content: prompt }],
      system: options?.systemPrompt,
    });

    for await (const chunk of stream) {
      if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
        yield chunk.delta.text;
      }
    }
  }

  async generateStructured<T>(prompt: string, schema: JSONSchema): Promise<T> {
    // 使用 Claude 的结构化输出能力
    const response = await this.client.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: `${prompt}\n\nPlease respond with valid JSON matching this schema:\n${JSON.stringify(schema, null, 2)}`
        }
      ],
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '{}';
    return JSON.parse(text) as T;
  }

  getCapabilities(): ModelCapabilities {
    return {
      supportsStreaming: true,
      supportsStructuredOutput: true,
      supportsVision: true,
      maxContextLength: 200000,
      supportedLanguages: ['en', 'zh', 'ja', 'es', 'fr', 'de'],
    };
  }

  estimateCost(tokens: number): CostEstimate {
    return {
      inputCost: (tokens / 1000000) * 3.0,
      outputCost: (tokens / 1000000) * 15.0,
      currency: 'USD',
    };
  }

  async isAvailable(): Promise<boolean> {
    try {
      await this.client.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 10,
        messages: [{ role: 'user', content: 'test' }],
      });
      return true;
    } catch {
      return false;
    }
  }
}
```

**OpenAI 适配器：**

```typescript
// src/lib/ai/adapters/openai-adapter.ts
import OpenAI from 'openai';

export class OpenAIAdapter implements AIModelAdapter {
  name = 'GPT-4o';
  provider = 'OpenAI';
  modelId = 'gpt-4o';

  private client: OpenAI;

  constructor(apiKey: string) {
    this.client = new OpenAI({ apiKey });
  }

  async generateText(prompt: string, options?: GenerateOptions): Promise<string> {
    const response = await this.client.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        ...(options?.systemPrompt ? [{ role: 'system' as const, content: options.systemPrompt }] : []),
        { role: 'user' as const, content: prompt }
      ],
      temperature: options?.temperature || 0.7,
      max_tokens: options?.maxTokens || 4096,
    });

    return response.choices[0]?.message?.content || '';
  }

  async *generateStream(prompt: string, options?: GenerateOptions): AsyncIterator<string> {
    const stream = await this.client.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        ...(options?.systemPrompt ? [{ role: 'system' as const, content: options.systemPrompt }] : []),
        { role: 'user' as const, content: prompt }
      ],
      temperature: options?.temperature || 0.7,
      max_tokens: options?.maxTokens || 4096,
      stream: true,
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        yield content;
      }
    }
  }

  async generateStructured<T>(prompt: string, schema: JSONSchema): Promise<T> {
    const response = await this.client.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
    });

    const text = response.choices[0]?.message?.content || '{}';
    return JSON.parse(text) as T;
  }

  getCapabilities(): ModelCapabilities {
    return {
      supportsStreaming: true,
      supportsStructuredOutput: true,
      supportsVision: true,
      maxContextLength: 128000,
      supportedLanguages: ['en', 'zh', 'ja', 'es', 'fr', 'de'],
    };
  }

  estimateCost(tokens: number): CostEstimate {
    return {
      inputCost: (tokens / 1000000) * 2.5,
      outputCost: (tokens / 1000000) * 10.0,
      currency: 'USD',
    };
  }

  async isAvailable(): Promise<boolean> {
    try {
      await this.client.chat.completions.create({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: 'test' }],
        max_tokens: 5,
      });
      return true;
    } catch {
      return false;
    }
  }
}
```

**通义千问适配器：**

```typescript
// src/lib/ai/adapters/qwen-adapter.ts
export class QwenAdapter implements AIModelAdapter {
  name = '通义千问 Qwen-Max';
  provider = '阿里云';
  modelId = 'qwen-max';

  private apiKey: string;
  private baseURL = 'https://dashscope.aliyuncs.com/api/v1';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async generateText(prompt: string, options?: GenerateOptions): Promise<string> {
    const response = await fetch(`${this.baseURL}/services/aigc/text-generation/generation`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'qwen-max',
        input: {
          messages: [
            ...(options?.systemPrompt ? [{ role: 'system', content: options.systemPrompt }] : []),
            { role: 'user', content: prompt }
          ]
        },
        parameters: {
          temperature: options?.temperature || 0.7,
          max_tokens: options?.maxTokens || 4096,
        }
      })
    });

    const data = await response.json();
    return data.output?.text || '';
  }

  async *generateStream(prompt: string, options?: GenerateOptions): AsyncIterator<string> {
    const response = await fetch(`${this.baseURL}/services/aigc/text-generation/generation`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'X-DashScope-SSE': 'enable',
      },
      body: JSON.stringify({
        model: 'qwen-max',
        input: {
          messages: [
            ...(options?.systemPrompt ? [{ role: 'system', content: options.systemPrompt }] : []),
            { role: 'user', content: prompt }
          ]
        },
        parameters: {
          temperature: options?.temperature || 0.7,
          max_tokens: options?.maxTokens || 4096,
          incremental_output: true,
        }
      })
    });

    // 处理 SSE 流
    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    if (!reader) return;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (line.startsWith('data:')) {
          const data = JSON.parse(line.slice(5));
          if (data.output?.text) {
            yield data.output.text;
          }
        }
      }
    }
  }

  async generateStructured<T>(prompt: string, schema: JSONSchema): Promise<T> {
    const enhancedPrompt = `${prompt}\n\n请以 JSON 格式返回，遵循以下 schema:\n${JSON.stringify(schema, null, 2)}`;
    const text = await this.generateText(enhancedPrompt);
    return JSON.parse(text) as T;
  }

  getCapabilities(): ModelCapabilities {
    return {
      supportsStreaming: true,
      supportsStructuredOutput: false,
      supportsVision: true,
      maxContextLength: 30000,
      supportedLanguages: ['zh', 'en'],
    };
  }

  estimateCost(tokens: number): CostEstimate {
    return {
      inputCost: (tokens / 1000) * 0.02,
      outputCost: (tokens / 1000) * 0.06,
      currency: 'CNY',
    };
  }

  async isAvailable(): Promise<boolean> {
    try {
      await this.generateText('test', { maxTokens: 5 });
      return true;
    } catch {
      return false;
    }
  }
}
```

#### 3.2.4 模型配置文件

```yaml
# config/ai-models.yaml
ai_models:
  # 默认模型
  default: claude-3.5-sonnet

  # 降级策略
  fallback:
    - gpt-4o
    - qwen-max
    - deepseek-v2

  # 任务类型偏好
  preferences:
    prd_generation:
      - claude-3.5-sonnet
      - gpt-4o
    chinese_content:
      - qwen-max
      - wenxin-4.0
      - claude-3.5-sonnet
    large_document:
      - gemini-1.5-pro
      - claude-3.5-sonnet
    cost_sensitive:
      - deepseek-v2
      - qwen-max
    privacy_mode:
      - ollama-llama3
      - ollama-qwen

  # 模型配置
  models:
    claude-3.5-sonnet:
      api_key_env: ANTHROPIC_API_KEY
      enabled: true
      max_retries: 3

    gpt-4o:
      api_key_env: OPENAI_API_KEY
      enabled: true
      max_retries: 3

    gemini-1.5-pro:
      api_key_env: GOOGLE_API_KEY
      enabled: true
      max_retries: 3

    qwen-max:
      api_key_env: DASHSCOPE_API_KEY
      enabled: true
      max_retries: 3

    wenxin-4.0:
      api_key_env: BAIDU_API_KEY
      enabled: false
      max_retries: 3

    deepseek-v2:
      api_key_env: DEEPSEEK_API_KEY
      enabled: false
      max_retries: 3

    ollama-llama3:
      base_url: http://localhost:11434
      enabled: false
      max_retries: 3
```

### 3.3 PRD 生成引擎

#### 3.3.1 生成流程设计

```
用户输入需求
    │
    ▼
┌─────────────────┐
│  需求解析        │  ← 提取关键信息
│  Parse Input    │     • 功能描述
└────────┬────────┘     • 目标用户
         │              • 业务场景
         ▼
┌─────────────────┐
│  RAG 检索        │  ← 检索相关历史文档
│  Retrieve       │     • 相似功能
└────────┬────────┘     • 相关业务逻辑
         │              • 设计规范
         ▼
┌─────────────────┐
│  上下文构建      │  ← 构建 Prompt
│  Build Context  │     • 历史文档摘要
└────────┬────────┘     • 产品背景
         │              • 技术约束
         ▼
┌─────────────────┐
│  AI 生成         │  ← 调用 AI 模型
│  Generate       │     • 选择合适模型
└────────┬────────┘     • 流式输出
         │              • 结构化生成
         ▼
┌─────────────────┐
│  后处理          │  ← 格式化和优化
│  Post-process   │     • Markdown 格式化
└────────┬────────┘     • 章节补全
         │              • 逻辑检查
         ▼
┌─────────────────┐
│  输出 PRD        │  ← 返回最终��档
│  Output         │     • 保存到数据库
└─────────────────┘     • 返回给用户
```

#### 3.3.2 Prompt 工程

**系统提示词模板：**

```typescript
// src/lib/ai/prompts/prd-system-prompt.ts
export const PRD_SYSTEM_PROMPT = `你是一个专业的产品经理助手，擅长编写高质量的产品需求文档（PRD）。

你的职责：
1. 根据用户的需求描述，生成结构完整、逻辑清晰的 PRD 文档
2. 参考历史文档中的产品逻辑和设计规范，确保新功能与现有系统一致
3. 补充用户可能遗漏的边界情况、异常流程和非功能需求
4. 使用 Markdown 格式输出，包含必要的流程图（Mermaid 语法）

PRD 文档结构：
1. 功能概述
2. 业务背景与目标
3. 用户故事
4. 功能详细说明
5. 业务流程图
6. 界面设计要求
7. 数据模型
8. 异常处理
9. 非功能需求
10. 变更影响分析

注意事项：
- 保持与历史文档的术语一致性
- 明确标注新增、修改、删除的功能点
- 考虑安全性、性能、可扩展性等非功能需求
- 使用清晰的语言，避免歧义`;

// src/lib/ai/prompts/prd-user-prompt.ts
export function buildPRDPrompt(
  userInput: string,
  context: RetrievedContext
): string {
  return `
## 用户需求
${userInput}

## 相关历史文档
${context.documents.map((doc, i) => `
### 文档 ${i + 1}: ${doc.title}
${doc.content}
`).join('\n')}

## 产品背景
${context.productBackground || '暂无'}

## 现有技术栈
${context.techStack || '暂无'}

## 设计规范
${context.designGuidelines || '暂无'}

---

请基于以上信息，生成一份完整的 PRD 文档。确保：
1. 新功能与现有系统逻辑一致
2. 考虑所有可能的边界情况和异常流程
3. 提供清晰的业务流程图（使用 Mermaid 语法）
4. 分析对现有功能的影响
`;
}
```

#### 3.3.3 PRD 生成服务实现

```typescript
// src/lib/prd/prd-generator.ts
export class PRDGenerator {
  constructor(
    private modelManager: ModelManager,
    private ragRetriever: RAGRetriever
  ) {}

  async generate(
    userInput: string,
    options?: GenerateOptions
  ): Promise<PRDDocument> {
    // 1. 检索相关历史文档
    const retrievedDocs = await this.ragRetriever.retrieve(userInput, {
      topK: 5,
      threshold: 0.7,
    });

    // 2. 构建上下文
    const context = await this.buildContext(retrievedDocs);

    // 3. 选择合适的模型
    const model = await this.modelManager.selectModel(
      TaskType.PRD_GENERATION,
      { language: this.detectLanguage(userInput) }
    );

    // 4. 构建 Prompt
    const prompt = buildPRDPrompt(userInput, context);

    // 5. 生成 PRD
    const content = await model.generateText(prompt, {
      systemPrompt: PRD_SYSTEM_PROMPT,
      temperature: 0.7,
      maxTokens: 8000,
    });

    // 6. 后处理
    const processed = await this.postProcess(content);

    // 7. 保存到数据库
    const prdDoc = await this.savePRD({
      title: this.extractTitle(processed),
      content: processed,
      userInput,
      modelUsed: model.modelId,
      retrievedDocs: retrievedDocs.map(d => d.id),
    });

    return prdDoc;
  }

  async generateStream(
    userInput: string,
    options?: GenerateOptions
  ): AsyncIterator<string> {
    // 类似的流程，但使用流式输出
    const retrievedDocs = await this.ragRetriever.retrieve(userInput);
    const context = await this.buildContext(retrievedDocs);
    const model = await this.modelManager.selectModel(TaskType.PRD_GENERATION);
    const prompt = buildPRDPrompt(userInput, context);

    return model.generateStream(prompt, {
      systemPrompt: PRD_SYSTEM_PROMPT,
      temperature: 0.7,
      maxTokens: 8000,
    });
  }

  private async buildContext(docs: Document[]): Promise<RetrievedContext> {
    // 从检索到的文档中提取关键信息
    return {
      documents: docs,
      productBackground: await this.extractProductBackground(docs),
      techStack: await this.extractTechStack(docs),
      designGuidelines: await this.extractDesignGuidelines(docs),
    };
  }

  private async postProcess(content: string): Promise<string> {
    // 格式化、补全章节、检查逻辑等
    let processed = content;

    // 确保 Markdown 格式正确
    processed = this.formatMarkdown(processed);

    // 补全缺失的章节
    processed = await this.fillMissingSections(processed);

    // 验证 Mermaid 图表语法
    processed = this.validateMermaidDiagrams(processed);

    return processed;
  }

  private detectLanguage(text: string): string {
    // 简单的语言检测
    const chineseChars = text.match(/[\u4e00-\u9fa5]/g);
    return chineseChars && chineseChars.length > text.length * 0.3 ? 'zh' : 'en';
  }

  private extractTitle(content: string): string {
    // 从内容中提取标题
    const match = content.match(/^#\s+(.+)$/m);
    return match ? match[1] : '未命名 PRD';
  }

  private formatMarkdown(content: string): string {
    // Markdown 格式化逻辑
    return content;
  }

  private async fillMissingSections(content: string): Promise<string> {
    // 检查并补全缺失的章节
    const requiredSections = [
      '功能概述',
      '业务背景',
      '功能详细说明',
      '异常处理',
      '非功能需求',
    ];

    // 实现章节检查和补全逻辑
    return content;
  }

  private validateMermaidDiagrams(content: string): string {
    // 验证 Mermaid 图表语法
    return content;
  }

  private async savePRD(data: SavePRDData): Promise<PRDDocument> {
    // 保存到数据库
    const id = generateId();
    const now = new Date();

    await db.run(`
      INSERT INTO prd_documents (id, title, content, user_input, model_used, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [id, data.title, data.content, data.userInput, data.modelUsed, now]);

    // 保存关联的历史文档
    for (const docId of data.retrievedDocs) {
      await db.run(`
        INSERT INTO prd_document_references (prd_id, document_id)
        VALUES (?, ?)
      `, [id, docId]);
    }

    return {
      id,
      title: data.title,
      content: data.content,
      userInput: data.userInput,
      modelUsed: data.modelUsed,
      createdAt: now,
    };
  }
}
```

---

## 4. 项目目录结构

```
ArchMind/
├── pages/                            # Nuxt 3 Pages (文件路由)
│   ├── index.vue                     # 首页/仪表板
│   ├── documents/                    # 文档管理
│   │   ├── index.vue                 # 文档列表
│   │   └── [id].vue                  # 文档详情
│   ├── generate.vue                  # PRD 生成
│   └── settings.vue                  # 设置
│
├── server/                           # Nuxt 3 Server (API Routes)
│   ├── api/
│   │   ├── documents/
│   │   │   ├── index.get.ts          # 获取文档列表
│   │   │   ├── index.post.ts         # 创建文档
│   │   │   ├── upload.post.ts        # 上传文档
│   │   │   └── [id]/
│   │   │       ├── index.get.ts      # 获取文档详情
│   │   │       ├── index.put.ts      # 更新文档
│   │   │       └── index.delete.ts   # 删除文档
│   │   ├── rag/
│   │   │   ├── search.post.ts        # 语义检索
│   │   │   └── embed.post.ts         # 文档向量化
│   │   ├── ai/
│   │   │   ├── generate.post.ts      # 生成 PRD
│   │   │   ├── stream.post.ts        # 流式生成
│   │   │   └── models.get.ts         # 获取模型列表
│   │   └── config/
│   │       ├── index.get.ts          # 获取配置
│   │       └── index.put.ts          # 更新配置
│   └── middleware/                   # Server 中间件
│
├── components/                       # Vue 组件
│   ├── ui/                           # UI 组件库组件
│   ├── documents/
│   │   ├── DocumentList.vue
│   │   ├── DocumentUpload.vue
│   │   └── DocumentViewer.vue
│   ├── prd/
│   │   ├── PrdGenerator.vue
│   │   ├── PrdEditor.vue
│   │   └── PrdPreview.vue
│   └── settings/
│       ├── ModelSelector.vue
│       └── ApiKeyManager.vue
│
├── layouts/                          # Nuxt 布局
│   ├── default.vue                   # 默认布局
│   └── dashboard.vue                 # 仪表板布局
│
├── composables/                      # Vue Composables
│   ├── useDocuments.ts               # 文档管理
│   ├── usePrdGenerator.ts            # PRD 生成
│   └── useAiModels.ts                # AI 模型
│
├── stores/                           # Pinia 状态管理
│   ├── documents.ts                  # 文档状态
│   ├── prd.ts                        # PRD 状态
│   └── settings.ts                   # 设置状态
│
├── lib/                              # 核心业务逻辑
│   ├── ai/                           # AI 服务层
│   │   ├── types.ts
│   │   ├── model-manager.ts
│   │   ├── adapters/
│   │   │   ├── base-adapter.ts
│   │   │   ├── claude-adapter.ts
│   │   │   ├── openai-adapter.ts
│   │   │   ├── gemini-adapter.ts
│   │   │   ├── qwen-adapter.ts
│   │   │   ├── wenxin-adapter.ts
│   │   │   ├── deepseek-adapter.ts
│   │   │   └── ollama-adapter.ts
│   │   └── prompts/
│   │       ├── prd-system-prompt.ts
│   │       └── prd-user-prompt.ts
│   │
│   ├── rag/                          # RAG 检索引擎
│   │   ├── document-loader.ts
│   │   ├── text-splitter.ts
│   │   ├── embedding-service.ts
│   │   ├── vector-store.ts
│   │   └── retriever.ts
│   │
│   ├── prd/                          # PRD 生成引擎
│   │   ├── prd-generator.ts
│   │   ├── prd-processor.ts
│   │   └── prd-validator.ts
│   │
│   ├── db/                           # 数据库
│   │   ├── client.ts
│   │   ├── schema.sql
│   │   └── migrations/
│   │
│   └── utils/                        # 工具函数
│       ├── file-utils.ts
│       ├── markdown-utils.ts
│       └── id-generator.ts
│
├── types/                            # TypeScript 类型定义
│   ├── document.ts
│   ├── prd.ts
│   └── config.ts
│
├── public/                           # 静态资源
│   └── uploads/                      # 上传的文件
│
├── data/                             # 本地数据
│   └── documents/                    # 文档存储（PostgreSQL 数据库独立部署）
│
├── config/                           # 配置文件
│   ├── ai-models.yaml
│   └── app-config.yaml
│
├── docs/                             # 文档
│   ├── ArchMind AI 产品需求文档 (PRD).md
│   └── 技术路线与架构文档.md
│
├── scripts/                          # 脚本
│   ├── init-db.ts                    # 初始化数据库
│   └── seed-data.ts                  # 种子数据
│
├── .env.example                      # 环境变量示例
├── .env                              # 本地环境变量
├── package.json
├── tsconfig.json
├── nuxt.config.ts                    # Nuxt 配置
├── tailwind.config.ts
└── README.md
```

---

## 5. 开发路线图

### 5.1 Phase 1: 核心 MVP (Week 1-8)

#### Week 1-2: 项目初始化与基础架构

**目标：** 搭建项目基础框架

**任务清单：**
- [ ] 初始化 Nuxt 3 项目
- [ ] 配置 TypeScript、ESLint、Prettier
- [ ] 集成 Nuxt UI 和 Tailwind CSS
- [ ] 设计数据库 Schema
- [ ] 安装配置 PostgreSQL + pgvector
- [ ] 实现数据库连接和 ORM 层
- [ ] 搭建基础 UI 布局（导航、侧边栏）

**交付物：**
- 可运行的 Nuxt 3 应用
- 基础 UI 框架
- PostgreSQL 数据库初始化脚本

#### Week 3-4: 文档管理功能

**目标：** 实现文档上传、存储和管理

**任务清单：**
- [ ] 实现文档上传 API
- [ ] 支持 PDF、DOCX、Markdown 格式
- [ ] 实现文档列表页面
- [ ] 实现文档详情页面
- [ ] 实现文档删除功能
- [ ] 文件存储到本地文件系统

**交付物：**
- 完整的文档管理 CRUD 功能
- 文档列表和详情页面

#### Week 5-6: RAG 检索引擎

**目标：** 实现文档向量化和语义检索

**任务清单：**
- [ ] 集成 LangChain.js
- [ ] 实现文档加载器（PDF、DOCX、Markdown）
- [ ] 实现文本分块器
- [ ] 集成 OpenAI Embedding API
- [ ] 实现 PostgreSQL + pgvector 向量存储
- [ ] 实现语义检索 API
- [ ] 测试检索准确率

**交付物：**
- 可用的 RAG 检索系统
- 检索准确率 > 70%

#### Week 7-8: 单模型 PRD 生成

**目标：** 实现基于 Claude 的 PRD 生成功能

**任务清单：**
- [ ] 集成 Anthropic SDK
- [ ] 设计 PRD 生成 Prompt
- [ ] 实现 PRD 生成 API
- [ ] 实现流式输出
- [ ] 实现 PRD 预览页面
- [ ] 实现 PRD 保存和导出
- [ ] 测试生成质量

**交付物：**
- 可用的 PRD 生成功能
- PRD 质量评分 > 7/10

### 5.2 Phase 2: 多模型集成 (Week 9-12)

#### Week 9-10: 多模型适配器架构

**目标：** 实现统一的多模型接口

**任务清单：**
- [ ] 设计 AIModelAdapter 接口
- [ ] 实现 ModelManager
- [ ] 实现 OpenAI 适配器
- [ ] 实现 Gemini 适配器
- [ ] 实现通义千问适配器
- [ ] 实现模型配置管理
- [ ] 实现模型可用性检测

**交付物：**
- 统一的多模型接口
- 至少 3 个可用的模型适配器

#### Week 11-12: 智能路由与优化

**目标：** 实现模型智能选择和性能优化

**任务清单：**
- [ ] 实现任务类型识别
- [ ] 实现模型智能路由
- [ ] 实现降级策略
- [ ] 优化流式输出性能
- [ ] 实现成本估算
- [ ] 添加模型切换 UI
- [ ] 性能测试和优化

**交付物：**
- 智能模型路由系统
- 模型选择 UI
- 性能优化报告

### 5.3 Phase 3: 增强与优化 (Week 13+)

#### 持续迭代功能

**高优先级：**
- [ ] 逻辑补完算子（自动补充边界情况）
- [ ] 变更影响分析（分析对现有功能的影响）
- [ ] PRD 版本管理
- [ ] PRD 对比功能
- [ ] 导出为 Word/PDF

**中优先级：**
- [ ] UI 识别模块（可选）
- [ ] 批量文档处理
- [ ] 文档标签和分类
- [ ] 搜索功能增强
- [ ] 用户偏好学习

**低优先级：**
- [ ] 团队协作功能
- [ ] 评论和审批流程
- [ ] 集成第三方工具（Figma、飞书等）
- [ ] 移动端适配

---

## 6. 技术实现细节

### 6.1 环境变量配置

```bash
# .env.example

# 应用配置
NODE_ENV=development
PORT=3000
APP_URL=http://localhost:3000

# PostgreSQL 数据库
DATABASE_URL=postgresql://username:password@localhost:5432/archmind
DATABASE_POOL_MIN=2
DATABASE_POOL_MAX=10

# AI 模型 API Keys
ANTHROPIC_API_KEY=your_anthropic_api_key
OPENAI_API_KEY=your_openai_api_key
GOOGLE_API_KEY=your_google_api_key
DASHSCOPE_API_KEY=your_dashscope_api_key
BAIDU_API_KEY=your_baidu_api_key
DEEPSEEK_API_KEY=your_deepseek_api_key

# Ollama 配置（本地模型）
OLLAMA_BASE_URL=http://localhost:11434

# 文件上传配置
MAX_FILE_SIZE=10485760  # 10MB
UPLOAD_DIR=./public/uploads

# RAG 配置
EMBEDDING_MODEL=text-embedding-3-small
CHUNK_SIZE=1000
CHUNK_OVERLAP=200
TOP_K=5
SIMILARITY_THRESHOLD=0.7

# AI 生成配置
DEFAULT_MODEL=claude-3.5-sonnet
DEFAULT_TEMPERATURE=0.7
DEFAULT_MAX_TOKENS=8000
```

### 6.2 数据库完整 Schema

```sql
-- 启用必要的扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- 用户表（为未来多用户做准备）
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(100),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 文档表
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(500) NOT NULL,
  file_path TEXT NOT NULL,
  file_type VARCHAR(20) NOT NULL,
  file_size INTEGER NOT NULL,
  content TEXT,
  metadata JSONB DEFAULT '{}',
  status VARCHAR(20) DEFAULT 'uploaded',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 文档块表
CREATE TABLE document_chunks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
  chunk_index INTEGER NOT NULL,
  content TEXT NOT NULL,
  embedding vector(1536),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- PRD 文档表
CREATE TABLE prd_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(500) NOT NULL,
  content TEXT NOT NULL,
  user_input TEXT NOT NULL,
  model_used VARCHAR(100) NOT NULL,
  generation_time INTEGER,
  token_count INTEGER,
  estimated_cost DECIMAL(10, 4),
  status VARCHAR(20) DEFAULT 'draft',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- PRD 文档引用表
CREATE TABLE prd_document_references (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  prd_id UUID REFERENCES prd_documents(id) ON DELETE CASCADE,
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
  relevance_score DECIMAL(5, 4),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(prd_id, document_id)
);

-- 系统配置表
CREATE TABLE system_config (
  key VARCHAR(100) PRIMARY KEY,
  value JSONB NOT NULL,
  description TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 生成历史表
CREATE TABLE generation_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  prd_id UUID REFERENCES prd_documents(id) ON DELETE SET NULL,
  model_used VARCHAR(100) NOT NULL,
  user_input TEXT NOT NULL,
  token_count INTEGER,
  estimated_cost DECIMAL(10, 4),
  generation_time INTEGER,
  status VARCHAR(20) NOT NULL,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 索引
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_documents_user_id ON documents(user_id);
CREATE INDEX idx_documents_created_at ON documents(created_at DESC);
CREATE INDEX idx_documents_status ON documents(status);
CREATE INDEX idx_chunks_document_id ON document_chunks(document_id);
CREATE INDEX idx_prd_user_id ON prd_documents(user_id);
CREATE INDEX idx_prd_created_at ON prd_documents(created_at DESC);
CREATE INDEX idx_prd_model_used ON prd_documents(model_used);
CREATE INDEX idx_prd_refs_prd_id ON prd_document_references(prd_id);
CREATE INDEX idx_prd_refs_document_id ON prd_document_references(document_id);
CREATE INDEX idx_history_created_at ON generation_history(created_at DESC);

-- 向量相似度搜索索引
CREATE INDEX idx_chunks_embedding_ivfflat
ON document_chunks
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- 自动更新 updated_at 触发器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_documents_updated_at
  BEFORE UPDATE ON documents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_prd_documents_updated_at
  BEFORE UPDATE ON prd_documents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

### 6.3 依赖包清单

```json
{
  "name": "archmind-ai",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "nuxt dev",
    "build": "nuxt build",
    "generate": "nuxt generate",
    "preview": "nuxt preview",
    "postinstall": "nuxt prepare",
    "lint": "eslint .",
    "db:init": "tsx scripts/init-db.ts",
    "db:seed": "tsx scripts/seed-data.ts"
  },
  "dependencies": {
    "nuxt": "^3.10.0",
    "vue": "^3.4.0",
    "typescript": "^5.4.0",

    "@anthropic-ai/sdk": "^0.20.0",
    "openai": "^4.28.0",
    "@google/generative-ai": "^0.2.0",

    "langchain": "^0.1.30",
    "@langchain/community": "^0.0.45",
    "@langchain/openai": "^0.0.25",

    "pg": "^8.11.3",
    "pgvector": "^0.1.8",
    "drizzle-orm": "^0.29.3",

    "@nuxt/ui": "^2.14.0",
    "@nuxtjs/tailwindcss": "^6.11.0",
    "@nuxtjs/color-mode": "^3.3.0",
    "@vueuse/core": "^10.7.0",
    "@vueuse/nuxt": "^10.7.0",

    "vee-validate": "^4.12.0",
    "@vee-validate/zod": "^4.12.0",
    "zod": "^3.22.4",

    "pinia": "^2.1.7",
    "@pinia/nuxt": "^0.5.1",

    "mammoth": "^1.7.0",
    "pdf-parse": "^1.1.1",
    "marked": "^12.0.0",

    "js-yaml": "^4.1.0",
    "nanoid": "^5.0.6"
  },
  "devDependencies": {
    "@types/node": "^20.11.0",
    "@types/pg": "^8.10.9",
    "@types/js-yaml": "^4.0.9",
    "drizzle-kit": "^0.20.9",
    "@nuxt/devtools": "^1.0.0",
    "@nuxtjs/eslint-config-typescript": "^12.1.0",
    "eslint": "^8.57.0",
    "prettier": "^3.2.0",
    "tsx": "^4.7.0"
  }
}
```

---

## 7. 部署方案

### 7.1 本地开发环境

```bash
# 1. 克隆项目
git clone https://github.com/yourusername/archmind-ai.git
cd archmind-ai

# 2. 安装依赖
pnpm install

# 3. 配置环境变量
cp .env.example .env
# 编辑 .env，填入 API Keys

# 4. 初始化数据库
pnpm db:init

# 5. 启动开发服务器
pnpm dev
```

### 7.2 生产环境部署

**选项 1: Vercel/Netlify 部署（推荐）**

```bash
# Vercel 部署
# 1. 安装 Vercel CLI
pnpm i -g vercel

# 2. 登录 Vercel
vercel login

# 3. 部署
vercel

# 4. 配置环境变量
# 在 Vercel Dashboard 中配置所有 API Keys

# Netlify 部署
# 1. 安装 Netlify CLI
pnpm i -g netlify-cli

# 2. 登录 Netlify
netlify login

# 3. 部署
netlify deploy --prod

# 4. 配置环境变量
# 在 Netlify Dashboard 中配置所有 API Keys
```

**选项 2: Docker 部署**

```dockerfile
# Dockerfile
FROM node:20-alpine AS base

# 安装依赖
FROM base AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

# 构建应用
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# 运行应用
FROM base AS runner
WORKDIR /app
ENV NODE_ENV production

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000
CMD ["node", "server.js"]
```

```bash
# 构建镜像
docker build -t archmind-ai .

# 运行容器
docker run -p 3000:3000 \
  -e ANTHROPIC_API_KEY=your_key \
  -e OPENAI_API_KEY=your_key \
  -v $(pwd)/data:/app/data \
  archmind-ai
```

---

## 8. 性能优化策略

### 8.1 前端优化

- **代码分割：** 使用 Next.js 动态导入减少初始加载
- **图片优化：** 使用 Next.js Image 组件
- **缓存策略：** 合理使用 React Query 缓存 API 响应
- **懒加载：** 非关键组件延迟加载

### 8.2 后端优化

- **数据库索引：** 为常用查询字段添加索引
- **向量检索优化：** 调整 Top-K 和相似度阈值
- **API 响应缓存：** 缓存常用的检索结果
- **流式输出：** 使用 Server-Sent Events 提升用户体验

### 8.3 AI 调用优化

- **Prompt 优化：** 精简 Prompt 减少 Token 消耗
- **模型选择：** 根据任务复杂度选择合适的模型
- **批量处理：** 合并多个小请求
- **缓存策略：** 缓存相似请求的结果

---

## 9. 监控与日志

### 9.1 日志记录

```typescript
// src/lib/logger.ts
export class Logger {
  static info(message: string, meta?: any) {
    console.log(`[INFO] ${new Date().toISOString()} - ${message}`, meta);
  }

  static error(message: string, error?: Error, meta?: any) {
    console.error(`[ERROR] ${new Date().toISOString()} - ${message}`, {
      error: error?.message,
      stack: error?.stack,
      ...meta,
    });
  }

  static warn(message: string, meta?: any) {
    console.warn(`[WARN] ${new Date().toISOString()} - ${message}`, meta);
  }
}
```

### 9.2 性能监控

- **响应时间：** 记录每个 API 的响应时间
- **Token 使用量：** 统计每个模型的 Token 消耗
- **成本追踪：** 计算每次生成的成本
- **错误率：** 监控 API 调用失败率

---

## 10. 安全考虑

### 10.1 数据安全

- **本地存储：** 所有敏感数据存储在本地
- **API Key 管理：** 使用环境变量，不提交到代码仓库
- **文件权限：** 限制数据库和文件的访问权限

### 10.2 API 安全

- **输入验证：** 验证所有用户输入
- **文件上传限制：** 限制文件大小和类型
- **Rate Limiting：** 限制 API 调用频率
- **错误处理：** 不暴露敏感错误信息

---

## 11. 测试策略

### 11.1 单元测试

- RAG 检索准确率测试
- 模型适配器功能测试
- PRD 生成质量测试

### 11.2 集成测试

- 端到端文档上传和生成流程
- 多模型切换测试
- 数据库操作测试

### 11.3 性能测试

- 大文档处理性能
- 并发请求处理能力
- 内存占用测试

---

## 12. 总结

本技术路线与架构文档详细描述了 ArchMind AI 的技术实现方案，包括：

1. **清晰的开发路线：** 分三个阶段渐进式开发
2. **完整的技术架构：** 从前端到后端的完整设计
3. **多模型支持：** 统一接口支持多种 AI 模型
4. **可扩展性：** 模块化设计便于未来扩展
5. **实用性：** 基于 MVP 原则，优先验证核心价值

**下一步行动：**
1. 按照 Phase 1 路线图开始开发
2. 每周进行进度回顾和调整
3. 持续收集用户反馈优化产品

---

**文档维护：**
- 本文档将随着项目进展持续更新
- 重大架构变更需要更新本文档
- 建议每个 Phase 结束后进行文档回顾

