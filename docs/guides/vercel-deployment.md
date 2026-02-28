# Vercel 部署指南

> ArchMind AI 部署到 Vercel + Neon PostgreSQL 的完整指南

---

## 目录

- [架构概览](#架构概览)
- [前置准备](#前置准备)
- [方式一：CLI 手动部署](#方式一cli-手动部署)
- [方式二：GitHub CI/CD 自动部署](#方式二github-cicd-自动部署)
- [环境变量参考](#环境变量参考)
- [部署验证](#部署验证)
- [常见问题](#常见问题)

---

## 架构概览

```
GitHub Repo (push to main)
        │
        ├── GitHub Actions CI ──► lint → test → build → deploy
        │                                                  │
        ▼                                                  ▼
   Vercel (Nuxt 3 Serverless)  ◄───────────────────────────┘
        │
        ▼
   Neon PostgreSQL (pgvector, Serverless)
        │
        ▼
   AI API (GLM / OpenAI / Claude / DeepSeek ...)
```

**关键技术决策：**

- **Nuxt 3 + Nitro**：自动检测 `VERCEL` 环境变量，切换为 `vercel` preset（Serverless Functions）
- **Neon PostgreSQL**：Serverless 兼容的 PostgreSQL，原生支持 pgvector 向量扩展
- **连接池适配**：`lib/db/client.ts` 在 Serverless 环境自动使用小连接池（min:0, max:3）+ Neon SSL

---

## 前置准备

### 1. Neon 数据库（必须）

| 步骤 | 操作 |
|------|------|
| 1 | 注册 [neon.tech](https://neon.tech)（免费额度足够 MVP） |
| 2 | 创建项目，获取连接字符串 |
| 3 | 在 Neon SQL Editor 执行 `scripts/neon-init.sql` 初始化表结构 |

**连接字符串格式：**
```
postgresql://user:password@ep-xxx.region.aws.neon.tech/dbname?sslmode=require
```

也可以通过本地 `psql` 执行初始化：
```bash
psql "<NEON_CONNECTION_STRING>" -f scripts/neon-init.sql
```

### 2. 安全密钥（必须）

生成三组密钥：

```bash
# JWT 认证密钥
openssl rand -base64 32

# API Key 加密密钥
openssl rand -base64 32

# 数据加密密钥（32位 hex）
openssl rand -hex 16
```

### 3. AI API Key（至少一个）

| 提供商 | 环境变量 | 推荐场景 |
|--------|----------|----------|
| 智谱 AI | `GLM_API_KEY` | 默认模型，中文优化 |
| DeepSeek | `DEEPSEEK_API_KEY` | 代码任务 |
| OpenAI | `OPENAI_API_KEY` | 通用 + Embedding |
| Anthropic | `ANTHROPIC_API_KEY` | PRD 生成 |
| Google | `GOOGLE_API_KEY` | 大上下文 (200K) |

### 4. 账号准备

| 服务 | 用途 |
|------|------|
| [Vercel](https://vercel.com) 账号 | 应用托管 |
| [GitHub](https://github.com) 仓库 | 代码托管 + CI/CD |

---

## 方式一：CLI 手动部署

适用于首次部署、快速测试、无需 CI/CD 的场景。

### Step 1 — 安装 Vercel CLI

```bash
npm i -g vercel
```

### Step 2 — 登录

```bash
vercel login
```

### Step 3 — Link 项目

在项目根目录执行：

```bash
vercel link --yes --project archmind-ai
```

这会创建 `.vercel/project.json`，包含 `orgId` 和 `projectId`。

### Step 4 — 设置环境变量

```bash
# 必填：基础设施
echo '<NEON_CONNECTION_STRING>' | vercel env add DATABASE_URL production --yes
echo '<JWT_SECRET>' | vercel env add JWT_SECRET production --yes
echo '<ENCRYPTION_KEY>' | vercel env add ENCRYPTION_KEY production --yes
echo '<API_KEY_ENCRYPTION_SECRET>' | vercel env add API_KEY_ENCRYPTION_SECRET production --yes
echo 'https://archmind-ai.vercel.app' | vercel env add APP_URL production --yes
echo 'https://archmind-ai.vercel.app' | vercel env add BASE_URL production --yes

# AI Key（至少一个）
echo '<GLM_API_KEY>' | vercel env add GLM_API_KEY production --yes

# Anthropic（如使用 Claude 模型，支持自定义代理 baseUrl）
echo '<ANTHROPIC_API_KEY>' | vercel env add ANTHROPIC_API_KEY production --yes
echo '<ANTHROPIC_BASE_URL>' | vercel env add ANTHROPIC_BASE_URL production --yes

# 飞书开放平台（设计方案模块需要）
echo '<FEISHU_APP_ID>' | vercel env add FEISHU_APP_ID production --yes
echo '<FEISHU_APP_SECRET>' | vercel env add FEISHU_APP_SECRET production --yes

# 可选：默认模型参数
echo 'glm-4' | vercel env add DEFAULT_MODEL production --yes
echo '0.7' | vercel env add DEFAULT_TEMPERATURE production --yes
echo '8000' | vercel env add DEFAULT_MAX_TOKENS production --yes
```

验证环境变量：
```bash
vercel env ls production
```

### Step 5 — 部署

```bash
# 预览部署（不影响生产）
vercel

# 生产部署
vercel --prod
```

### Step 6 — 验证

```bash
curl https://archmind-ai.vercel.app/api/health
# 应返回: {"status":"ok","message":"ArchMind API 正在运行","timestamp":"..."}
```

---

## 方式二：GitHub CI/CD 自动部署

适用于团队协作、持续交付场景。每次 push 到 `main` 分支会自动执行：

```
lint → test → build → docker + vercel deploy
```

### Step 1 — 获取 Vercel 凭证

需要三个值：

| 凭证 | 获取方式 |
|------|----------|
| `VERCEL_TOKEN` | [vercel.com/account/tokens](https://vercel.com/account/tokens) → Create Token |
| `VERCEL_ORG_ID` | Link 后在 `.vercel/project.json` 中的 `orgId` |
| `VERCEL_PROJECT_ID` | Link 后在 `.vercel/project.json` 中的 `projectId` |

如果还没 link 项目，先执行方式一的 Step 3。

### Step 2 — 设置 GitHub Secrets

在 GitHub 仓库 → Settings → Secrets and variables → Actions → New repository secret：

```bash
# 或使用 gh CLI 批量设置：
gh secret set VERCEL_TOKEN -b "<VERCEL_TOKEN>" -R <owner>/<repo>
gh secret set VERCEL_ORG_ID -b "<VERCEL_ORG_ID>" -R <owner>/<repo>
gh secret set VERCEL_PROJECT_ID -b "<VERCEL_PROJECT_ID>" -R <owner>/<repo>
```

### Step 3 — 启用 GitHub Actions（Fork 仓库）

> **重要**：Fork 仓库默认不启用 Actions

1. 访问 `https://github.com/<owner>/<repo>/actions`
2. 点击 **"I understand my workflows, go ahead and enable them"**

### Step 4 — 触发部署

任何 push 到 `main` 分支都会自动触发完整 CI/CD：

```bash
git push origin main
```

### CI 流水线架构

```yaml
# .github/workflows/ci.yml 中的 job 依赖关系：

lint (ESLint + TypeScript)  ──┐
                              ├──► build ──┬──► docker (GHCR 镜像)
test (Vitest 292 tests)    ──┘             └──► deploy (Vercel 生产)
```

| Job | 说明 | 触发条件 |
|-----|------|----------|
| Lint & Type Check | ESLint + `nuxt typecheck` | 所有 push/PR |
| Unit Tests | Vitest + 覆盖率报告 | 所有 push/PR |
| Build | `nuxt build` 验证 | lint + test 通过后 |
| Docker Build | 构建并推送到 GHCR | 仅 `main` push |
| Deploy to Vercel | `vercel deploy --prod` | 仅 `main` push |

### 监控 CI 状态

```bash
# 查看最近运行
gh run list -R <owner>/<repo> --limit 5

# 查看运行详情
gh api repos/<owner>/<repo>/actions/runs/<run_id>/jobs \
  --jq '.jobs[] | "\(.name): \(.conclusion)"'

# 在浏览器中查看
open https://github.com/<owner>/<repo>/actions
```

---

## 环境变量参考

### Vercel 必填环境变量

| 变量 | 说明 | 示例 |
|------|------|------|
| `DATABASE_URL` | Neon PostgreSQL 连接字符串 | `postgresql://user:pass@ep-xxx.neon.tech/db?sslmode=require` |
| `JWT_SECRET` | JWT 签名密钥 | `openssl rand -base64 32` |
| `ENCRYPTION_KEY` | 数据加密密钥（32位 hex） | `openssl rand -hex 16` |
| `API_KEY_ENCRYPTION_SECRET` | API Key 加密密钥 | `openssl rand -base64 32` |
| `APP_URL` | 应用 URL | `https://archmind-ai.vercel.app` |
| `BASE_URL` | 基础 URL | `https://archmind-ai.vercel.app` |

### AI 模型环境变量（按需）

| 变量 | 提供商 | 说明 |
|------|--------|------|
| `GLM_API_KEY` | 智谱 AI | 默认模型，中文优化 |
| `OPENAI_API_KEY` | OpenAI | 通用 + Embedding |
| `ANTHROPIC_API_KEY` | Anthropic | PRD/设计方案生成 |
| `ANTHROPIC_BASE_URL` | Anthropic | 可选，自定义代理地址（如 `https://subus.imds.ai/`） |
| `GOOGLE_API_KEY` | Google AI | 大上下文 (200K) |
| `DEEPSEEK_API_KEY` | DeepSeek | 代码任务 |
| `DASHSCOPE_API_KEY` | 阿里通义千问 | 中文优化 |
| `BAIDU_API_KEY` | 百度文心一言 | 中文优化 |

### 飞书开放平台环境变量（设计方案模块）

| 变量 | 说明 |
|------|------|
| `FEISHU_APP_ID` | 飞书应用 App ID |
| `FEISHU_APP_SECRET` | 飞书应用 App Secret |

> 获取方式：[飞书开放平台](https://open.feishu.cn) → 创建自建应用 → 凭证与基本信息
> 所需权限：`docx:document:readonly`（文档读取）、`drive:drive:readonly`（云文档下载，用于图片）

### 可选环境变量

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `DEFAULT_MODEL` | `glm-4` | 默认 AI 模型 |
| `DEFAULT_TEMPERATURE` | `0.7` | 生成温度 |
| `DEFAULT_MAX_TOKENS` | `8000` | 最大 token 数 |
| `STORAGE_PROVIDER` | `huawei-obs` | 对象存储提供商 |
| `EMAIL_HOST` | `smtp.qq.com` | SMTP 服务器 |

### GitHub Secrets（CI/CD 用）

| Secret | 说明 |
|--------|------|
| `VERCEL_TOKEN` | Vercel API Token |
| `VERCEL_ORG_ID` | Vercel 组织/团队 ID |
| `VERCEL_PROJECT_ID` | Vercel 项目 ID |

> **注意**：CI/CD 方式部署时，应用运行时环境变量（如 `DATABASE_URL`、`ANTHROPIC_API_KEY`、`FEISHU_APP_ID` 等）**不需要**设置为 GitHub Secrets。它们应设置在 **Vercel 环境变量**中（通过 CLI 或 Vercel Dashboard）。GitHub Secrets 仅用于 CI workflow 中 `vercel deploy` 命令的认证。
>
> 简而言之：
> - **Vercel 环境变量**：应用运行时配置（数据库、AI Key、飞书凭证等）
> - **GitHub Secrets**：仅 `VERCEL_TOKEN` + `VERCEL_ORG_ID` + `VERCEL_PROJECT_ID`（CI 部署认证）

---

## 部署验证

### 健康检查

```bash
curl https://archmind-ai.vercel.app/api/health
```

预期响应：
```json
{
  "status": "ok",
  "message": "ArchMind API 正在运行",
  "timestamp": "2026-02-25T08:29:37.179Z"
}
```

### 数据库连接验证

注册一个测试用户，如果注册成功说明数据库连接正常。

### CI/CD 验证

```bash
# 查看最近 CI 运行结果
gh run list -R <owner>/<repo> --limit 1

# 预期输出：
# STATUS  TITLE           WORKFLOW  BRANCH  EVENT  ...
# ✓       ci: xxx         CI        main    push   ...
```

---

## 常见问题

### Q: Fork 仓库 push 后 CI 没有触发？

Fork 仓库首次需要手动启用 GitHub Actions：
1. 访问 `https://github.com/<owner>/<repo>/actions`
2. 点击绿色按钮启用

### Q: Vercel 部署时项目名称报错？

Vercel 项目名必须全小写，支持 `a-z`、`0-9`、`.`、`_`、`-`，不能包含 `---`。
使用 `--project` 参数指定合法名称：
```bash
vercel link --yes --project archmind-ai
```

### Q: 数据库连接失败？

检查：
1. `DATABASE_URL` 连接字符串是否正确（包含 `?sslmode=require`）
2. Neon 数据库是否已执行 `neon-init.sql` 初始化
3. Neon 项目是否处于活跃状态（免费版有自动休眠）

### Q: 如何更新环境变量？

```bash
# CLI 方式
vercel env rm <KEY> production --yes
echo '<NEW_VALUE>' | vercel env add <KEY> production --yes

# 或在 Vercel Dashboard → Project → Settings → Environment Variables 中修改
```

更新后需要重新部署才能生效：
```bash
vercel --prod
```

### Q: 本地环境变量备份在哪里？

`.env.vercel` 文件（仅保存在本地，已被 `.gitignore` 忽略）。

---

## 快速参考

### 最小部署清单

```
✅ Neon 数据库 + 执行 neon-init.sql
✅ JWT_SECRET + ENCRYPTION_KEY + API_KEY_ENCRYPTION_SECRET
✅ APP_URL + BASE_URL
✅ 至少一个 AI API Key（推荐 GLM_API_KEY 或 ANTHROPIC_API_KEY）
✅ 飞书凭证（FEISHU_APP_ID + FEISHU_APP_SECRET）— 设计方案模块需要
```

### 常用命令速查

```bash
# CLI 部署
vercel --prod                              # 生产部署
vercel env ls production                   # 列出环境变量
vercel logs archmind-ai --follow           # 查看实时日志

# CI/CD
gh run list -R owner/repo --limit 5        # 查看 CI 运行
gh secret set KEY -b "value" -R owner/repo # 设置 GitHub Secret

# 数据库
psql "<NEON_URL>" -f scripts/neon-init.sql # 初始化数据库
```

---

*最后更新: 2026-02-28*

 
