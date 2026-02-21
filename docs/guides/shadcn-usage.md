# shadcn/ui 使用指南

本文档介绍如何在 ArchMind 项目中使用 shadcn/ui 组件库。

## 📦 已安装的依赖

项目已经安装了以下 shadcn/ui 相关依赖：

- `radix-vue`: Vue 3 的无样式 UI 组件库
- `lucide-vue-next`: 图标库
- `class-variance-authority`: 类型安全的样式变体管理
- `tailwind-merge`: Tailwind CSS 类名合并工具
- `clsx`: 条件类名工具
- `@radix-ui/colors`: Radix UI 颜色系统

## 🎨 配置文件

### components.json

项目根目录的 `components.json` 文件配置了 shadcn/ui 的基本设置：

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

## 🚀 添加组件

使用 shadcn/ui CLI 添加组件到项目：

```bash
# 添加单个组件
pnpm dlx shadcn-vue@latest add button

# 添加多个组件
pnpm dlx shadcn-vue@latest add button card dialog

# 查看所有可用组件
pnpm dlx shadcn-vue@latest add
```

组件将被添加到 `components/ui` 目录下。

## 📝 使用示例

### 1. 使用 Button 组件

```vue
<script setup lang="ts">
import { Button } from '~/components/ui/button'
</script>

<template>
  <div>
    <!-- 默认按钮 -->
    <Button>点击我</Button>

    <!-- 不同变体 -->
    <Button variant="destructive">删除</Button>
    <Button variant="outline">轮廓</Button>
    <Button variant="ghost">幽灵</Button>
    <Button variant="link">链接</Button>

    <!-- 不同尺寸 -->
    <Button size="sm">小按钮</Button>
    <Button size="lg">大按钮</Button>

    <!-- 带图标 -->
    <Button>
      <Icon name="lucide:plus" class="mr-2 h-4 w-4" />
      添加项目
    </Button>
  </div>
</template>
```

### 2. 使用 Card 组件

```vue
<script setup lang="ts">
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '~/components/ui/card'
import { Button } from '~/components/ui/button'
</script>

<template>
  <Card>
    <CardHeader>
      <CardTitle>卡片标题</CardTitle>
      <CardDescription>卡片描述信息</CardDescription>
    </CardHeader>
    <CardContent>
      <p>这是卡片的主要内容区域。</p>
    </CardContent>
    <CardFooter>
      <Button>操作按钮</Button>
    </CardFooter>
  </Card>
</template>
```

### 3. 使用 Dialog 组件

```vue
<script setup lang="ts">
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '~/components/ui/dialog'
import { Button } from '~/components/ui/button'

const open = ref(false)
</script>

<template>
  <Dialog v-model:open="open">
    <DialogTrigger as-child>
      <Button>打开对话框</Button>
    </DialogTrigger>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>对话框标题</DialogTitle>
        <DialogDescription>
          这是对话框的描述信息。
        </DialogDescription>
      </DialogHeader>
      <div class="py-4">
        <!-- 对话框内容 -->
      </div>
      <DialogFooter>
        <Button variant="outline" @click="open = false">取消</Button>
        <Button @click="open = false">确认</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
```

### 4. 使用 Input 组件

```vue
<script setup lang="ts">
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'

const email = ref('')
</script>

<template>
  <div class="space-y-2">
    <Label for="email">邮箱</Label>
    <Input
      id="email"
      v-model="email"
      type="email"
      placeholder="请输入邮箱"
    />
  </div>
</template>
```

### 5. 使用 Select 组件

```vue
<script setup lang="ts">
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select'

const selectedValue = ref('')
</script>

<template>
  <Select v-model="selectedValue">
    <SelectTrigger class="w-[180px]">
      <SelectValue placeholder="选择一个选项" />
    </SelectTrigger>
    <SelectContent>
      <SelectGroup>
        <SelectLabel>水果</SelectLabel>
        <SelectItem value="apple">苹果</SelectItem>
        <SelectItem value="banana">香蕉</SelectItem>
        <SelectItem value="orange">橙子</SelectItem>
      </SelectGroup>
    </SelectContent>
  </Select>
</template>
```

## 🎨 自定义样式

### 使用 cn 工具函数

项目中的 `lib/utils.ts` 提供了 `cn` 工具函数，用于合并 Tailwind CSS 类名：

```vue
<script setup lang="ts">
import { cn } from '~/lib/utils'
import { Button } from '~/components/ui/button'

const isActive = ref(false)
</script>

<template>
  <Button
    :class="cn(
      'custom-class',
      isActive && 'bg-primary',
      !isActive && 'bg-secondary'
    )"
  >
    动态样式按钮
  </Button>
</template>
```

### 创建自定义变体

使用 `class-variance-authority` 创建自定义组件变体：

```typescript
import { cva, type VariantProps } from 'class-variance-authority'

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        outline: 'border border-input bg-background hover:bg-accent',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-md px-3',
        lg: 'h-11 rounded-md px-8',
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

## 🎯 最佳实践

### 1. 组件组织

- 将 shadcn/ui 组件放在 `components/ui` 目录
- 业务组件放在 `components` 的其他子目录
- 使用 Composition API 组合组件逻辑

### 2. 样式管理

- 使用 CSS 变量进行主题定制（已在 `assets/css/main.css` 中配置）
- 使用 `cn` 函数合并类名，避免样式冲突
- 遵循 Tailwind CSS 的移动优先原则

### 3. 类型安全

- 为组件 props 定义 TypeScript 类型
- 使用 `VariantProps` 提取变体类型
- 利用 Vue 3 的类型推断

### 4. 可访问性

- shadcn/ui 基于 Radix UI，默认支持可访问性
- 保持组件的 ARIA 属性
- 确保键盘导航正常工作

## 🔧 常用组件列表

以下是推荐添加的常用组件：

```bash
# 基础组件
pnpm dlx shadcn-vue@latest add button
pnpm dlx shadcn-vue@latest add input
pnpm dlx shadcn-vue@latest add label
pnpm dlx shadcn-vue@latest add textarea

# 布局组件
pnpm dlx shadcn-vue@latest add card
pnpm dlx shadcn-vue@latest add separator
pnpm dlx shadcn-vue@latest add tabs

# 反馈组件
pnpm dlx shadcn-vue@latest add dialog
pnpm dlx shadcn-vue@latest add alert
pnpm dlx shadcn-vue@latest add toast
pnpm dlx shadcn-vue@latest add progress

# 表单组件
pnpm dlx shadcn-vue@latest add select
pnpm dlx shadcn-vue@latest add checkbox
pnpm dlx shadcn-vue@latest add radio-group
pnpm dlx shadcn-vue@latest add switch

# 数据展示
pnpm dlx shadcn-vue@latest add table
pnpm dlx shadcn-vue@latest add badge
pnpm dlx shadcn-vue@latest add avatar

# 导航组件
pnpm dlx shadcn-vue@latest add dropdown-menu
pnpm dlx shadcn-vue@latest add navigation-menu
pnpm dlx shadcn-vue@latest add breadcrumb
```

## 📚 参考资源

- [shadcn/ui 官方文档](https://ui.shadcn.com)
- [shadcn-vue 文档](https://www.shadcn-vue.com)
- [Radix Vue 文档](https://www.radix-vue.com)
- [Lucide Icons](https://lucide.dev)
- [Tailwind CSS 文档](https://tailwindcss.com)

## 💡 提示

1. 组件是可以自由修改的，它们被复制到你的项目中
2. 可以根据项目需求调整组件样式和行为
3. 使用 TypeScript 获得更好的类型提示和开发体验
4. 配合 Prettier 保持代码格式一致性
