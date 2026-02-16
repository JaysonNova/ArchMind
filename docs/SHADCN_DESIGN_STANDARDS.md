# shadcn/ui 设计规范与开发标准

## 文档版本信息

* **版本：** v1.0
* **创建日期：** 2026-02-04
* **最后更新：** 2026-02-04
* **文档状态：** Active
* **优先级：** CRITICAL - 所有开发必须遵循

---

## 1. 核心原则

### 1.1 UI 库独占性

**本项目严格使用 shadcn/ui (Vue 版本) 作为唯一的 UI 组件库。**

这不是建议，而是**强制性要求**：

- ✅ **必须使用：** shadcn/ui 组件
- ❌ **严禁使用：** Nuxt UI, PrimeVue, Element Plus, Ant Design, Vuetify 或任何其他 UI 库
- ❌ **严禁混用：** 在同一个项目中使用多个 UI 库

### 1.2 为什么选择 shadcn/ui？

1. **代码所有权：** 组件代码被复制到项目中，你完全拥有并可以自由定制
2. **无运行时依赖：** 不是 npm 包，没有版本锁定问题
3. **类型安全：** 完整的 TypeScript 支持
4. **可访问性优先：** 基于 Radix Vue 构建，默认符合 WCAG 标准
5. **Tailwind CSS 原生：** 完美集成 Tailwind 设计系统
6. **灵活性：** 可以修改任何组件而不影响其他项目

### 1.3 设计哲学

```
shadcn/ui = Radix Vue (无样式可访问组件) + Tailwind CSS (设计系统) + CVA (变体管理)
```

- **无样式基础：** Radix Vue 提供行为和可访问性
- **设计系统：** Tailwind CSS 提供视觉样式
- **类型安全的变体：** class-variance-authority 提供变体管理

---

## 2. 项目配置

### 2.1 配置文件

**`components.json`** (项目根目录)

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "default",
  "rsc": false,
  "tsx": false,
  "tailwind": {
    "config": "tailwind.config.ts",
    "css": "assets/css/main.css",
    "baseColor": "slate",
    "cssVariables": true,
    "prefix": ""
  },
  "aliases": {
    "components": "~/components",
    "utils": "~/lib/utils",
    "ui": "~/components/ui",
    "lib": "~/lib",
    "hooks": "~/composables"
  },
  "iconLibrary": "lucide-vue-next"
}
```

**关键配置说明：**

- `style: "default"` - 使用默认设计风格
- `cssVariables: true` - 使用 CSS 变量进行主题定制
- `baseColor: "slate"` - 基础颜色为 slate（灰色系）
- `iconLibrary: "lucide-vue-next"` - 使用 Lucide 图标库

### 2.2 主题配置

**`assets/css/main.css`**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;

    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;

    --popover: 0 0% 100%;
    --popover-foreground: 222.2 84% 4.9%;

    --primary: 221.2 83.2% 53.3%;
    --primary-foreground: 210 40% 98%;

    --secondary: 210 40% 96.1%;
    --secondary-foreground: 222.2 47.4% 11.2%;

    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;

    --accent: 210 40% 96.1%;
    --accent-foreground: 222.2 47.4% 11.2%;

    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;

    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 221.2 83.2% 53.3%;

    --radius: 0.5rem;
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;

    --card: 222.2 84% 4.9%;
    --card-foreground: 210 40% 98%;

    --popover: 222.2 84% 4.9%;
    --popover-foreground: 210 40% 98%;

    --primary: 217.2 91.2% 59.8%;
    --primary-foreground: 222.2 47.4% 11.2%;

    --secondary: 217.2 32.6% 17.5%;
    --secondary-foreground: 210 40% 98%;

    --muted: 217.2 32.6% 17.5%;
    --muted-foreground: 215 20.2% 65.1%;

    --accent: 217.2 32.6% 17.5%;
    --accent-foreground: 210 40% 98%;

    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 210 40% 98%;

    --border: 217.2 32.6% 17.5%;
    --input: 217.2 32.6% 17.5%;
    --ring: 224.3 76.3% 48%;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
  }
}
```

### 2.3 工具函数

**`lib/utils.ts`**

```typescript
import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * 合并 Tailwind CSS 类名，自动处理冲突
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

**使用示例：**

```vue
<script setup>
import { cn } from '~/lib/utils'
const isActive = ref(true)
</script>

<template>
  <div :class="cn('base-class', isActive && 'active-class', 'another-class')">
    Content
  </div>
