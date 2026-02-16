#!/bin/bash

echo "初始化 MinIO 存储桶..."

# 设置 MinIO alias
mc alias set local http://localhost:9000 minioadmin minioadmin123

# 创建存储桶
echo "创建主文档存储桶..."
mc mb local/archmind-documents 2>/dev/null || echo "archmind-documents bucket already exists"

echo "创建临时文件存储桶..."
mc mb local/archmind-temp 2>/dev/null || echo "archmind-temp bucket already exists"

echo "创建备份存储桶..."
mc mb local/archmind-backups 2>/dev/null || echo "archmind-backups bucket already exists"

# 设置生命周期策略（temp bucket 7天后自动删除）
echo "设置临时文件过期策略..."
mc ilm add local/archmind-temp --expiry-days 7 2>/dev/null || echo "Lifecycle policy already exists"

# 设置访问策略
echo "配置访问策略..."
mc anonymous set download local/archmind-documents 2>/dev/null || echo "Policy already set"

echo "✅ MinIO 存储桶初始化完成"
echo ""
echo "访问 MinIO Console: http://localhost:9001"
echo "用户名: minioadmin"
echo "密码: minioadmin123"
