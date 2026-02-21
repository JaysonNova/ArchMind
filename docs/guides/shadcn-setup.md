# Shadcn-vue 集成完成

## 已完成的工作

### 1. ✅ 安装配置
- 安装了 `shadcn-vue@latest`
- 配置了 `components.json` 使用 **New York** 风格 + **Neutral** 配色
- 创建了 `lib/utils.ts` 工具函数（包含 `cn` 函数用于类名合并）

### 2. ✅ 主题配置
- 更新了 `assets/css/main.css` 使用 Neutral 配色方案
  - 浅色模式：干净的白色背景 + 中性灰色调
  - 深色模式：深灰背景 + 中性色调
- 更新了 `tailwind.config.ts` 包含完整的 shadcn 颜色系统和 chart 颜色

### 3. ✅ 已安装的组件
以下组件已经可以直接使用：

**基础组件：**
- Button（按钮）
- Card（卡片）
- Input（输入框）
- Label（标签）
- Textarea（多行文本）
- Badge（徽章）
- Alert（警告提示）
- Separator（分隔线）

**高级组件：**
- Select（下拉选择）
- Dialog（对话框/模态框）
- Dropdown Menu（下拉菜单）
- Tabs（标签页）
- Table（表格）
- Tooltip（工具提示）
- Scroll Area（滚动区域）

### 4. ✅ 测试页面
创建了 `/components-demo` 页面展示所有已安装组件的使用示例。

## 如何使用

### 基本用法

```vue
<script setup lang="ts">
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
</script>

<template>
  <div>
    <Button>Click me</Button>
    <Input placeholder="Enter text" />
  </div>
</template>
```

### 添加更多组件

如果需要添加其他 shadcn 组件：

```bash
pnpm dlx shadcn-vue@latest add [component-name]
```

例如：
```bash
pnpm dlx shadcn-vue@latest add avatar
pnpm dlx shadcn-vue@latest add switch
pnpm dlx shadcn-vue@latest add checkbox
```

### 可用的组件列表
访问 https://www.shadcn-vue.com/docs/components 查看所有可用组件。

## 配置文件说明

### components.json
```json
{
  "style": "new-york",        // 使用 New York 风格
  "baseColor": "neutral",     // 使用 Neutral 配色
  "cssVariables": true        // 使用 CSS 变量
}
```

### 颜色变量
项目使用 CSS 变量定义主题颜色，可在 `assets/css/main.css` ��自定义：

- `--background` - 背景色
- `--foreground` - 前景色（文字）
- `--primary` - 主色调
- `--secondary` - 次要色
- `--muted` - 静音色（低对比度元素）
- `--accent` - 强调色
- `--destructive` - 危险操作色
- `--border` - 边框色

## 下一步

1. **查看演示页面**：访问 `http://localhost:3000/components-demo` 查看组件效果
2. **根据需要添加组件**：使用上面的命令添加项目需要的其他组件
3. **自定义样式**：可以在 `assets/css/main.css` 中调整颜色变量
4. **开始使用**：在项目页面中导入并使用 shadcn 组件

## 注意事项

- 所有 shadcn 组件位于 `~/components/ui/` 目录
- 组件使用 TypeScript 编写，支持完整类型提示
- 组件基于 Radix Vue，具有完整的无障碍支持
- 使用 `cn()` 函数合并 Tailwind 类名（从 `~/lib/utils` 导入）