</template>
```

---

## 3. 组件安装与使用

### 3.1 安装命令

```bash
# 添加单个组件
pnpm dlx shadcn-vue@latest add button

# 添加多个组件
pnpm dlx shadcn-vue@latest add button input card dialog

# 查看所有可用组件
pnpm dlx shadcn-vue@latest add
```

### 3.2 ArchMind 项目必需组件

**基础组件（优先安装）：**

```bash
# 表单控件
pnpm dlx shadcn-vue@latest add button
pnpm dlx shadcn-vue@latest add input
pnpm dlx shadcn-vue@latest add label
pnpm dlx shadcn-vue@latest add textarea
pnpm dlx shadcn-vue@latest add select
pnpm dlx shadcn-vue@latest add checkbox
pnpm dlx shadcn-vue@latest add radio-group
pnpm dlx shadcn-vue@latest add switch

# 布局组件
pnpm dlx shadcn-vue@latest add card
pnpm dlx shadcn-vue@latest add separator
pnpm dlx shadcn-vue@latest add tabs
pnpm dlx shadcn-vue@latest add scroll-area

# 反馈组件
pnpm dlx shadcn-vue@latest add dialog
pnpm dlx shadcn-vue@latest add alert
pnpm dlx shadcn-vue@latest add toast
pnpm dlx shadcn-vue@latest add progress

# 导航组件
pnpm dlx shadcn-vue@latest add dropdown-menu
pnpm dlx shadcn-vue@latest add navigation-menu
pnpm dlx shadcn-vue@latest add breadcrumb

# 数据展示
pnpm dlx shadcn-vue@latest add table
pnpm dlx shadcn-vue@latest add badge
pnpm dlx shadcn-vue@latest add avatar

# 其他
pnpm dlx shadcn-vue@latest add skeleton
pnpm dlx shadcn-vue@latest add tooltip
pnpm dlx shadcn-vue@latest add popover
```

### 3.3 组件目录结构

安装后的组件会被放置在：

```
components/
└── ui/
    ├── button/
    │   └── Button.vue
    ├── input/
    │   └── Input.vue
    ├── card/
    │   ├── Card.vue
    │   ├── CardHeader.vue
    │   ├── CardTitle.vue
    │   ├── CardDescription.vue
    │   ├── CardContent.vue
    │   └── CardFooter.vue
    └── ...
```

---

## 4. 组件使用规范

### 4.1 导入规范

**✅ 正确的导入方式：**

```typescript
// 单个组件
import { Button } from '~/components/ui/button'

// 复合组件（完整导入）
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '~/components/ui/card'

// 对话框组件
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '~/components/ui/dialog'
```

**❌ 错误的导入方式：**

```typescript
// ❌ 不要使用其他 UI 库
import { UButton } from '#components'  // Nuxt UI
import { PButton } from 'primevue/button'  // PrimeVue
import { ElButton } from 'element-plus'  // Element Plus

// ❌ 不要直接从组件文件导入
import Button from '~/components/ui/button/Button.vue'
```

### 4.2 组件命名规范

**在模板中使用组件：**

```vue
<template>
  <!-- ✅ 正确 - 使用 PascalCase -->
  <Button variant="default">Click me</Button>
  <Card>
    <CardHeader>
      <CardTitle>Title</CardTitle>
    </CardHeader>
  </Card>

  <!-- ❌ 错误 - 不要使用其他库的组件 -->
  <UButton>Click me</UButton>
  <PButton>Click me</PButton>
  <el-button>Click me</el-button>
</template>
```

### 4.3 变体系统

**Button 组件变体：**

```vue
<template>
  <!-- Variant 变体 -->
  <Button variant="default">Default</Button>
  <Button variant="destructive">Destructive</Button>
  <Button variant="outline">Outline</Button>
  <Button variant="secondary">Secondary</Button>
  <Button variant="ghost">Ghost</Button>
  <Button variant="link">Link</Button>

  <!-- Size 尺寸 -->
  <Button size="default">Default Size</Button>
  <Button size="sm">Small</Button>
  <Button size="lg">Large</Button>
  <Button size="icon">
    <Icon name="lucide:search" />
  </Button>

  <!-- 组合使用 -->
  <Button variant="outline" size="sm">Small Outline</Button>
</template>
```

**自定义变体（如需要）：**

```typescript
// components/ui/button/index.ts
import { cva, type VariantProps } from 'class-variance-authority'

export const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'text-primary underline-offset-4 hover:underline',
        // ✅ 添加自定义变体
        success: 'bg-green-600 text-white hover:bg-green-700',
        warning: 'bg-yellow-600 text-white hover:bg-yellow-700',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-md px-3',
        lg: 'h-11 rounded-md px-8',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

