# PostgreSQL 数据库迁移指南

## 文档版本信息

* **版本：** v1.0
* **创建日期：** 2026-02-02
* **最后更新：** 2026-02-02
* **文档状态：** Draft

---

## 1. 迁移概述

### 1.1 迁移目标

将 ArchMind AI 的数据库从 **SQLite + sqlite-vss** 迁移到 **PostgreSQL + pgvector**，以支持：

- 更强大的向量搜索能力
- 更好的并发性能
- 多用户支持准备
- 更丰富的数据类型（JSONB、UUID等）
- 更完善的索引和查询优化

### 1.2 迁移优势

| 特性 | SQLite + sqlite-vss | PostgreSQL + pgvector |
|------|---------------------|----------------------|
| **向量搜索** | 基础支持 | 原生支持，性能更优 |
| **并发性能** | 写入锁定 | 多版本并发控制 |
| **数据类型** | 有限 | 丰富（JSONB、UUID、Array等） |
| **索引类型** | 基础索引 | IVFFlat、HNSW、GIN、GiST等 |
| **扩展性** | 单机 | 支持复制、分区、集群 |
| **生态系统** | 有限 | 丰富的工具和扩展 |

### 1.3 迁移范围

- 数据库 Schema 重新设计
- 数据迁移脚本
- ORM 层更新（使用 Drizzle ORM）
- API 层适配
- 环境配置更新

---

## 2. PostgreSQL 安装配置

### 2.1 macOS 安装

```bash
# 使用 Homebrew 安装 PostgreSQL
brew install postgresql@15

# 启动 PostgreSQL 服务
brew services start postgresql@15

# 创建数据库
createdb archmind

# 验证安装
psql archmind -c "SELECT version();"
```

### 2.2 安装 pgvector 扩展

```bash
# 克隆 pgvector 仓库
cd /tmp
git clone https://github.com/pgvector/pgvector.git
cd pgvector

# 编译安装
make
make install

# 在数据库中启用扩展
psql archmind -c "CREATE EXTENSION vector;"

# 验证安装
psql archmind -c "SELECT * FROM pg_extension WHERE extname = 'vector';"
```

### 2.3 Linux 安装

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install postgresql-15 postgresql-contrib

# 启动服务
sudo systemctl start postgresql
sudo systemctl enable postgresql

# 创建数据库
sudo -u postgres createdb archmind

# 安装 pgvector
sudo apt install postgresql-15-pgvector
```

### 2.4 Docker 安装（推荐用于开发）

```yaml
# docker-compose.yml
version: '3.8'

services:
  postgres:
    image: pgvector/pgvector:pg15
    container_name: archmind-postgres
    environment:
      POSTGRES_DB: archmind
      POSTGRES_USER: archmind_user
      POSTGRES_PASSWORD: your_secure_password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./scripts/init-postgres.sql:/docker-entrypoint-initdb.d/init.sql
    restart: unless-stopped

volumes:
  postgres_data:
```

```bash
# 启动 Docker 容器
docker-compose up -d

# 查看日志
docker-compose logs -f postgres

# 连接数据库
docker exec -it archmind-postgres psql -U archmind_user -d archmind
```

---

## 3. 数据库 Schema 设计

### 3.1 完整 Schema

创建文件 `scripts/init-postgres.sql`：

```sql
-- ============================================
-- 启用必要的扩展
-- ============================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";  -- 全文搜索

-- ============================================
-- 用户表（为未来多用户做准备）
-- ============================================
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(100),
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);

-- ============================================
-- 文档表
-- ============================================
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(500) NOT NULL,
  file_path TEXT NOT NULL,
  file_type VARCHAR(20) NOT NULL,
  file_size INTEGER NOT NULL,
  content TEXT,
  metadata JSONB DEFAULT '{}',
  status VARCHAR(20) DEFAULT 'uploaded',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_documents_user_id ON documents(user_id);
CREATE INDEX idx_documents_status ON documents(status);
CREATE INDEX idx_documents_created_at ON documents(created_at DESC);
CREATE INDEX idx_documents_metadata ON documents USING gin(metadata);
CREATE INDEX idx_documents_title_trgm ON documents USING gin(title gin_trgm_ops);
```

---

## 4. 数据迁移策略

### 4.1 迁移步骤概览

```
1. 备份现有 SQLite 数据
   ↓
2. 安装配置 PostgreSQL + pgvector
   ↓
3. 执行 Schema 初始化
   ↓
4. 运行数据迁移脚本
   ↓
5. 验证数据完整性
   ↓
6. 更新应用配置
   ↓
7. 测试应用功能
```

### 4.2 数据备份

```bash
# 备份 SQLite 数据库
cp ./data/database.db ./data/database.db.backup

# 导出为 SQL（可选）
sqlite3 ./data/database.db .dump > ./data/sqlite-backup.sql
```

---

## 5. 下一步

本文档将在后续部分详细说明：

- 数据迁移脚本实现
- ORM 层配置（Drizzle ORM）
- API 层适配
- 性能优化建议
- 常见问题解决

---

**文档维护：**
- 本文档将随着迁移进展持续更新
- 遇到问题请记录到文档中
