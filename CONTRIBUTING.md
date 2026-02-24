# 贡献指南

感谢你考虑为 ArchMind AI 做出贡献！

---

## 目录

- [行为准则](#行为准则)
- [如何贡献](#如何贡献)
- [开发环境搭建](#开发环境搭建)
- [代码规范](#代码规范)
- [提交规范](#提交规范)
- [Pull Request 流程](#pull-request-流程)
- [项目结构](#项目结构)
- [测试规范](#测试规范)
- [文档规范](#文档规范)

---

## 行为准则

### 我们的承诺

为了营造一个开放和友好的环境，我们承诺：
- 使用包容性语言
- 尊重不同的观点和经验
- 优雅地接受建设性批评
- 关注对社区最有利的事情

### 不可接受的行为

- 使用性化的语言或图像
- 侮辱性/贬损性评论和人身攻击
- 公开或私下的骚扰
- 未经许可发布他人的私人信息

---

## 如何贡献

### 报告 Bug

如果你发现了 Bug，请创建一个 [Issue](https://github.com/your-org/archmind/issues)，包含：

1. **Bug 描述**: 清晰简洁地描述问题
2. **复现步骤**: 详细的复现步骤
3. **预期行为**: 你期望发生什么
4. **实际行为**: 实际发生了什么
5. **截图**: 如果适用，添加截图
6. **环境信息**:
   - 操作系统
   - Node.js 版本
   - 浏览器版本

**Bug 报告模板:**

```markdown
## Bug 描述
[简洁描述问题]

## 复现步骤
1. 进入 '...'
2. 点击 '...'
3. 滚动到 '...'
4. 看到错误

## 预期行为
[描述你期望发生什么]

## 实际行为
[描述实际发生了什么]

## 截图
[如果适用，添加截图]

## 环境信息
- OS: [e.g. macOS 14.0]
- Node.js: [e.g. 20.10.0]
- Browser: [e.g. Chrome 120]
- ArchMind Version: [e.g. 1.0.0]
```

### 建议新功能

我们欢迎新功能建议！请创建一个 [Issue](https://github.com/your-org/archmind/issues)，包含：

1. **功能描述**: 清晰描述你想要的功能
2. **使用场景**: 这个功能解决什么问题
3. **建议方案**: 如果有想法，描述实现方式

**功能请求模板:**

```markdown
## 功能描述
[清晰简洁地描述你想要的功能]

## 问题背景
[描述这个功能要解决的问题]

## 建议方案
[描述你建议的实现方式]

## 替代方案
[描述你考虑过的替代方案]

## 附加信息
[任何其他相关信息或截图]
```

### 贡献代码

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'feat: add amazing feature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

---

## 开发环境搭建

### 环境要求

| 依赖 | 版本 | 安装方式 |
|------|------|----------|
| Node.js | >= 18 | `nvm install 20` |
| pnpm | >= 8 | `npm install -g pnpm` |
| PostgreSQL | >= 14 | Docker 或本地安装 |
| Docker | 最新 | [官网下载](https://www.docker.com/) |

### 初始化项目

```bash
# 1. Fork 并克隆
git clone https://github.com/<your-username>/archmind.git
cd archmind

# 2. 安装依赖
pnpm install

# 3. 配置环境变量
cp .env.example .env
# 编辑 .env 文件

# 4. 初始化数据库
pnpm db:init

# 5. 启动开发服务器
pnpm dev
```

### IDE 配置

推荐使用 VS Code，并安装以下扩展：

- [Vue - Official](https://marketplace.visualstudio.com/items?itemName=Vue.volar)
- [TypeScript Vue Plugin (Volar)](https://marketplace.visualstudio.com/items?itemName=Vue.vscode-typescript-vue-plugin)
- [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint)
- [Tailwind CSS IntelliSense](https://marketplace.visualstudio.com/items?itemName=bradlc.vscode-tailwindcss)
- [Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)

**settings.json 配置:**

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit"
  },
  "[vue]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[typescript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  }
}
```

---

## 代码规范

### TypeScript 规范

```typescript
// ✅ 推荐: 使用 interface 定义对象类型
interface User {
  id: string
  name: string
  email: string
}

// ✅ 推荐: 使用 type 定义联合类型或工具类型
type Status = 'pending' | 'processing' | 'completed' | 'error'
type Partial<T> = { [K in keyof T]?: T[K] }

// ✅ 推荐: 函数返回类型明确
function getUser(id: string): Promise<User | null> {
  return db.user.findUnique({ where: { id } })
}

// ✅ 推荐: 使用 async/await
async function fetchUser(id: string): Promise<User> {
  try {
    const user = await getUser(id)
    if (!user) throw new Error('User not found')
    return user
  } catch (error) {
    logger.error('Failed to fetch user', { id, error })
    throw error
  }
}

// ❌ 避免: any 类型
function process(data: any) { ... }  // 不要使用

// ✅ 推荐: 使用 unknown 并进行类型守卫
function process(data: unknown) {
  if (typeof data === 'string') {
    return data.toUpperCase()
  }
  throw new TypeError('Expected string')
}
```

### Vue 组件规范

```vue
<script setup lang="ts">
// 1. 导入（按类别分组）
import { ref, computed, onMounted } from 'vue'
import { useRouter } from '#imports'
import { Button } from '~/components/ui/button'
import { useAuthStore } from '~/stores/auth'

// 2. 类型定义
interface Props {
  title: string
  disabled?: boolean
}

interface Emits {
  (e: 'submit', value: string): void
  (e: 'cancel'): void
}

// 3. Props 和 Emits
const props = withDefaults(defineProps<Props>(), {
  disabled: false
})

const emit = defineEmits<Emits>()

// 4. 响应式状态
const isLoading = ref(false)
const inputValue = ref('')

// 5. 计算属性
const buttonText = computed(() =>
  isLoading.value ? '处理中...' : '提交'
)

// 6. 方法
async function handleSubmit() {
  if (props.disabled || isLoading.value) return

  isLoading.value = true
  try {
    emit('submit', inputValue.value)
  } finally {
    isLoading.value = false
  }
}

function handleCancel() {
  emit('cancel')
}

// 7. 生命周期
onMounted(() => {
  console.log('Component mounted')
})
</script>

<template>
  <div class="space-y-4">
    <h2 class="text-xl font-semibold">{{ title }}</h2>

    <Input
      v-model="inputValue"
      :disabled="disabled"
      placeholder="请输入内容"
    />

    <div class="flex gap-2">
      <Button
        :disabled="disabled || isLoading"
        @click="handleSubmit"
      >
        {{ buttonText }}
      </Button>

      <Button
        variant="outline"
        @click="handleCancel"
      >
        取消
      </Button>
    </div>
  </div>
</template>
```

### API 路由规范

```typescript
// server/api/documents/index.get.ts
import { z } from 'zod'
import { documentDAO } from '~/lib/db/dao/document-dao'

// 1. 定义验证 Schema
const QuerySchema = z.object({
  workspaceId: z.string().uuid('工作区 ID 格式错误'),
  status: z.enum(['pending', 'processing', 'completed', 'error']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20)
})

// 2. 定义响应类型
interface Response {
  success: boolean
  data: {
    items: Document[]
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

// 3. 导出处理函数
export default defineEventHandler(async (event): Promise<Response> => {
  // 3.1 验证输入
  const query = await getValidatedQuery(event, QuerySchema.parse)

  // 3.2 检查权限
  const userId = event.context.userId
  if (!userId) {
    throw createError({
      statusCode: 401,
      message: '未授权'
    })
  }

  // 3.3 检查工作区访问权限
  const hasAccess = await workspaceDAO.checkMember(
    query.workspaceId,
    userId
  )
  if (!hasAccess) {
    throw createError({
      statusCode: 403,
      message: '无权访问此工作区'
    })
  }

  // 3.4 执行业务逻辑
  const result = await documentDAO.findByWorkspace(
    query.workspaceId,
    query.page,
    query.limit,
    query.status
  )

  // 3.5 返回结果
  return {
    success: true,
    data: result
  }
})
```

### 命名规范

| 类型 | 规范 | 示例 |
|------|------|------|
| 文件名 | kebab-case | `document-list.vue`, `user-dao.ts` |
| 组件名 | PascalCase | `DocumentList`, `UserAvatar` |
| 变量/函数 | camelCase | `documentList`, `fetchUser` |
| 常量 | UPPER_SNAKE_CASE | `MAX_FILE_SIZE`, `API_BASE_URL` |
| 类型/接口 | PascalCase | `User`, `DocumentStatus` |
| CSS 类 | kebab-case | `.document-list`, `.user-avatar` |

---

## 提交规范

我们遵循 [Conventional Commits](https://www.conventionalcommits.org/) 规范。

### 提交格式

```
<type>(<scope>): <subject>

<body>

<footer>
```

### 类型 (type)

| 类型 | 描述 | 示例 |
|------|------|------|
| `feat` | 新功能 | `feat: add document version control` |
| `fix` | Bug 修复 | `fix: resolve file upload issue` |
| `docs` | 文档更新 | `docs: update API documentation` |
| `refactor` | 重构 | `refactor: extract document processor` |
| `test` | 测试 | `test: add unit tests for RAG module` |
| `chore` | 构建/工具 | `chore: update dependencies` |
| `style` | 代码格式 | `style: format code with prettier` |
| `perf` | 性能优化 | `perf: optimize vector search` |
| `ci` | CI 配置 | `ci: add GitHub Actions workflow` |

### 范围 (scope)

可选，表示影响的模块：

- `ai` - AI 模块
- `rag` - RAG 模块
- `prd` - PRD 模块
- `db` - 数据库
- `ui` - 前端组件
- `api` - API 路由

### 示例

```bash
# 新功能
feat(rag): add hybrid search support

Implement RRF fusion algorithm for combining keyword and vector search results.
Closes #123

# Bug 修复
fix(upload): resolve duplicate file detection

The SHA-256 hash was not being calculated correctly for large files.
Fixes #456

# 文档
docs(api): add OpenAPI specification

# 重构
refactor(ai): extract adapter interface

Create unified AIModelAdapter interface for all providers.
```

---

## Pull Request 流程

### PR 检查清单

在提交 PR 之前，请确保：

- [ ] 代码通过 ESLint 检查 (`pnpm lint`)
- [ ] 代码通过 TypeScript 类型检查 (`pnpm typecheck`)
- [ ] 所有测试通过 (`pnpm test`)
- [ ] 新功能有对应的测试
- [ ] 文档已更新（如适用）
- [ ] 提交信息符合规范

### PR 标题格式

PR 标题应遵循与提交信息相同的格式：

```
feat: add hybrid search support
fix: resolve file upload issue
docs: update API documentation
```

### PR 描述模板

```markdown
## 变更类型
- [ ] Bug 修复
- [ ] 新功能
- [ ] 重构
- [ ] 文档更新
- [ ] 其他: ___

## 变更描述
[清晰描述此 PR 的变更]

## 相关 Issue
Closes #___

## 测试
[描述如何测试这些变更]

## 截图
[如果适用，添加截图]

## 检查清单
- [ ] 代码通过 lint 检查
- [ ] 代码通过类型检查
- [ ] 测试通过
- [ ] 文档已更新
```

### 代码审查

所有 PR 都需要至少一位维护者的审查。审查时会关注：

1. **代码质量**: 是否符合项目规范
2. **测试覆盖**: 是否有足够的测试
3. **文档**: 文档是否完整
4. **性能**: 是否有性能问题
5. **安全**: 是否有安全隐患

---

## 项目结构

```
ArchMind/
├── pages/              # 页面组件 (Nuxt 文件路由)
├── server/             # 服务端代码
│   ├── api/           # API 路由
│   ├── middleware/    # 服务端中间件
│   └── utils/         # 服务端工具
├── components/         # Vue 组件
│   ├── ui/            # shadcn/ui 组件
│   └── ...            # 业务组件
├── composables/        # 组合式函数
├── stores/             # Pinia 状态管理
├── lib/                # 核心业务逻辑
│   ├── ai/            # AI 模块
│   ├── rag/           # RAG 模块
│   ├── prd/           # PRD 模块
│   ├── db/            # 数据库层
│   └── utils/         # 工具函数
├── types/              # TypeScript 类型
├── config/             # 配置文件
├── scripts/            # 脚本
├── tests/              # 测试文件
└── docs/               # 文档
```

### 目录职责

| 目录 | 职责 | 依赖方向 |
|------|------|----------|
| `pages/` | 页面路由 | → components, composables, stores |
| `components/` | UI 组件 | → composables, stores, lib |
| `composables/` | 组合式函数 | → lib, stores |
| `stores/` | 状态管理 | → lib |
| `lib/` | 业务逻辑 | → types, db |
| `server/` | 服务端 | → lib |
| `types/` | 类型定义 | 无依赖 |

---

## 测试规范

### 单元测试

使用 Vitest 编写单元测试：

```typescript
// tests/lib/ai/manager.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { ModelManager } from '~/lib/ai/manager'

describe('ModelManager', () => {
  let manager: ModelManager

  beforeEach(() => {
    manager = new ModelManager()
  })

  describe('getModel', () => {
    it('should return default model when no preference specified', () => {
      const model = manager.getModel()
      expect(model).toBeDefined()
      expect(model.name).toBe('glm-4')
    })

    it('should return preferred model for task type', () => {
      const model = manager.getModel({ taskType: 'prd_generation' })
      expect(['claude-3.5-sonnet', 'gpt-4o', 'glm-4']).toContain(model.name)
    })

    it('should fallback to next model when primary fails', async () => {
      // Mock primary model failure
      vi.spyOn(manager, 'tryModel').mockRejectedValueOnce(new Error('API Error'))

      const model = await manager.getModelWithFallback()
      expect(model.name).not.toBe('glm-4')
    })
  })
})
```

### 测试命名

```typescript
describe('功能模块或类名', () => {
  describe('方法名或功能点', () => {
    it('should ... when ...', () => {
      // 测试代码
    })
  })
})
```

### 测试覆盖

```bash
# 运行测试并查看覆盖率
pnpm test:coverage

# 覆盖率目标
# - Statements: >= 80%
# - Branches: >= 75%
# - Functions: >= 80%
# - Lines: >= 80%
```

---

## 文档规范

### 代码注释

```typescript
/**
 * AI 模型管理器
 * 管理多个 AI 模型适配器，提供模型选择、路由和缓存功能
 *
 * @example
 * ```typescript
 * const manager = new ModelManager()
 * const model = manager.getModel({ taskType: 'prd_generation' })
 * const result = await model.generateText('Hello')
 * ```
 */
export class ModelManager {
  /**
   * 获取适合的模型
   *
   * @param options - 模型选择选项
   * @param options.taskType - 任务类型
   * @returns AI 模型适配器
   */
  getModel(options?: ModelOptions): AIModelAdapter {
    // ...
  }
}
```

### README 更新

如果你的 PR 涉及以下变更，请更新 README：

- 新的 API 端点
- 新的环境变量
- 新的依赖
- 安装或配置流程变化

---

## 获取帮助

如果你有任何问题，可以：

1. 查看 [文档](./docs/)
2. 搜索 [Issues](https://github.com/your-org/archmind/issues)
3. 创建新的 [Discussion](https://github.com/your-org/archmind/discussions)

---

再次感谢你的贡献！

---

*最后更新: 2026-02-16*