export type ButtonVariants = VariantProps<typeof buttonVariants>
```

### 4.4 样式定制

**✅ 正确的样式定制方式：**

```vue
<template>
  <!-- 使用 Tailwind 类名 -->
  <Button class="w-full mt-4">Full Width Button</Button>

  <!-- 使用 cn() 函数合并类名 -->
  <Button :class="cn('w-full', isActive && 'bg-primary', 'mt-4')">
    Conditional Classes
  </Button>

  <!-- 组合 Tailwind 工具类 -->
  <Card class="max-w-md mx-auto shadow-lg">
    <CardHeader class="bg-primary text-primary-foreground">
      <CardTitle>Custom Card</CardTitle>
    </CardHeader>
    <CardContent class="p-6">
      Content here
    </CardContent>
  </Card>
</template>

<script setup>
import { cn } from '~/lib/utils'
const isActive = ref(false)
</script>
```

**❌ 错误的样式定制方式：**

```vue
<template>
  <!-- ❌ 不要使用内联样式 -->
  <Button style="width: 100%; margin-top: 16px;">Bad</Button>

  <!-- ❌ 不要使用 scoped CSS -->
  <Button class="my-custom-button">Bad</Button>
</template>

<style scoped>
/* ❌ 不要自定义 CSS */
.my-custom-button {
  background: blue;
  color: white;
}
</style>
```

---

## 5. 常用组件模式

### 5.1 表单模式

**完整的表单示例（带验证）：**

```vue
<script setup lang="ts">
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Textarea } from '~/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select'
import { useForm } from 'vee-validate'
import { z } from 'zod'

// Zod 验证模式
const schema = z.object({
  title: z.string().min(1, '标题不能为空').max(100, '标题不能超过100个字符'),
  description: z.string().min(10, '描述至少需要10个字符'),
  category: z.string().min(1, '请选择分类'),
})

const { errors, values, handleSubmit, defineField } = useForm({
  validationSchema: schema,
})

const [title] = defineField('title')
const [description] = defineField('description')
const [category] = defineField('category')

const onSubmit = handleSubmit(async (values) => {
  console.log('Form submitted:', values)
  // 提交逻辑
})
</script>

<template>
  <Card class="w-full max-w-2xl mx-auto">
    <CardHeader>
      <CardTitle>创建新文档</CardTitle>
      <CardDescription>填写以下信息创建新的文档</CardDescription>
    </CardHeader>
    <CardContent>
      <form @submit="onSubmit" class="space-y-6">
        <!-- 标题字段 -->
        <div class="space-y-2">
          <Label for="title">标题 *</Label>
          <Input
            id="title"
            v-model="title"
            placeholder="输入文档标题"
            :class="cn(errors.title && 'border-destructive')"
          />
          <p v-if="errors.title" class="text-sm text-destructive">
            {{ errors.title }}
          </p>
        </div>

        <!-- 描述字段 -->
        <div class="space-y-2">
          <Label for="description">描述 *</Label>
          <Textarea
            id="description"
            v-model="description"
            placeholder="输入文档描述"
            rows="4"
            :class="cn(errors.description && 'border-destructive')"
          />
          <p v-if="errors.description" class="text-sm text-destructive">
            {{ errors.description }}
          </p>
        </div>

        <!-- 分类选择 -->
        <div class="space-y-2">
          <Label for="category">分类 *</Label>
          <Select v-model="category">
            <SelectTrigger :class="cn(errors.category && 'border-destructive')">
              <SelectValue placeholder="选择分类" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="prd">产品需求文档</SelectItem>
              <SelectItem value="design">设计文档</SelectItem>
              <SelectItem value="tech">技术文档</SelectItem>
              <SelectItem value="meeting">会议记录</SelectItem>
            </SelectContent>
          </Select>
          <p v-if="errors.category" class="text-sm text-destructive">
            {{ errors.category }}
          </p>
        </div>

        <!-- 提交按钮 -->
        <div class="flex justify-end gap-4">
          <Button type="button" variant="outline">取消</Button>
          <Button type="submit">创建文档</Button>
        </div>
      </form>
    </CardContent>
  </Card>
</template>
```

### 5.2 对话框模式

**确认对话框：**

```vue
<script setup lang="ts">
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '~/components/ui/dialog'
import { Button } from '~/components/ui/button'

const open = ref(false)

