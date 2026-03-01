#!/bin/bash
# 应用缺失表的迁移脚本
# 用法: ./scripts/apply-missing-tables-migration.sh

set -e

echo "🔍 检查 Vercel 环境..."

# 检查是否已登录 Vercel
if ! vercel whoami &>/dev/null; then
  echo "❌ 请先登录 Vercel: vercel login"
  exit 1
fi

echo "✅ Vercel 已登录"

# 获取生产环境的 DATABASE_URL
echo "📡 获取生产数据库连接..."
DATABASE_URL=$(vercel env pull --environment=production --yes 2>/dev/null | grep DATABASE_URL | cut -d'=' -f2- || echo "")

if [ -z "$DATABASE_URL" ]; then
  echo "❌ 无法获取 DATABASE_URL，请手动设置:"
  echo "   export DATABASE_URL='<your-neon-connection-string>'"
  exit 1
fi

echo "✅ 已获取数据库连接"

# 执行迁移
echo "🚀 开始执行迁移..."
echo "   文件: migrations/add-missing-production-tables.sql"

psql "$DATABASE_URL" -f migrations/add-missing-production-tables.sql

if [ $? -eq 0 ]; then
  echo "✅ 迁移执行成功！"
  echo ""
  echo "📋 已创建的表:"
  echo "   - design_documents (前端设计方案)"
  echo "   - logic_maps (逻辑流程图)"
  echo "   - workspace_members (工作区成员)"
  echo "   - workspace_invitations (工作区邀请)"
  echo "   - comments (评论)"
  echo "   - activity_logs (活动日志)"
  echo "   - webhooks (Webhook)"
  echo "   - webhook_deliveries (Webhook 投递日志)"
else
  echo "❌ 迁移执行失败"
  exit 1
fi
