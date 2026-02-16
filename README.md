# ArchMind AI

基于 RAG 的企业级知识库管理与 PRD 生成系统

## 项目简介

ArchMind AI 是一个功能完整的知识库管理系统,通过 RAG (检索增强生成) 技术,将历史文档转化为产品需求文档 (PRD) 的智能助手。系统采用企业级架构,支持文档版本控制、混合搜索、批量操作等高级功能。

## ✨ 核心特性

### 🗂️ 智能文档管理
- 📤 **多格式上传** - 支持 PDF、DOCX、Markdown
- 🔄 **版本控制** - 完整的文档版本历史管理
- 📦 **批量操作** - 并行批量上传,性能提升 6 倍
- 🔍 **智能去重** - SHA-256 哈希自动检测重复文档
- 📊 **状态追踪** - 实时查看文档处理进度

### 🔎 混合搜索引擎
- 🎯 **关键词搜索** - PostgreSQL 全文检索 (tsvector + GIN)
- 🧠 **向量检索** - 基于 embeddings 的语义搜索
- 🔀 **混合搜索** - RRF 算法融合,召回率提升 20%+
- ⚙️ **可调权重** - 灵活配置关键词与向量权重

### 🏷️ 组织与分类
- 🏷️ **标签系统** - 多标签支持,自定义颜色
- 📁 **分类树** - 树形分类结构,预设常用分类
- 🔗 **引用关系** - 文档-PRD 双向引用追踪
- 📈 **使用统计** - 标签使用次数自动统计

### 🤖 多模型 AI 支持
- 🎨 **PRD 生成** - Claude 3.5 Sonnet
- 🌏 **中文优化** - 通义千问、文心一言
- 🚀 **大上下文** - Gemini 1.5 Pro (200K tokens)
- 🔒 **隐私模式** - Ollama 本地模型

### ☁️ 对象存储
- 🗄️ **MinIO** - 本地开发与私有化部署
- ☁️ **华为云 OBS** - 生产环境云存储
- 🔀 **统一抽象** - 灵活切换存储后端
- 📦 **自动过期** - 临时文件 7 天自动删除

### 📊 企业级功能
- 📤 **批量导出** - ZIP 格式,含元数据和清单
- 🔐 **预签名 URL** - 安全的文件下载 (1 小时有效)
- 📝 **处理日志** - 分阶段日志记录
- 🔄 **重试机制** - 失败自动重试

## 🏗️ 技术架构

- **前端**: Nuxt 3 + TypeScript 5.x + Tailwind CSS
- **UI 组件**: shadcn/ui (Vue)
- **数据库**: PostgreSQL 14+ + pgvector
- **对象存储**: MinIO / 华为云 OBS
- **AI 集成**: LangChain.js + 多模型适配器
- **Embedding**: OpenAI text-embedding-3-small
- **全文检索**: PostgreSQL tsvector + GIN 索引
- **状态管理**: Pinia
- **表单验证**: VeeValidate + Zod

## 🚀 快速开始

### 环境要求

- Node.js >= 18
- PostgreSQL >= 14 (with pgvector extension)
- Docker (用于 MinIO)
- pnpm >= 8

### 1. 安装依赖

```bash
pnpm install
```

### 2. 配置环境变量

```bash
cp .env.example .env
# 编辑 .env,填写以下必要配置:
# - DATABASE_URL: PostgreSQL 连接字符串
# - GLM_API_KEY / OPENAI_API_KEY: AI 模型 API Key
# - STORAGE_PROVIDER: minio (本地) / huawei-obs (生产)
```

### 3. 启动 MinIO (本地开发)

```bash
docker-compose -f docker-compose.minio.yml up -d
```

### 4. 初始化数据库

```bash
pnpm db:init
pnpm tsx scripts/add-fulltext-search.ts
pnpm tsx scripts/add-version-control.ts
```

### 5. 启动开发服务器