const handleConfirm = async () => {
  // 执行确认操作
  console.log('Confirmed')
  open.value = false
}
</script>

<template>
  <Dialog v-model:open="open">
    <DialogTrigger as-child>
      <Button variant="destructive">删除文档</Button>
    </DialogTrigger>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>确认删除</DialogTitle>
        <DialogDescription>
          此操作不可撤销。确定要删除这个文档吗？
        </DialogDescription>
      </DialogHeader>
      <DialogFooter>
        <Button variant="outline" @click="open = false">取消</Button>
        <Button variant="destructive" @click="handleConfirm">确认删除</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
```

**带表单的对话框：**

```vue
<script setup lang="ts">
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '~/components/ui/dialog'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'

const open = ref(false)
const name = ref('')

const handleSave = () => {
  console.log('Saving:', name.value)
  open.value = false
  name.value = ''
}
</script>

<template>
  <Dialog v-model:open="open">
    <DialogTrigger as-child>
      <Button>添加项目</Button>
    </DialogTrigger>
    <DialogContent class="sm:max-w-[425px]">
      <DialogHeader>
        <DialogTitle>添加新项目</DialogTitle>
        <DialogDescription>
          输入项目名称，点击保存创建新项目。
        </DialogDescription>
      </DialogHeader>
      <div class="grid gap-4 py-4">
        <div class="grid grid-cols-4 items-center gap-4">
          <Label for="name" class="text-right">名称</Label>
          <Input
            id="name"
            v-model="name"
            class="col-span-3"
            placeholder="项目名称"
          />
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" @click="open = false">取消</Button>
        <Button @click="handleSave">保存</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
```

### 5.3 数据表格模式

**基础表格：**

```vue
<script setup lang="ts">
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '~/components/ui/table'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '~/components/ui/dropdown-menu'

interface Document {
  id: string
  name: string
  type: string
  status: 'active' | 'archived' | 'draft'
  createdAt: string
}

const documents = ref<Document[]>([
  { id: '1', name: 'PRD - 用户认证', type: 'PRD', status: 'active', createdAt: '2026-02-01' },
  { id: '2', name: 'API 设计文档', type: 'Design', status: 'active', createdAt: '2026-02-02' },
  { id: '3', name: '会议记录 - 2月3日', type: 'Meeting', status: 'archived', createdAt: '2026-02-03' },
])

const handleEdit = (id: string) => {
  console.log('Edit:', id)
}

const handleDelete = (id: string) => {
  console.log('Delete:', id)
}
</script>

<template>
  <Card>
    <CardHeader>
      <CardTitle>文档列表</CardTitle>
      <CardDescription>管理您的所有文档</CardDescription>
    </CardHeader>
    <CardContent>
      <Table>
        <TableCaption>共 {{ documents.length }} 个文档</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>名称</TableHead>
            <TableHead>类型</TableHead>
            <TableHead>状态</TableHead>
            <TableHead>创建时间</TableHead>
            <TableHead class="text-right">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow v-for="doc in documents" :key="doc.id">
            <TableCell class="font-medium">{{ doc.name }}</TableCell>
            <TableCell>{{ doc.type }}</TableCell>
            <TableCell>
              <Badge
                :variant="doc.status === 'active' ? 'default' : doc.status === 'draft' ? 'secondary' : 'outline'"
              >
                {{ doc.status }}
              </Badge>
            </TableCell>
            <TableCell>{{ doc.createdAt }}</TableCell>
            <TableCell class="text-right">
              <DropdownMenu>
                <DropdownMenuTrigger as-child>
                  <Button variant="ghost" size="sm">
                    操作
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem @click="handleEdit(doc.id)">
                    编辑
                  </DropdownMenuItem>
                  <DropdownMenuItem @click="handleDelete(doc.id)" class="text-destructive">
                    删除
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </CardContent>
  </Card>
</template>
```

### 5.4 卡片网格模式

**文档卡片网格：**

```vue
<script setup lang="ts">
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '~/components/ui/card'
import { Button } from '~/components/ui/button'
import { Badge } from '~/components/ui/badge'

const documents = ref([
  { id: 1, title: 'PRD - 用户认证', type: 'PRD', date: '2026-02-01' },
  { id: 2, title: 'API 设计', type: 'Design', date: '2026-02-02' },
  { id: 3, title: '会议记录', type: 'Meeting', date: '2026-02-03' },
])
</script>

