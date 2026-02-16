# MinIO 对象存储部署指南

## 快速开始

### 1. 启动 MinIO 服务

```bash
# 在项目根目录执行
docker-compose -f docker-compose.minio.yml up -d
```

### 2. 初始化存储桶

```bash
# 确保已安装 MinIO Client (mc)
# macOS: brew install minio/stable/mc
# Linux: https://min.io/docs/minio/linux/reference/minio-mc.html

# 运行初始化脚本
./scripts/init-minio.sh
```

### 3. 访问 MinIO Console

- URL: http://localhost:9001
- 用户名: `minioadmin`
- 密码: `minioadmin123`

## 存储桶说明

- **archmind-documents**: 主文档存储桶,永久保存
- **archmind-temp**: 临时文件存储桶,7天后自动删除
- **archmind-backups**: 备份文件存储桶

## 对象命名规范

文件在 MinIO 中的路径格式:
```
{year}/{month}/{uuid}_{original_filename}
```

示例:
```
2024/02/a1b2c3d4-e5f6-7890-abcd-ef1234567890_技术架构文档.pdf
```

## 停止服务

```bash
docker-compose -f docker-compose.minio.yml down
```

## 清除数据

```bash
# 停止服务并删除数据卷
docker-compose -f docker-compose.minio.yml down -v
```

## 故障排查

### 端口冲突

如果端口 9000 或 9001 已被占用,修改 `docker-compose.minio.yml`:

```yaml
ports:
  - "19000:9000"  # 修改为其他端口
  - "19001:9001"
```

同时更新 `.env` 中的 `MINIO_ENDPOINT`:
```
MINIO_ENDPOINT=localhost:19000
```

### 连接失败

1. 检查 Docker 服务是否运行:
```bash
docker ps | grep minio
```

2. 查看 MinIO 日志:
```bash
docker logs archmind-minio
```

3. 测试连接:
```bash
mc alias set local http://localhost:9000 minioadmin minioadmin123
mc ls local/
```
