# 生产环境数据库迁移指南

## 问题描述

生产环境缺失以下数据表，导致加载项目和原型失败：

- `design_documents` - 前端设计方案表
- `logic_maps` - 逻辑流程图表
- `workspace_members` - 工作区成员表
- `workspace_invitations` - 工作区邀请表
- `comments` - 评论表
- `activity_logs` - 活动日志表
- `webhooks` - Webhook 表
- `webhook_deliveries` - Webhook 投递日志表

## 解决方案

### 方式一：使用自动化脚本（推荐）

```bash
# 1. 确保已登录 Vercel
vercel login

# 2. 执行迁移脚本
./scripts/apply-missing-tables-migration.sh
```

脚本会自动：
1. 检查 Vercel 登录状态
2. 获取生产环境的 DATABASE_URL
3. 执行迁移 SQL 文件
4. 显示执行结果

### 方式二：手动执行（如果脚本失败）

```bash
# 1. 获取生产数据库连接字符串
vercel env pull --environment=production

# 2. 从 .env.vercel 文件中复制 DATABASE_URL

# 3. 手动执行迁移
psql "<DATABASE_URL>" -f migrations/add-missing-production-tables.sql
```

### 方式三：通过 Neon 控制台执行

1. 登录 [Neon Console](https://console.neon.tech)
2. 选择对应的项目
3. 进入 SQL Editor
4. 复制 `migrations/add-missing-production-tables.sql` 的内容
5. 粘贴并执行

## 验证迁移

执行迁移后，可以通过以下 SQL 验证表是否创建成功：

```sql
-- 检查所有表
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- 检查特定表
SELECT EXISTS (
  SELECT FROM information_schema.tables
  WHERE table_schema = 'public'
  AND table_name = 'design_documents'
);
```

## 相关修改

### 1. 数据库 Schema 修复

**文件**: `lib/db/schema.ts`

- ✅ 修复 `design_documents.workspace_id` 类型：`text` → `uuid`
- ✅ 新增 `logicMaps` 表定义

### 2. 迁移文件

**文件**: `migrations/add-missing-production-tables.sql`

包含所有缺失表的完整 DDL，包括：
- 表结构定义
- 索引创建
- 外键约束
- 触发器设置

### 3. 自动化脚本

**文件**: `scripts/apply-missing-tables-migration.sh`

自动化迁移执行脚本，支持：
- Vercel 环境检查
- 自动获取 DATABASE_URL
- 执行迁移并显示结果

## 注意事项

1. **备份数据**：虽然使用 `CREATE TABLE IF NOT EXISTS`，但建议先备份生产数据
2. **执行时机**：建议在低峰期执行迁移
3. **权限检查**：确保数据库用户有 CREATE TABLE 权限
4. **SSL 连接**：Neon 数据库连接字符串必须包含 `?sslmode=require`

## 常见问题

### Q: 迁移脚本报错 "permission denied"

**原因**: 数据库用户权限不足

**解决**: 使用 Neon 控制台的 SQL Editor 执行（方式三）

### Q: 表已存在错误

**原因**: 部分表已经创建

**解决**: 使用 `CREATE TABLE IF NOT EXISTS`，不会影响已存在的表

### Q: 外键约束失败

**原因**: 引用的父表不存在

**解决**: 确保先执行 `scripts/neon-init.sql` 初始化基础表

## 相关文档

- [Vercel 部署指南](../docs/guides/vercel-deployment.md)
- [数据库初始化脚本](../scripts/neon-init.sql)
- [数据层详细设计](../docs/architecture/详细设计/01-数据层详细设计.md)