<template>
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    <Card v-for="doc in documents" :key="doc.id" class="flex flex-col">
      <CardHeader>
        <div class="flex items-start justify-between">
          <CardTitle class="text-xl">{{ doc.title }}</CardTitle>
          <Badge>{{ doc.type }}</Badge>
        </div>
        <CardDescription>创建于 {{ doc.date }}</CardDescription>
      </CardHeader>
      <CardContent class="flex-1">
        <p class="text-sm text-muted-foreground">
          这是文档的简要描述内容...
        </p>
      </CardContent>
      <CardFooter class="flex justify-between">
        <Button variant="outline" size="sm">查看</Button>
        <Button size="sm">编辑</Button>
      </CardFooter>
    </Card>
  </div>
</template>
```

### 5.5 Toast 通知模式

**Toast 通知示例：**

```vue
<script setup lang="ts">
import { Button } from '~/components/ui/button'
import { useToast } from '~/components/ui/toast'

const { toast } = useToast()

const showSuccess = () => {
  toast({
    title: '操作成功',
    description: '文档已成功保存',
  })
}

const showError = () => {
  toast({
    title: '操作失败',
    description: '无法保存文档，请重试',
    variant: 'destructive',
  })
}

const showWithAction = () => {
  toast({
    title: '文档已删除',
    description: '文档已被移到回收站',
    action: {
      label: '撤销',
      onClick: () => console.log('Undo'),
    },
  })
}
</script>

<template>
  <div class="flex gap-4">
    <Button @click="showSuccess">显示成功</Button>
    <Button @click="showError" variant="destructive">显示错误</Button>
    <Button @click="showWithAction" variant="outline">显示操作</Button>
  </div>
</template>
```

---

## 6. 高级定制

### 6.1 自定义主题颜色

编辑 `assets/css/main.css` 修改主题：

```css
@layer base {
  :root {
    /* 修改主色调 */
    --primary: 262.1 83.3% 57.8%;  /* 紫色 */
    --primary-foreground: 210 40% 98%;

    /* 修改成功色 */
    --success: 142.1 76.2% 36.3%;
    --success-foreground: 355.7 100% 97.3%;

    /* 修改警告色 */
    --warning: 38 92% 50%;
    --warning-foreground: 48 96% 89%;
  }
}
```

### 6.2 创建自定义组件变体

**创建带自定义变体的 Badge：**

```typescript
// components/ui/badge/index.ts
import { cva, type VariantProps } from 'class-variance-authority'

export const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primary text-primary-foreground hover:bg-primary/80',
        secondary: 'border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80',
        destructive: 'border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80',
        outline: 'text-foreground',
        // 自定义变体
        success: 'border-transparent bg-green-600 text-white hover:bg-green-700',
        warning: 'border-transparent bg-yellow-600 text-white hover:bg-yellow-700',
        info: 'border-transparent bg-blue-600 text-white hover:bg-blue-700',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

export type BadgeVariants = VariantProps<typeof badgeVariants>
```

### 6.3 扩展组件功能

**创建封装的确认对话框组件：**

```vue
<!-- components/ConfirmDialog.vue -->
<script setup lang="ts">
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '~/components/ui/dialog'
import { Button } from '~/components/ui/button'

interface Props {
  open: boolean
  title: string
  description: string
  confirmText?: string
  cancelText?: string
  variant?: 'default' | 'destructive'
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  confirmText: '确认',
  cancelText: '取消',
  variant: 'default',
  loading: false,
})

const emit = defineEmits<{
  'update:open': [value: boolean]
  'confirm': []
  'cancel': []
}>()

const handleConfirm = () => {
  emit('confirm')
}

const handleCancel = () => {
  emit('cancel')
  emit('update:open', false)
}
</script>

