# 工作区功能使用指南

## 功能概述

工作区功能允许您将项目和文档组织到不同的工作区中,实现数据隔离和分类管理。

## 功能特性

- ✅ **多工作区支持**: 创建多个工作区来组织不同类型的项目
- ✅ **快速切换**: 一键切换工作区,查看不同工作区的项目
- ✅ **可视化管理**: 为每个工作区设置图标和颜色
- ✅ **统计信息**: 实时显示每个工作区的项目和文档数量
- ✅ **默认工作区**: 设置常用工作区为默认

## 安装步骤

### 1. 运行数据库迁移

```bash
# 执行工作区功能迁移
pnpm tsx scripts/migrate-workspaces.ts
```

这将:
- 创建 `workspaces` 表
- 为 `documents` 和 `prd_documents` 表添加 `workspace_id` 字段
- 创建名为 "Local" 的默认工作区
- 初始化系统配置

### 2. 启动应用

```bash
pnpm dev
```

### 3. 使用工作区功能

1. **查看工作区选择器**
   - 在首页顶部可以看到工作区选择器
   - 显示当前工作区的名称和图标

2. **切换工作区**
   - 点击工作区选择器
   - 选择要切换的工作区
   - 页面会自动刷新显示新工作区的数据

3. **创建新工作区**
   - 点击工作区选择器 → "创建工作区"
   - 填写工作区信息:
     - 名称(必填)
     - 描述(可选)
     - 图标(emoji)
     - 颜色
   - 点击创建

4. **管理工作区**
   - 点击工作区选择器 → "管理工作区"
   - 可以:
     - 查看所有工作区
     - 设置默认工作区
     - 删除非默认工作区

## 数据库结构

### workspaces 表

```sql
CREATE TABLE workspaces (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT DEFAULT '📁',
  color TEXT DEFAULT '#3B82F6',
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### workspace_id 字段

- `documents.workspace_id`: 文档所属工作区
- `prd_documents.workspace_id`: PRD 项目所属工作区

## API 端点

### 工作区管理

- `GET /api/workspaces` - 获取所有工作区(含统计)
- `POST /api/workspaces` - 创建工作区
- `GET /api/workspaces/:id` - 获取单个工作区
- `PATCH /api/workspaces/:id` - 更新工作区
- `DELETE /api/workspaces/:id` - 删除工作区
- `POST /api/workspaces/:id/set-default` - 设置默认工作区

## Composable

```typescript
import { useWorkspace } from '~/composables/useWorkspace'

const {
  workspaces,           // 所有工作区列表
  currentWorkspace,     // 当前工作区
  currentWorkspaceId,   // 当前工作区 ID
  defaultWorkspace,     // 默认工作区
  loading,              // 加载状态

  loadWorkspaces,       // 加载工作区列表
  switchWorkspace,      // 切换工作区
  createWorkspace,      // 创建工作区
  updateWorkspace,      // 更新工作区
  deleteWorkspace,      // 删除工作区
  setDefaultWorkspace,  // 设置默认工作区
  refreshStats          // 刷新统计
} = useWorkspace()
```

## 组件

### WorkspaceSwitcher

工作区切换器组件,用于显示和切换工作区。

```vue
<template>
  <WorkspaceSwitcher />
</template>

<script setup>
import WorkspaceSwitcher from '~/components/workspace/WorkspaceSwitcher.vue'
</script>
```

## 使用场景

1. **团队协作**: 不同团队使用不同工作区
   - 产品团队
   - 技术团队
   - 设计团队

2. **项目分类**: 按项目类型分类
   - 内部项目
   - 客户项目
   - 实验性项目

3. **环境隔离**: 不同开发环境
   - 开发环境
   - 测试环境
   - 生产环境

## 注意事项

1. **默认工作区**: 始终保留一个默认工作区,无法删除
2. **数据隔离**: 切换工作区后只显示该工作区的数据
3. **删除影响**: 删除工作区会同时删除其中的所有项目和文档
4. **工作区切换**: 切换工作区会触发 `workspace-changed` 事件,其他组件可监听此事件刷新数据

## 故障排除

### 迁移失败

如果迁移脚本执行失败,可以手动执行 SQL:

```bash
psql -U your_username -d archmind -f migrations/add-workspaces-support.sql
```

### 工作区选择器不显示

1. 检查是否正确导入组件
2. 检查 API 端点是否正常运行
3. 查看浏览器控制台错误信息

### 切换工作区后数据未更新

1. 检查是否监听了 `workspace-changed` 事件
2. 确认 API 查询是否包含 `workspace_id` 过滤

## 未来计划

- [ ] 工作区数据完全隔离(当前为部分隔离)
- [ ] 工作区权限管理
- [ ] 工作区数据导入导出
- [ ] 工作区模板
- [ ] 跨工作区数据复制/移动
