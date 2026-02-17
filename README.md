# ArchMind AI

> 基于 RAG 的企业级知识库管理与智能 PRD 生成系统

[![Nuxt](https://img.shields.io/badge/Nuxt-3.21-00DC82?logo=nuxt.js)](https://nuxt.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14+-4169E1?logo=postgresql)](https://www.postgresql.org/)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)

---

## 目录

- [项目简介](#项目简介)
- [核心特性](#核心特性)
- [技术架构](#技术架构)
- [项目结构](#项目结构)
- [快速开始](#快速开始)
- [配置说明](#配置说明)
- [API 参考](#api-参考)
- [开发指南](#开发指南)
- [部署指南](#部署指南)
- [文档导航](#文档导航)
- [贡献指南](#贡献指南)
- [致谢](#致谢)

---

## 项目简介

ArchMind AI 是一个本地运行的 MVP 工具，通过 RAG（检索增强生成）技术将历史文档转化为产品需求文档（PRD）和原型。系统采用企业级架构，支持多工作区、文档版本控制、混合搜索、多模型 AI 等高级功能。

**核心价值**: 让每一份历史文档都成为新功能的基础，消除产品迭代中的逻辑断层。

### 适用场景

- 产品经理快速生成 PRD 文档
- 技术团队知识库管理
- 项目文档版本追踪
- 智能文档检索与引用

---

## 核心特性

### 智能文档管理

| 功能 | 描述 |
|------|------|
| 多格式支持 | PDF、DOCX、Markdown |
| 版本控制 | 完整的文档版本历史管理 |
| 批量操作 | 并行批量上传，性能提升 6 倍 |
| 智能去重 | SHA-256 哈希自动检测重复 |
| 状态追踪 | 实时查看文档处理进度 |

### 混合搜索引擎

| 搜索模式 | 描述 |
|----------|------|
| 关键词搜索 | PostgreSQL 全文检索 (tsvector + GIN) |
| 向量检索 | 基于 embeddings 的语义搜索 |
| 混合搜索 | RRF 算法融合，召回率提升 20%+ |

### 多模型 AI 支持

| 提供商 | 模型 | 适用场景 |
|--------|------|----------|
| Anthropic | Claude 3.5 Sonnet | PRD 生成 |
| OpenAI | GPT-4o | 通用任务 |
| Google | Gemini 1.5 Pro | 大上下文 (200K) |
| 智谱 AI | GLM-4 | 中文优化 |
| 阿里云 | 通义千问 | 中文优化 |
| 百度 | 文心一言 | 中文优化 |
| DeepSeek | DeepSeek | 代码任务 |
| Ollama | 本地模型 | 隐私模式 |

### 对象存储

- **MinIO**: 本地开发与私有化部署
- **华为云 OBS**: 生产环境云存储
- **统一抽象**: 灵活切换存储后端

### 多工作区支持

- 独立的工作区隔离
- 工作区成员管理
- 工作区级别资源配置

---

## 技术架构

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend (Nuxt 3)                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐        │
│  │  Pages   │  │Components│  │Composables│  │  Stores  │        │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘        │
│       │             │             │             │                │
│       └─────────────┴─────────────┴─────────────┘                │
│                           │                                      │
│                    shadcn/ui + Tailwind CSS                      │
└───────────────────────────┬─────────────────────────────────────┘
                            │
┌───────────────────────────┴─────────────────────────────────────┐
│                      Server (Nuxt 3)                             │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    API Routes (91 files)                  │   │
│  │  /api/documents │ /api/prd │ /api/chat │ /api/workspace  │   │
│  └──────────────────────────────────────────────────────────┘   │
└───────────────────────────┬─────────────────────────────────────┘
                            │
┌───────────────────────────┴─────────────────────────────────────┐
│                      Core Libraries (lib/)                       │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐   │
│  │    AI      │ │    RAG     │ │    PRD     │ │     DB     │   │
│  │ Adapters   │ │  Engine    │ │ Generator  │ │    DAOs    │   │
│  └────────────┘ └────────────┘ └────────────┘ └────────────┘   │
└───────────────────────────┬─────────────────────────────────────┘
                            │
┌───────────────────────────┴─────────────────────────────────────┐
│                      Infrastructure                              │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐                   │
│  │ PostgreSQL │ │   MinIO    │ │  AI APIs   │                   │
│  │ + pgvector │ │   / OBS    │ │  Multi-LLM │                   │
│  └────────────┘ └────────────┘ └────────────┘                   │
└─────────────────────────────────────────────────────────────────┘
```

### 技术栈详情

| 层级 | 技术 | 版本 |
|------|------|------|
| 框架 | Nuxt 3 | ^3.21.0 |
| 语言 | TypeScript | ^5.9.3 |
| UI 组件 | shadcn/ui (Vue) | radix-vue ^1.9.17 |
| 样式 | Tailwind CSS | ^3.4.19 |
| 数据库 | PostgreSQL + pgvector | 14+ |
| ORM | Drizzle ORM | ^0.29.5 |
| 状态管理 | Pinia | ^2.3.1 |
| 表单验证 | VeeValidate + Zod | ^4.15.0 / ^3.25.0 |
| AI 框架 | LangChain.js | ^0.1.37 |
| 测试 | Vitest | ^4.0.18 |

---

## 项目结构

```
ArchMind/
├── pages/                    # Nuxt 3 页面（文件路由）
│   ├── index.vue            # 首页
│   ├── documents/           # 文档管理
│   ├── prd/                 # PRD 管理
│   ├── prototype/           # 原型预览
│   ├── workspace/           # 工作区
│   └── profile/             # 用户设置
│
├── server/                   # Nuxt 3 服务端
│   ├── api/                 # API 路由（91 个文件）
│   │   ├── documents/       # 文档管理 API
│   │   ├── prd/             # PRD 生成 API
│   │   ├── chat/            # 对话 API
│   │   ├── workspace/       # 工作区 API
│   │   └── auth/            # 认证 API
│   ├── middleware/          # 服务端中间件
│   └── utils/               # 服务端工具
│
├── components/               # Vue 组件（209 个）
│   ├── ui/                  # shadcn/ui 组件（30+）
│   ├── chat/                # 对话组件
│   ├── documents/           # 文档组件
│   ├── projects/            # 项目组件
│   ├── prototype/           # 原型组件
│   ├── logic-map/           # 逻辑图组件
│   └── common/              # 通用组件
│
├── composables/              # Vue Composables（8 个）
│   ├── useAuth.ts           # 认证逻辑
│   ├── useDocuments.ts      # 文档操作
│   ├── useAiModels.ts       # AI 模型
│   └── useWorkspace.ts      # 工作区
│
├── stores/                   # Pinia 状态管理（3 个）
│   ├── auth.ts              # 认证状态
│   ├── workspace.ts         # 工作区状态
│   └── sidebar.ts           # 侧边栏状态
│
├── lib/                      # 核心业务逻辑
│   ├── ai/                  # AI 服务层
│   │   ├── adapters/        # 模型适配器（8 个）
│   │   ├── manager.ts       # 模型管理器
│   │   └── config.ts        # 配置解析
│   ├── rag/                 # RAG 检索引擎
│   │   ├── document-processor.ts
│   │   ├── text-splitter.ts
│   │   ├── embeddings.ts
│   │   └── retriever.ts
│   ├── prd/                 # PRD 生成引擎
│   │   ├── generator.ts
│   │   ├── validator.ts
│   │   └── templates/
│   ├── prototype/           # 原型生成
│   ├── logic-map/           # 逻辑图
│   ├── db/                  # 数据库层
│   │   ├── schema.ts        # 表结构定义
│   │   └── dao/             # 数据访问层（15 个）
│   ├── storage/             # 对象存储
│   │   ├── minio.ts         # MinIO 适配器
│   │   └── huawei-obs.ts    # 华为云 OBS
│   ├── auth/                # 认证逻辑
│   ├── chat/                # 对话引擎
│   └── utils/               # 工具函数
│
├── types/                    # TypeScript 类型定义（14 个）
│   ├── ai.ts                # AI 相关类型
│   ├── document.ts          # 文档类型
│   ├── prd.ts               # PRD 类型
│   └── api.ts               # API 类型
│
├── config/                   # YAML 配置文件
│   └── ai-models.yaml       # AI 模型配置
│
├── migrations/               # 数据库迁移
│   └── 0001_initial.sql
│
├── scripts/                  # 工具脚本（20 个）
│   ├── db-init.ts           # 数据库初始化
│   └── test-*.sh            # 测试脚本
│
├── tests/                    # 测试文件（9 个）
│   ├── unit/                # 单元测试
│   └── lib/                 # 库测试
│
├── docs/                     # 项目文档
│   ├── api/                 # API 文档
│   ├── architecture/        # 架构文档
│   └── guides/              # 使用指南
│
├── nuxt.config.ts           # Nuxt 配置
├── vitest.config.ts         # Vitest 配置
├── tailwind.config.ts       # Tailwind 配置
└── package.json             # 项目配置
```

---

## 快速开始

### 环境要求

| 依赖 | 版本 | 说明 |
|------|------|------|
| Node.js | >= 18 | 运行环境 |
| pnpm | >= 8 | 包管理器 |
| PostgreSQL | >= 14 | 数据库（需安装 pgvector 扩展） |
| Docker | 最新版 | 用于 MinIO 本地存储 |

### 安装步骤

```bash
# 1. 克隆项目
git clone https://github.com/your-org/archmind.git
cd archmind

# 2. 安装依赖
pnpm install

# 3. 配置环境变量
cp .env.example .env
# 编辑 .env，填写必要配置

# 4. 启动 MinIO（本地开发）
docker-compose -f docker-compose.minio.yml up -d

# 5. 初始化数据库
pnpm db:init
pnpm tsx scripts/add-fulltext-search.ts
pnpm tsx scripts/add-version-control.ts

# 6. 启动开发服务器
pnpm dev
```

访问 http://localhost:3000

### 验证安装

```bash
# 运行验证脚本
bash scripts/test-phase6.sh
```

---

## 配置说明

### 环境变量

```bash
# ==================== 数据库配置 ====================
DATABASE_URL=postgresql://user:pass@localhost:5432/archmind
DATABASE_POOL_MIN=2
DATABASE_POOL_MAX=10

# ==================== 存储配置 ====================
# 存储提供商: minio (本地) / huawei-obs (生产)
STORAGE_PROVIDER=minio

# MinIO 配置 (本地开发)
MINIO_ENDPOINT=localhost:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin123
MINIO_USE_SSL=false
MINIO_BUCKET_NAME=archmind

# 华为云 OBS 配置 (生产环境)
HUAWEI_OBS_REGION=cn-north-4
HUAWEI_OBS_ACCESS_KEY=your-access-key
HUAWEI_OBS_SECRET_KEY=your-secret-key
HUAWEI_OBS_BUCKET_NAME=archmind

# ==================== AI 模型配置 ====================
# Anthropic Claude
ANTHROPIC_API_KEY=your-anthropic-key

# OpenAI GPT
OPENAI_API_KEY=your-openai-key

# Google Gemini
GOOGLE_API_KEY=your-google-key

# 智谱 AI GLM
GLM_API_KEY=your-glm-key

# 阿里云通义千问
DASHSCOPE_API_KEY=your-dashscope-key

# 百度文心一言
BAIDU_API_KEY=your-baidu-key
BAIDU_SECRET_KEY=your-baidu-secret

# DeepSeek
DEEPSEEK_API_KEY=your-deepseek-key

# Ollama (本地模型)
OLLAMA_BASE_URL=http://localhost:11434

# ==================== RAG 配置 ====================
EMBEDDING_MODEL=text-embedding-3-small
CHUNK_SIZE=1000
CHUNK_OVERLAP=200
TOP_K=5
SIMILARITY_THRESHOLD=0.7

# ==================== AI 默认配置 ====================
DEFAULT_MODEL=glm-4
DEFAULT_TEMPERATURE=0.7
DEFAULT_MAX_TOKENS=8000

# ==================== 安全配置 ====================
JWT_SECRET=your-jwt-secret-key
ENCRYPTION_KEY=your-32-char-encryption-key

# ==================== 应用配置 ====================
APP_URL=http://localhost:3000
NODE_ENV=development
```

### AI 模型配置

编辑 `config/ai-models.yaml`:

```yaml
ai_models:
  default: glm-4
  fallback: [glm-4.5-air, gpt-4o, claude-3.5-sonnet]
  preferences:
    prd_generation: [claude-3.5-sonnet, gpt-4o, glm-4]
    chinese_content: [glm-4, qwen-max, wenxin-4.0]
    code_tasks: [gpt-4o, deepseek-chat]
    large_context: [gemini-1.5-pro]

embedding:
  provider: openai
  model: text-embedding-3-small
  dimensions: 1536

generation:
  temperature: 0.7
  max_tokens: 8000
  stream: true
```

---

## API 参考

### 文档管理

```bash
# 上传文档
POST /api/documents/upload
Content-Type: multipart/form-data
file: <binary>

# 批量上传
POST /api/documents/batch-upload
Content-Type: multipart/form-data
files[]: <binary[]>

# 获取文档列表
GET /api/documents?workspaceId=xxx&status=completed

# 获取文档详情
GET /api/documents/:id

# 更新文档
PATCH /api/documents/:id
{
  "title": "新标题",
  "tags": ["标签1", "标签2"]
}

# 删除文档
DELETE /api/documents/:id

# 下载文档
GET /api/documents/:id/download

# 导出文档
POST /api/documents/export
{
  "documentIds": ["id1", "id2"]
}
```

### 搜索

```bash
# 混合搜索
POST /api/documents/search
{
  "query": "用户认证流程",
  "mode": "hybrid",        # keyword / vector / hybrid
  "topK": 5,
  "keywordWeight": 0.3,
  "vectorWeight": 0.7
}
```

### 版本控制

```bash
# 创建版本
POST /api/documents/:id/versions
{
  "description": "版本说明"
}

# 获取版本历史
GET /api/documents/:id/versions

# 下载特定版本
GET /api/documents/:id/versions/:version/download
```

### PRD 生成

```bash
# 生成 PRD
POST /api/prd
{
  "userInput": "设计一个用户登录功能",
  "documentIds": ["doc1", "doc2"]
}

# 流式生成
POST /api/prd/stream
{
  "userInput": "...",
  "stream": true
}
```

### 对话

```bash
# 发送消息
POST /api/chat
{
  "conversationId": "xxx",
  "message": "请帮我分析这份文档"
}

# 流式对话
POST /api/chat/stream
{
  "conversationId": "xxx",
  "message": "..."
}
```

---

## 开发指南

### 开发命令

```bash
# 开发
pnpm dev              # 启动开发服务器
pnpm build            # 构建生产版本
pnpm preview          # 预览生产构建

# 代码质量
pnpm lint             # ESLint 检查
pnpm lint:fix         # 自动修复
pnpm typecheck        # TypeScript 类型检查

# 测试
pnpm test             # 运行测试
pnpm test:coverage    # 测试覆盖率
pnpm test:watch       # 监听模式

# 数据库
pnpm db:init          # 初始化数据库
pnpm db:seed          # 添加测试数据
pnpm db:generate      # 生成迁移文件
```

### 代码规范

#### 目录约定

- `pages/` - 页面组件，遵循 Nuxt 3 文件路由
- `components/` - 可复用组件
- `composables/` - 组合式函数
- `lib/` - 核心业务逻辑（与框架无关）
- `server/` - 服务端代码
- `types/` - TypeScript 类型定义

#### 组件规范

```vue
<script setup lang="ts">
// 1. 导入
import { ref, computed } from 'vue'
import { Button } from '~/components/ui/button'

// 2. Props/Emits
interface Props {
  title: string
  disabled?: boolean
}
const props = withDefaults(defineProps<Props>(), {
  disabled: false
})

// 3. 响应式状态
const isLoading = ref(false)

// 4. 计算属性
const buttonText = computed(() =>
  isLoading.value ? '处理中...' : '提交'
)

// 5. 方法
async function handleSubmit() {
  isLoading.value = true
  // ...
  isLoading.value = false
}
</script>

<template>
  <Button :disabled="disabled" @click="handleSubmit">
    {{ buttonText }}
  </Button>
</template>
```

#### API 路由规范

```typescript
// server/api/documents/index.get.ts
import { z } from 'zod'
import { documentDAO } from '~/lib/db/dao/document-dao'

const QuerySchema = z.object({
  workspaceId: z.string().uuid(),
  status: z.enum(['pending', 'processing', 'completed', 'error']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20)
})

export default defineEventHandler(async (event) => {
  // 1. 验证输入
  const query = await getValidatedQuery(event, QuerySchema.parse)

  // 2. 检查权限
  const userId = event.context.userId
  if (!userId) {
    throw createError({
      statusCode: 401,
      message: '未授权'
    })
  }

  // 3. 执行业务逻辑
  const result = await documentDAO.findByWorkspace(
    query.workspaceId,
    query.page,
    query.limit
  )

  // 4. 返回结果
  return result
})
```

---

## 部署指南

### Docker 部署

```bash
# 构建镜像
docker build -t archmind:latest .

# 运行容器
docker run -d \
  --name archmind \
  -p 3000:3000 \
  -e DATABASE_URL=postgresql://... \
  -e STORAGE_PROVIDER=huawei-obs \
  archmind:latest
```

### PM2 部署

```bash
# 安装 PM2
npm install -g pm2

# 启动
pm2 start ecosystem.config.js

# 查看日志
pm2 logs archmind

# 重启
pm2 restart archmind
```

### 生产环境配置

```bash
# 1. 使用华为云 OBS
STORAGE_PROVIDER=huawei-obs

# 2. 配置数据库连接池
DATABASE_POOL_MIN=5
DATABASE_POOL_MAX=20

# 3. 启用生产模式
NODE_ENV=production

# 4. 构建并启动
pnpm build
pnpm start
```

---

## 文档导航

### 核心文档

| 文档 | 描述 |
|------|------|
| [CLAUDE.md](./CLAUDE.md) | AI 开发助手指南 |
| [PROJECT-COMPLETE-SUMMARY.md](./docs/PROJECT-COMPLETE-SUMMARY.md) | 项目完整总结 |
| [技术路线与架构文档.md](./docs/技术路线与架构文档.md) | 技术架构详解 |

### 设计文档

| 文档 | 描述 |
|------|------|
| [产品需求文档](./docs/ArchMind%20AI%20产品需求文档%20(PRD).md) | 产品 PRD |
| [架构设计文档.md](./docs/架构设计文档.md) | 架构设计 |
| [详细设计/](./docs/详细设计/) | 模块详细设计 |

### Phase 实施文档

| 文档 | 描述 |
|------|------|
| [PHASE-2-SUMMARY.md](./docs/PHASE-2-SUMMARY.md) | 文件上传重构 |
| [PHASE-3-SUMMARY.md](./docs/PHASE-3-SUMMARY.md) | 状态追踪 |
| [PHASE-4-SUMMARY.md](./docs/PHASE-4-SUMMARY.md) | 标签与分类 |
| [PHASE-5-SUMMARY.md](./docs/PHASE-5-SUMMARY.md) | 混合搜索 |
| [PHASE-6-SUMMARY.md](./docs/PHASE-6-SUMMARY.md) | 版本控制 |

### 组件与样式

| 文档 | 描述 |
|------|------|
| [SHADCN_DESIGN_STANDARDS.md](./docs/SHADCN_DESIGN_STANDARDS.md) | UI 设计规范 |
| [SHADCN_USAGE.md](./docs/SHADCN_USAGE.md) | 组件使用指南 |

### 部署与集成

| 文档 | 描述 |
|------|------|
| [HUAWEI-OBS-SUMMARY.md](./docs/HUAWEI-OBS-SUMMARY.md) | 华为云 OBS 适配 |
| [GLM_INTEGRATION.md](./docs/GLM_INTEGRATION.md) | 智谱 AI 集成 |
| [I18N.md](./docs/I18N.md) | 国际化指南 |

---

## 贡献指南

欢迎贡献代码、报告 Bug 或提出新功能建议！

### 开发流程

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'feat: add amazing feature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

### 提交规范

遵循 [Conventional Commits](https://www.conventionalcommits.org/)：

| 类型 | 描述 |
|------|------|
| `feat` | 新功能 |
| `fix` | Bug 修复 |
| `docs` | 文档更新 |
| `refactor` | 重构（不添加功能或修复 bug） |
| `test` | 测试相关 |
| `chore` | 构建/工具/依赖更新 |
| `style` | 代码格式（不影响功能） |
| `perf` | 性能优化 |

### 代码审查标准

- 代码符合项目规范
- 有适当的测试覆盖
- 文档已更新
- 无 TypeScript 错误
- 无 ESLint 警告

---

## 性能指标

| 指标 | 数值 |
|------|------|
| 批量上传 | 10 个文件 (5MB 每个) - **8 秒** |
| 混合搜索 | 1000 文档 - **< 2 秒** |
| 准确率提升 | 混合搜索相比单一模式 - **+20%** |

---

## 安全说明

- 已实现基于 JWT 的用户认证
- 密码使用 bcrypt 加密存储
- 用户 API Key 使用 AES 加密
- 预签名 URL 限时有效（1 小时）

---

## 致谢

- [Nuxt 3](https://nuxt.com/) - Vue.js 框架
- [shadcn/ui](https://ui.shadcn.com/) - UI 组件库
- [LangChain.js](https://js.langchain.com/) - AI 应用框架
- [PostgreSQL](https://www.postgresql.org/) - 数据库
- [MinIO](https://min.io/) - 对象存储

---

## License

[MIT](LICENSE)

---

<p align="center">
  Made with ❤️ by ArchMind Team
</p>
