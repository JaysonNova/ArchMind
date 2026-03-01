# 生产环境数据库修复 - 快速操作指南

## 🚨 问题现状

生产环境报错：
- ❌ 加载项目失败
- ❌ 加载原型失败

**根本原因**: 数据库缺失 8 个表

## ✅ 解决方案（3 步完成）

### Step 1: 登录 Vercel

```bash
vercel login
```

### Step 2: 执行迁移脚本

```bash
./scripts/apply-missing-tables-migration.sh
```

脚本会自动：
- ✅ 检查 Vercel 登录状态
- ✅ 获取生产数据库连接
- ✅ 执行迁移 SQL
- ✅ 显示执行结果

### Step 3: 验证修复

访问生产环境，测试：
- 加载项目列表
- 加载原型列表
- 创建设计方案

## 📋 迁移内容

将创建以下 8 个表：

| 表名 | 用途 |
|------|------|
| `design_documents` | 前端设计方案 |
| `logic_maps` | 逻辑流程图 |
| `workspace_members` | 工作区成员 |
| `workspace_invitations` | 工作区邀请 |
| `comments` | 评论 |
| `activity_logs` | 活动日志 |
| `webhooks` | Webhook |
| `webhook_deliveries` | Webhook 投递日志 |

## 🔧 备选方案

如果自动脚本失败，可以手动执行：

```bash
# 1. 获取数据库连接
vercel env pull --environment=production

# 2. 手动执行迁移
psql "<从 .env.vercel 复制 DATABASE_URL>" -f migrations/add-missing-production-tables.sql
```

或通过 [Neon 控制台](https://console.neon.tech) SQL Editor 执行 `migrations/add-missing-production-tables.sql`

## 📚 详细文档

- [完整迁移指南](./migrations/README.md)
- [Vercel 部署文档](./docs/guides/vercel-deployment.md)

## ⚠️ 注意事项

- ✅ 使用 `CREATE TABLE IF NOT EXISTS`，安全执行
- ✅ 不会影响现有数据
- ✅ 建议在低峰期执行
- ✅ 执行前已自动备份（Neon 自动快照）

---

**预计执行时间**: < 1 分钟
