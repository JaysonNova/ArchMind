# ArchMind AI 架构设计文档

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
│  │  SQLite 数据库   │  │  本地文件系统    │               │
│  │                  │  │                  │               │
│  │ • 文档元数据     │  │ • 原始文档文件   │               │
│  │ • 向量索引       │  │ • 上传的图片     │               │
│  │ • 用户配置       │  │ • 生成的 PRD     │               │
│  │ • 生成历史       │  │ • 临时文件       │               │
│  │                  │  │                  │               │
│  │  sqlite-vss      │  │  Node.js fs      │               │
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
* `/documents` - 文档管理中心
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

## 3. 核心技术模块架构

### 3.1 RAG 检索引擎架构

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
│  向量数据库      │  ← sqlite-vss
│  (Vector Store) │     • 本地向量存储
└────────┬────────┘     • 余弦相似度检索
         │
         ▼
┌─────────────────┐
│  检索器          │  ← Retriever
│  (Retriever)    │     • Top-K 检索 (K=5)
└─────────────────┘     • 相似度阈值: 0.7
```

**核心组件：**
- `DocumentLoader`: 多格式文档解析
- `TextSplitter`: 智能文本分块
- `EmbeddingService`: 向量生成
- `VectorStore`: 本地向量数据库操作
- `RAGRetriever`: 语义搜索接口

### 3.2 多模型 AI 服务层架构

**统一接口设计：**

```typescript
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
```

**支持的模型：**
- Claude 3.5 Sonnet (Anthropic) - 主力 PRD 生成
- GPT-4o (OpenAI) - 通用场景
- Gemini 1.5 Pro (Google) - 大文档处理
- Qwen-Max (阿里云) - 中文内容
- Wenxin 4.0 (百度) - 中文内容
- DeepSeek-V2 - 成本敏感场景
- Ollama (本地) - 隐私模式

**模型选择策略：**
- 任务类型路由：不同任务使用不同模型
- 降级机制：主模型不可用时自动切换
- 成本优化：根据任务复杂度智能选择

### 3.3 PRD 生成引擎架构

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
│  输出 PRD        │  ← 返回最终文档
│  Output         │     • 保存到数据库
└─────────────────┘     • 返回给用户
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
│   ├── api/                          # API 端点
│   └── middleware/                   # Server 中间件
│
├── components/                       # Vue 组件
│   ├── ui/                           # UI 组件库组件
│   ├── documents/                    # 文档管理组件
│   ├── prd/                          # PRD 生成组件
│   └── settings/                     # 设置组件
│
├── layouts/                          # Nuxt 布局
│   ├── default.vue                   # 默认布局
│   └── dashboard.vue                 # 仪表板布局
│
├── composables/                      # Vue Composables
├── stores/                           # Pinia 状态管理
│
├── lib/                              # 核心业务逻辑
│   ├── ai/                           # AI 服务层
│   ├── rag/                          # RAG 检索引擎
│   ├── prd/                          # PRD 生成引擎
│   ├── db/                           # 数据库
│   └── utils/                        # 工具函数
│
├── types/                            # TypeScript 类型定义
├── public/                           # 静态资源
├── data/                             # 本地数据
├── config/                           # 配置文件
├── docs/                             # 文档
└── scripts/                          # 脚本
```

---

## 5. 开发路线图

### 5.1 Phase 1: 核心 MVP (Week 1-8)

#### Week 1-2: 项目初始化与基础架构
- 初始化 Nuxt 3 项目
- 配置 TypeScript、ESLint、Prettier
- 集成 UI 组件库和 Tailwind CSS
- 设计数据库 Schema
- 实现 SQLite 数据库连接
- 搭建基础 UI 布局

#### Week 3-4: 文档管理功能
- 实现文档上传 API
- 支持 PDF、DOCX、Markdown 格式
- 实现文档列表和详情页面
- 实现文档删除功能
- 文件存储到本地文件系统

#### Week 5-6: RAG 检索引擎
- 集成 LangChain.js
- 实现文档加载器
- 实现文本分块器
- 集成 OpenAI Embedding API
- 实现 sqlite-vss 向量存储
- 实现语义检索 API
- 测试检索准确率 (目标 > 70%)

#### Week 7-8: 单模型 PRD 生成
- 集成 Anthropic SDK
- 设计 PRD 生成 Prompt
- 实现 PRD 生成 API
- 实现流式输出
- 实现 PRD 预览页面
- 实现 PRD 保存和导出
- 测试生成质量 (目标 > 7/10)

### 5.2 Phase 2: 多模型集成 (Week 9-12)

#### Week 9-10: 多模型适配器架构
- 设计 AIModelAdapter 接口
- 实现 ModelManager
- 实现 OpenAI、Gemini、Qwen 适配器
- 实现模型配置管理
- 实现模型可用性检测