<template>
  <Dialog :open="open" @update:open="emit('update:open', $event)">
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{{ title }}</DialogTitle>
        <DialogDescription>{{ description }}</DialogDescription>
      </DialogHeader>
      <DialogFooter>
        <Button variant="outline" @click="handleCancel" :disabled="loading">
          {{ cancelText }}
        </Button>
        <Button :variant="variant" @click="handleConfirm" :disabled="loading">
          {{ confirmText }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
```

**使用封装的确认对话框：**

```vue
<script setup lang="ts">
import ConfirmDialog from '~/components/ConfirmDialog.vue'

const showDeleteDialog = ref(false)

const handleDelete = async () => {
  // 执行删除操作
  console.log('Deleting...')
  showDeleteDialog.value = false
}
</script>

<template>
  <div>
    <Button @click="showDeleteDialog = true" variant="destructive">
      删除文档
    </Button>

    <ConfirmDialog
      v-model:open="showDeleteDialog"
      title="确认删除"
      description="此操作不可撤销。确定要删除这个文档吗？"
      variant="destructive"
      confirm-text="删除"
      @confirm="handleDelete"
    />
  </div>
</template>
```

---

## 7. 代码审查清单

### 7.1 提交前检查

在提交代码前，请确保：

- [ ] **所有 UI 组件都使用 shadcn/ui**
- [ ] **没有从 Nuxt UI、PrimeVue 或其他库导入组件**
- [ ] **所有导入都使用 `~/components/ui/*` 路径**
- [ ] **使用 Tailwind CSS 类名而非内联样式**
- [ ] **使用 `cn()` 工具函数处理条件类名**
- [ ] **遵循 shadcn/ui 命名约定**
- [ ] **正确使用组件组合（如 Card 与 CardHeader、CardContent）**
- [ ] **保留可访问性属性（ARIA attributes）**
- [ ] **TypeScript 类型正确定义**
- [ ] **响应式设计正常工作（使用 Tailwind 断点）**

### 7.2 常见错误检查

**❌ 禁止的代码模式：**

```vue
<!-- ❌ 使用其他 UI 库 -->
<UButton>Click</UButton>
<PButton>Click</PButton>
<ElButton>Click</ElButton>

<!-- ❌ 混用不同库 -->
<UButton>Cancel</UButton>
<Button>Confirm</Button>

<!-- ❌ 使用内联样式 -->
<Button style="color: red">Bad</Button>

<!-- ❌ 自定义 CSS -->
<Button class="my-custom-button">Bad</Button>

<style scoped>
.my-custom-button {
  background: red;
}
</style>

<!-- ❌ 错误的导入 -->
import { UButton } from '#components'
import Button from '~/components/ui/button/Button.vue'
```

**✅ 正确的代码模式：**

```vue
<!-- ✅ 使用 shadcn/ui -->
<Button variant="default">Click</Button>
<Button variant="destructive">Delete</Button>

<!-- ✅ 使用 Tailwind 类名 -->
<Button class="w-full mt-4">Full Width</Button>

<!-- ✅ 使用 cn() 函数 -->
<Button :class="cn('w-full', isActive && 'bg-primary')">
  Dynamic
</Button>

<!-- ✅ 正确的导入 -->
<script setup>
import { Button } from '~/components/ui/button'
import { cn } from '~/lib/utils'
</script>
```

---

## 8. 迁移指南

### 8.1 从 Nuxt UI 迁移

**迁移步骤：**

1. **识别组件：** 找到所有使用 Nuxt UI 的组件
2. **查找对应：** 在 shadcn/ui 中找到等效组件
3. **安装组件：** 使用 `pnpm dlx shadcn-vue@latest add [component]`
4. **替换导入：** 更新 import 语句
5. **更新模板：** 修改组件使用方式
6. **调整样式：** 转换为 Tailwind 类名
7. **测试功能：** 确保功能正常

**组件对应表：**

| Nuxt UI | shadcn/ui | 迁移说明 |
|---------|-----------|----------|
| `UButton` | `Button` | 变体名称可能不同 |
| `UInput` | `Input` | 基本兼容 |
| `UCard` | `Card` + 子组件 | 需要使用 CardHeader、CardContent 等 |
| `UModal` | `Dialog` | API 不同，需要调整 |
| `UAlert` | `Alert` | 基本兼容 |
| `UBadge` | `Badge` | 基本兼容 |
| `USelect` | `Select` + 子组件 | 需要使用 SelectTrigger、SelectContent 等 |

**迁移示例：**

```vue
<!-- BEFORE (Nuxt UI) -->
<script setup>
import { UButton, UCard, UInput } from '#components'
</script>

<template>
  <UCard>
    <template #header>
      <h3>Title</h3>
    </template>
    <UInput v-model="text" placeholder="Enter text" />
    <template #footer>
      <UButton color="primary" @click="submit">Submit</UButton>
    </template>
  </UCard>
</template>

<!-- AFTER (shadcn/ui) -->
<script setup>
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '~/components/ui/card'
import { Input } from '~/components/ui/input'
</script>

<template>
  <Card>
    <CardHeader>
      <CardTitle>Title</CardTitle>
    </CardHeader>
    <CardContent>
      <Input v-model="text" placeholder="Enter text" />
    </CardContent>
    <CardFooter>
      <Button @click="submit">Submit</Button>
    </CardFooter>
  </Card>
</template>
```

### 8.2 常见迁移问题

**问题 1: 事件处理差异**

```vue
<!-- Nuxt UI -->
<UButton @click="handleClick">Click</UButton>

<!-- shadcn/ui (相同) -->
<Button @click="handleClick">Click</Button>
```

**问题 2: 插槽使用差异**

```vue
<!-- Nuxt UI -->
<UCard>
  <template #header>Header</template>
  <template #footer>Footer</template>
</UCard>

<!-- shadcn/ui -->
<Card>
  <CardHeader>Header</CardHeader>
  <CardContent>Content</CardContent>
  <CardFooter>Footer</CardFooter>
</Card>
```

**问题 3: 颜色变体差异**

```vue
<!-- Nuxt UI -->
<UButton color="primary">Primary</UButton>
<UButton color="red">Delete</UButton>

<!-- shadcn/ui -->
<Button variant="default">Primary</Button>
<Button variant="destructive">Delete</Button>
```

---

## 9. 性能优化

### 9.1 按需导入

shadcn/ui 组件已经是按需导入的，因为它们被复制到项目中：

```typescript
// ✅ 只导入需要的组件
import { Button } from '~/components/ui/button'
import { Card, CardHeader } from '~/components/ui/card'

// ✅ 不用担心未使用的组件，它们不会被打包
```

### 9.2 懒加载大型组件

对于大型或复杂的组件，使用 Vue 的懒加载：

```vue
<script setup>
// 懒加载 Dialog 组件
const LazyDialog = defineAsyncComponent(() =>
  import('~/components/ui/dialog').then(m => m.Dialog)
)
</script>

<template>
  <LazyDialog v-if="showDialog">
    <!-- content -->
  </LazyDialog>
</template>
```

### 9.3 优化 Tailwind 生成

确保 `tailwind.config.ts` 正确配置：

```typescript
// tailwind.config.ts
export default {
  content: [
    './components/**/*.{js,vue,ts}',
    './layouts/**/*.vue',
    './pages/**/*.vue',
    './plugins/**/*.{js,ts}',
    './app.vue',
  ],
  // ...
}
```

---

## 10. 可访问性（A11y）

### 10.1 shadcn/ui 默认可访问性

shadcn/ui 基于 Radix Vue 构建，默认支持：

- ✅ ARIA 属性自动管理
- ✅ 键盘导航支持
- ✅ 焦点管理
- ✅ 屏幕阅读器友好

### 10.2 保持可访问性的最佳实践

**1. 保留 ARIA 属性：**

```vue
<!-- ✅ 不要删除或覆盖 ARIA 属性 -->
<Button aria-label="Close dialog">
  <Icon name="lucide:x" />