```bash
pnpm dev
```

访问: http://localhost:3000

### 6. 验证安装 (可选)

```bash
bash scripts/test-phase6.sh
```

访问 [http://localhost:3000](http://localhost:3000)

## 项目结构

```
ArchMind/
├── pages/                  # Nuxt 3 页面（文件路由）
├── server/                 # Nuxt 3 服务端（API 路由）
├── components/             # Vue 组件
├── layouts/                # Nuxt 布局
├── composables/            # Vue Composables
├── stores/                 # Pinia 状态管理
├── lib/                    # 核心业务逻辑
│   ├── ai/                # AI 服务层
│   ├── rag/               # RAG 检索引擎
│   ├── prd/               # PRD 生成引擎
│   └── db/                # 数据库
├── types/                  # TypeScript 类型
├── config/                 # 配置文件
└── scripts/                # 脚本
```

## 开发命令

```bash
pnpm dev        # 启动开发服务器
pnpm build      # 构建生产版本
pnpm generate   # 生成静态站点
pnpm preview    # 预览生产构建
pnpm lint       # 代码检查
pnpm db:init    # 初始化数据库
pnpm db:seed    # 添加测试数据
```

## 📚 文档

### 系统文档
- [项目完整总结](./docs/PROJECT-COMPLETE-SUMMARY.md) - **推荐首先阅读**
- [产品需求文档 (PRD)](./docs/ArchMind%20AI%20产品需求文档%20(PRD).md)
- [技术路线与架构文档](./docs/技术路线与架构文档.md)

### Phase 实施文档
- [Phase 1: MinIO 部署](./docs/PHASE-1-SUMMARY.md)
- [Phase 2: 文件上传重构](./docs/PHASE-2-SUMMARY.md)
- [Phase 3: 状态追踪](./docs/PHASE-3-SUMMARY.md)
- [Phase 4: 标签与分类](./docs/PHASE-4-SUMMARY.md)
- [Phase 5: 混合搜索](./docs/PHASE-5-SUMMARY.md)
- [Phase 6: 版本控制](./docs/PHASE-6-SUMMARY.md)

### 其他
- [华为云 OBS 适配器](./docs/HUAWEI-OBS-SUMMARY.md)

## 📖 API 参考

### 文档管理
```bash
# 上传文档
POST /api/documents/upload

# 批量上传
POST /api/documents/batch-upload

# 查询文档列表
GET /api/documents

# 下载文档
GET /api/documents/:id/download

# 导出文档
POST /api/documents/export
```

### 版本控制
```bash
# 创建版本
POST /api/documents/:id/versions

# 版本历史
GET /api/documents/:id/versions

# 下载特定版本
GET /api/documents/:id/versions/:version/download
```

### 搜索与检索
```bash
# 混合搜索
POST /api/documents/search
{
  "query": "用户认证",
  "mode": "hybrid",  // keyword / vector / hybrid
  "topK": 5,
  "keywordWeight": 0.3,
  "vectorWeight": 0.7
}
```

### 去重管理
```bash
# 查询重复文档
GET /api/documents/duplicates

# 清理重复文档
POST /api/documents/duplicates/cleanup
```

完整 API 文档请查看 [PROJECT-COMPLETE-SUMMARY.md](./docs/PROJECT-COMPLETE-SUMMARY.md)

## 🎯 使用示例

### 1. 上传文档到知识库

```bash
curl -X POST http://localhost:3000/api/documents/upload \
  -F "file=@技术文档.pdf"
```

### 2. 搜索相关文档

```bash
curl -X POST http://localhost:3000/api/documents/search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "用户登录流程",
    "mode": "hybrid",
    "topK": 5
  }'
```

### 3. 基于知识库生成 PRD

```bash
curl -X POST http://localhost:3000/api/prd \
  -H "Content-Type: application/json" \
  -d '{
    "userInput": "设计一个用户登录功能,支持手机号和邮箱登录"
  }'
```

### 4. 批量上传文档

```bash
curl -X POST http://localhost:3000/api/documents/batch-upload \
  -F "files=@doc1.pdf" \
  -F "files=@doc2.docx" \
  -F "files=@doc3.md"
```

### 5. 查看重复文档并清理

```bash
# 查询重复
curl http://localhost:3000/api/documents/duplicates

# 清理重复(保留最早的)
curl -X POST http://localhost:3000/api/documents/duplicates/cleanup \
  -H "Content-Type: application/json" \
  -d '{"keepOldest": true}'
```

## 🔧 配置说明

### 环境变量

```bash
# 数据库
DATABASE_URL=postgresql://user:pass@localhost:5432/archmind

# 存储提供商 (minio / huawei-obs)
STORAGE_PROVIDER=minio

# MinIO 配置 (本地开发)
MINIO_ENDPOINT=localhost:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin123
MINIO_USE_SSL=false

# 华为云 OBS 配置 (生产环境)
HUAWEI_OBS_REGION=cn-north-4
HUAWEI_OBS_ACCESS_KEY=your-key
HUAWEI_OBS_SECRET_KEY=your-secret

# AI 模型 API Keys
ANTHROPIC_API_KEY=your-key      # Claude
OPENAI_API_KEY=your-key         # GPT-4
GOOGLE_API_KEY=your-key         # Gemini
GLM_API_KEY=your-key            # 智谱 AI
DASHSCOPE_API_KEY=your-key      # 通义千问
BAIDU_API_KEY=your-key          # 文心一言
DEEPSEEK_API_KEY=your-key       # DeepSeek

# Ollama (本地模型)
OLLAMA_BASE_URL=http://localhost:11434
```

### 模型配置

编辑 `config/ai-models.yaml`:

```yaml
ai_models:
  default: claude-3.5-sonnet
  fallback: [gpt-4o, qwen-max]
  preferences:
    prd_generation: [claude-3.5-sonnet, gpt-4o]
    chinese_content: [qwen-max, wenxin-4.0]
```

## 🚀 生产部署

### 使用华为云 OBS

```bash
# 1. 修改 .env
STORAGE_PROVIDER=huawei-obs
HUAWEI_OBS_REGION=cn-north-4
HUAWEI_OBS_ACCESS_KEY=your-key
HUAWEI_OBS_SECRET_KEY=your-secret

# 2. 构建
pnpm build

# 3. 启动
pnpm start
```

### 使用 PM2 部署

```bash
# 安装 PM2
npm install -g pm2

# 启动应用
pm2 start ecosystem.config.js

# 查看日志
pm2 logs archmind

# 重启
pm2 restart archmind
```

## 🤝 贡献指南

欢迎贡献代码、报告 Bug 或提出新功能建议!

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'feat: Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

### 提交规范

```
feat: 新功能
fix: 修复 bug
docs: 文档更新
refactor: 重构
test: 测试
chore: 构建/工具
```

## 📊 性能指标

- **批量上传**: 10 个文件 (5MB 每个) - **8 秒** (并行处理)
- **混合搜索**: 1000 文档 - **< 2 秒**
- **准确率提升**: 混合搜索相比单一模式 - **+20%**

## 🔒 安全说明

- ⚠️ 当前版本未实现用户认证,仅用于内部测试
- 生产环境请添加认证中间件
- 敏感数据请使用环境变量,不要提交到版本控制

## 🎉 致谢

- [Nuxt 3](https://nuxt.com/) - Vue.js 框架
- [shadcn/ui](https://ui.shadcn.com/) - UI 组件库
- [LangChain.js](https://js.langchain.com/) - AI 应用框架
- [PostgreSQL](https://www.postgresql.org/) - 数据库
- [MinIO](https://min.io/) - 对象存储
- [Anthropic](https://www.anthropic.com/) - Claude AI

## License

MIT