#### Week 11-12: 智能路由与优化
- 实现任务类型识别
- 实现模型智能路由
- 实现降级策略
- 优化流式输出性能
- 实现成本估算
- 添加模型切换 UI

### 5.3 Phase 3: 增强与优化 (Week 13+)

**高优先级：**
- 逻辑补完算子
- 变更影响分析
- PRD 版本管理
- PRD 对比功能
- 导出为 Word/PDF

**中优先级：**
- UI 识别模块
- 批量文档处理
- 文档标签和分类
- 搜索功能增强

**低优先级：**
- 团队协作功能
- 评论和审批流程
- 集成第三方工具

---

## 6. 技术栈总览

### 6.1 前端技术栈

| 类别 | 技术选型 | 版本 | 用途 |
|------|---------|------|------|
| 框架 | Nuxt 3 | ^3.10.0 | 全栈框架 |
| UI 库 | Vue 3 | ^3.4.0 | 响应式 UI |
| 语言 | TypeScript | ^5.4.0 | 类型安全 |
| UI 组件 | Nuxt UI / PrimeVue | ^2.14.0 | 组件库 |
| 样式 | Tailwind CSS | ^6.11.0 | 原子化 CSS |
| 状态管理 | Pinia | ^2.1.7 | 状态管理 |
| 表单验证 | VeeValidate + Zod | ^4.12.0 | 表单处理 |

### 6.2 后端技术栈

| 类别 | 技术选型 | 版本 | 用途 |
|------|---------|------|------|
| 运行时 | Node.js | 20+ | 服务器运行时 |
| 数据库 | SQLite | - | 本地数据库 |
| 向量数据库 | sqlite-vss | ^0.1.2 | 向量检索 |
| ORM | better-sqlite3 | ^9.4.0 | 数据库操作 |

### 6.3 AI 服务技术栈

| 类别 | 技术选型 | 版本 | 用途 |
|------|---------|------|------|
| Claude | @anthropic-ai/sdk | ^0.20.0 | Claude API |
| OpenAI | openai | ^4.28.0 | GPT-4 API |
| Gemini | @google/generative-ai | ^0.2.0 | Gemini API |
| RAG | LangChain.js | ^0.1.30 | RAG 框架 |

---

## 7. 部署架构

### 7.1 本地开发环境

```
开发机器
├── Node.js 20+
├── pnpm
├── SQLite 数据库 (./data/database.db)
├── 上传文件存储 (./public/uploads)
└── 环境变量 (.env)
```

### 7.2 生产环境选项

**选项 1: Vercel/Netlify (推荐)**
- 自动 CI/CD
- 全球 CDN
- 环境变量管理
- 零配置部署

**选项 2: Docker 容器**
- 完全可控环境
- 易于迁移
- 支持私有部署
- 数据卷持久化

**选项 3: VPS 自托管**
- 完全控制
- 成本可控
- 数据隐私
- 需要运维

---

## 8. 性能优化策略

### 8.1 前端优化
- 代码分割和懒加载
- 图片优化
- API 响应缓存
- 虚拟滚动

### 8.2 后端优化
- 数据库索引优化
- 向量检索参数调优
- API 响应缓存
- 流式输出

### 8.3 AI 调用优化
- Prompt 精简
- 模型智能选择
- 批量处理
- 结果缓存

---

## 9. 安全架构

### 9.1 数据安全
- 本地存储敏感数据
- API Key 环境变量管理
- 文件权限控制

### 9.2 API 安全
- 输入验证
- 文件上传限制
- Rate Limiting
- 错误信息脱敏

---

## 10. 监控与日志

### 10.1 日志策略
- 结构化日志
- 日志级别分类
- 错误追踪
- 性能指标记录

### 10.2 监控指标
- API 响应时间
- Token 使用量
- 成本追踪
- 错误率统计

---

## 11. 总结

本架构设计文档提供了 ArchMind AI 的完整技术架构方案，包括：

1. **清晰的分层架构** - UI 层、API 层、业务逻辑层、数据层
2. **模块化设计** - RAG 引擎、多模型服务、PRD 生成引擎
3. **渐进式开发路线** - 三个阶段，每个阶段目标明确
4. **技术栈选型** - 基于 Nuxt 3 的现代化全栈方案
5. **可扩展性** - 统一接口，便于未来扩展

**关键设计原则：**
- 本地优先，保护隐私
- 简单实用，避免过度设计
- 模块化，便于维护和扩展
- 成本可控，优先开源方案

---

**文档维护：**
- 本文档描述系统整体架构和技术选型
- 具体实现细节请参考《详细设计文档》
- 重大架构变更需要更新本文档