</Button>

<!-- ✅ 为图标按钮添加标签 -->
<Button variant="ghost" size="icon" aria-label="搜索">
  <Icon name="lucide:search" />
</Button>
```

**2. 使用语义化 HTML：**

```vue
<!-- ✅ 使用正确的表单元素 -->
<form @submit.prevent="onSubmit">
  <Label for="email">邮箱</Label>
  <Input id="email" type="email" v-model="email" />
  <Button type="submit">提交</Button>
</form>
```

**3. 提供足够的颜色对比度：**

```css
/* 确保文字和背景有足够的对比度 (WCAG AA: 4.5:1) */
:root {
  --foreground: 222.2 84% 4.9%;  /* 深色文字 */
  --background: 0 0% 100%;        /* 白色背景 */
}
```

**4. 支持键盘导航：**

```vue
<!-- ✅ 确保所有交互元素可通过键盘访问 -->
<DropdownMenu>
  <DropdownMenuTrigger>Options</DropdownMenuTrigger>
  <DropdownMenuContent>
    <!-- 自动支持方向键导航 -->
    <DropdownMenuItem>Edit</DropdownMenuItem>
    <DropdownMenuItem>Delete</DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

---

## 11. 常见问题解答（FAQ）

### Q1: 为什么选择 shadcn/ui 而不是其他 UI 库？

**A:** shadcn/ui 提供完全的代码所有权和自由定制能力。组件被复制到项目中，你可以自由修改而不受库更新影响。它基于 Radix Vue（可访问性优先）和 Tailwind CSS（设计系统），提供了最佳的开发体验和灵活性。

### Q2: 如何自定义组件样式？

**A:** 有两种方式：
1. **使用 Tailwind 类名：** 直接在组件上添加 Tailwind 类名
2. **修改组件代码：** 因为组件在你的项目中，直接编辑 `components/ui/*` 中的文件

### Q3: shadcn/ui 支持暗色模式吗？

**A:** 完全支持。通过 CSS 变量实现，在 `assets/css/main.css` 中定义了 `:root` 和 `.dark` 两套颜色变量。

### Q4: 如何处理表单验证？

**A:** 结合 VeeValidate 和 Zod 使用。参见 [5.1 表单模式](#51-表单模式)。

### Q5: 组件更新怎么办？

**A:** 因为组件在你的项目中，你可以：
1. 手动更新需要的组件：`pnpm dlx shadcn-vue@latest add button --overwrite`
2. 或保持当前版本，不影响功能

### Q6: 可以混用其他 UI 库吗？

**A:** **绝对不可以。** 这会导致样式冲突、不一致的用户体验和维护噩梦。必须严格使用 shadcn/ui。

### Q7: 如何添加自定义变体？

**A:** 编辑组件的 `index.ts` 文件，使用 `class-variance-authority` 添加新变体。参见 [6.2 创建自定义组件变体](#62-创建自定义组件变体)。

### Q8: shadcn/ui 支持国际化（i18n）吗？

**A:** shadcn/ui 本身不提供 i18n，但所有文本都是可定制的。你可以结合 Vue i18n 使用：

```vue
<script setup>
import { useI18n } from 'vue-i18n'
const { t } = useI18n()
</script>

<template>
  <Button>{{ t('common.submit') }}</Button>
</template>
```

---

## 12. 资源链接

### 官方文档

- **shadcn/ui 官网：** https://ui.shadcn.com
- **shadcn-vue 文档：** https://www.shadcn-vue.com
- **Radix Vue 文档：** https://www.radix-vue.com
- **Tailwind CSS 文档：** https://tailwindcss.com
- **Lucide Icons：** https://lucide.dev

### 项目文档

- **shadcn/ui 使用指南：** `/docs/SHADCN_USAGE.md`
- **shadcn/ui 设置指南：** `/docs/SHADCN_SETUP.md`
- **前端架构详细设计：** `/docs/详细设计/06-前端架构详细设计.md`

### 社区资源

- **shadcn/ui GitHub：** https://github.com/shadcn-ui/ui
- **Radix Vue GitHub：** https://github.com/radix-vue/radix-vue
- **Tailwind UI：** https://tailwindui.com (付费组件库，可参考设计)

---

## 13. 附录

### 附录 A: 完整组件列表

shadcn/ui 提供的所有可用组件：

**表单控件：**
- Accordion
- Alert Dialog
- Aspect Ratio
- Avatar
- Badge
- Button
- Calendar
- Checkbox
- Collapsible
- Combobox
- Command
- Context Menu
- Data Table
- Date Picker
- Dialog
- Dropdown Menu
- Form
- Hover Card
- Input
- Label
- Menubar
- Navigation Menu
- Popover
- Progress
- Radio Group
- Scroll Area
- Select
- Separator
- Sheet
- Skeleton
- Slider
- Switch
- Table
- Tabs
- Textarea
- Toast
- Toggle
- Toggle Group
- Tooltip

### 附录 B: 快速参考

**常用导入：**

```typescript
// 基础
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'

// 布局
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '~/components/ui/card'
import { Separator } from '~/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs'

// 反馈
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '~/components/ui/dialog'
import { Alert, AlertDescription, AlertTitle } from '~/components/ui/alert'
import { useToast } from '~/components/ui/toast'

// 表单
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select'
import { Checkbox } from '~/components/ui/checkbox'
import { RadioGroup, RadioGroupItem } from '~/components/ui/radio-group'

// 工具
import { cn } from '~/lib/utils'
```

**常用命令：**

```bash
# 添加组件
pnpm dlx shadcn-vue@latest add [component]

# 覆盖现有组件
pnpm dlx shadcn-vue@latest add [component] --overwrite

# 查看所有组件
pnpm dlx shadcn-vue@latest add
```

---

## 总结

本文档定义了 ArchMind AI 项目中 shadcn/ui 的严格使用规范。所有开发人员必须遵循这些规范，确保：

1. ✅ **UI 一致性** - 整个项目使用统一的 UI 组件库
2. ✅ **代码质量** - 类型安全、可维护、可扩展
3. ✅ **用户体验** - 响应式、可访问、美观
4. ✅ **开发效率** - 清晰的模式、丰富的示例、完整的文档

**核心要求：**
- **只使用 shadcn/ui**
- **不使用其他 UI 库**
- **不混用多个库**
- **遵循 Tailwind CSS 最佳实践**
- **保持可访问性标准**

如有任何疑问，请参考本文档或查阅官方文档。
