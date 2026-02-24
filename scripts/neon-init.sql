-- ============================================
-- ArchMind 数据库完整初始化脚本（Neon 专用）
-- 在 Neon 控制台 SQL Editor 中执行此脚本
-- ============================================

-- 启用扩展（Neon 已内置 pgvector，无需手动安装 uuid-ossp）
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ============================================
-- 用户表
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(100),
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT true,
  reset_token VARCHAR(255),
  reset_token_expires TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_reset_token ON users(reset_token);

-- ============================================
-- 工作区表
-- ============================================
CREATE TABLE IF NOT EXISTS workspaces (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  icon VARCHAR(10) DEFAULT '📁',
  color VARCHAR(20) DEFAULT '#3B82F6',
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_workspaces_is_default ON workspaces(is_default);

-- 创建默认工作区
INSERT INTO workspaces (name, description, icon, color, is_default)
VALUES ('默认工作区', '系统默认工作区，用于组织您的项目和文档', '🏠', '#3B82F6', true)
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- 文档表
-- ============================================
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  title VARCHAR(500) NOT NULL,
  file_path TEXT NOT NULL,
  file_type VARCHAR(20) NOT NULL,
  file_size INTEGER NOT NULL,
  content TEXT,
  content_hash VARCHAR(64),
  storage_provider VARCHAR(50),
  storage_bucket VARCHAR(200),
  storage_key VARCHAR(1000),
  processing_status VARCHAR(20) DEFAULT 'pending',
  metadata JSONB DEFAULT '{}',
  status VARCHAR(20) DEFAULT 'uploaded',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_documents_user_id ON documents(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_workspace_id ON documents(workspace_id);
CREATE INDEX IF NOT EXISTS idx_documents_status ON documents(status);
CREATE INDEX IF NOT EXISTS idx_documents_created_at ON documents(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_documents_metadata ON documents USING gin(metadata);
CREATE INDEX IF NOT EXISTS idx_documents_title_trgm ON documents USING gin(title gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_documents_content_hash ON documents(content_hash);

-- ============================================
-- 文档块表（向量检索）
-- ============================================
CREATE TABLE IF NOT EXISTS document_chunks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
  chunk_index INTEGER NOT NULL,
  content TEXT NOT NULL,
  embedding vector(1536),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_chunks_document_id ON document_chunks(document_id);

-- 向量索引（注意：Neon 免费版数据量不大时可跳过此步，后续数据多了再加）
-- CREATE INDEX IF NOT EXISTS idx_chunks_embedding_ivfflat
-- ON document_chunks
-- USING ivfflat (embedding vector_cosine_ops)
-- WITH (lists = 100);

-- ============================================
-- PRD 文档表
-- ============================================
CREATE TABLE IF NOT EXISTS prd_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  title VARCHAR(500) NOT NULL,
  content TEXT NOT NULL,
  user_input TEXT NOT NULL,
  model_used VARCHAR(100) NOT NULL,
  generation_time INTEGER,
  token_count INTEGER,
  estimated_cost DECIMAL(10, 4),
  status VARCHAR(20) DEFAULT 'draft',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_prd_user_id ON prd_documents(user_id);
CREATE INDEX IF NOT EXISTS idx_prd_workspace_id ON prd_documents(workspace_id);
CREATE INDEX IF NOT EXISTS idx_prd_created_at ON prd_documents(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_prd_model_used ON prd_documents(model_used);

-- ============================================
-- PRD 文档引用表
-- ============================================
CREATE TABLE IF NOT EXISTS prd_document_references (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  prd_id UUID REFERENCES prd_documents(id) ON DELETE CASCADE,
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
  relevance_score DECIMAL(5, 4),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(prd_id, document_id)
);

CREATE INDEX IF NOT EXISTS idx_prd_refs_prd_id ON prd_document_references(prd_id);
CREATE INDEX IF NOT EXISTS idx_prd_refs_document_id ON prd_document_references(document_id);

-- ============================================
-- 系统配置表
-- ============================================
CREATE TABLE IF NOT EXISTS system_config (
  key VARCHAR(100) PRIMARY KEY,
  value JSONB NOT NULL,
  description TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO system_config (key, value, description, updated_at)
VALUES ('active_workspace_id', '"default"', '当前活跃的工作区 ID', CURRENT_TIMESTAMP)
ON CONFLICT (key) DO NOTHING;

-- ============================================
-- 用户 API 配置表
-- ============================================
CREATE TABLE IF NOT EXISTS user_api_configs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  provider VARCHAR(50) NOT NULL,
  api_key_encrypted TEXT NOT NULL,
  base_url TEXT,
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, provider)
);

-- ============================================
-- 对话表
-- ============================================
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(500) NOT NULL,
  summary TEXT,
  message_count INTEGER DEFAULT 0,
  prd_id UUID REFERENCES prd_documents(id) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_created_at ON conversations(created_at);

-- ============================================
-- 对话消息表
-- ============================================
CREATE TABLE IF NOT EXISTS conversation_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL,
  content TEXT NOT NULL,
  model_used VARCHAR(100),
  use_rag BOOLEAN DEFAULT false,
  document_ids TEXT,
  prd_content TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_conv_msgs_conversation_id ON conversation_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conv_msgs_role ON conversation_messages(role);

-- ============================================
-- 原型表
-- ============================================
CREATE TABLE IF NOT EXISTS prototypes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  prd_id UUID REFERENCES prd_documents(id) ON DELETE SET NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(500) NOT NULL,
  description TEXT,
  current_version INTEGER DEFAULT 1,
  device_type VARCHAR(20) DEFAULT 'responsive',
  status VARCHAR(20) DEFAULT 'draft',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_device_type CHECK (device_type IN ('desktop', 'tablet', 'mobile', 'responsive'))
);

CREATE INDEX IF NOT EXISTS idx_prototypes_prd_id ON prototypes(prd_id);
CREATE INDEX IF NOT EXISTS idx_prototypes_user_id ON prototypes(user_id);
CREATE INDEX IF NOT EXISTS idx_prototypes_created_at ON prototypes(created_at DESC);

-- ============================================
-- 原型页面表
-- ============================================
CREATE TABLE IF NOT EXISTS prototype_pages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  prototype_id UUID REFERENCES prototypes(id) ON DELETE CASCADE NOT NULL,
  page_name VARCHAR(200) NOT NULL,
  page_slug VARCHAR(100) NOT NULL,
  html_content TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  is_entry_page BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_prototype_pages_prototype_id ON prototype_pages(prototype_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_prototype_pages_slug ON prototype_pages(prototype_id, page_slug);

-- ============================================
-- 原型版本表
-- ============================================
CREATE TABLE IF NOT EXISTS prototype_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  prototype_id UUID REFERENCES prototypes(id) ON DELETE CASCADE NOT NULL,
  version_number INTEGER NOT NULL,
  pages_snapshot JSONB NOT NULL,
  commit_message TEXT,
  model_used VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_prototype_versions_prototype_id ON prototype_versions(prototype_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_prototype_versions_number ON prototype_versions(prototype_id, version_number);

-- ============================================
-- 生成历史表
-- ============================================
CREATE TABLE IF NOT EXISTS generation_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  prd_id UUID REFERENCES prd_documents(id) ON DELETE SET NULL,
  model_used VARCHAR(100) NOT NULL,
  user_input TEXT NOT NULL,
  token_count INTEGER,
  estimated_cost DECIMAL(10, 4),
  generation_time INTEGER,
  status VARCHAR(20) NOT NULL,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_history_created_at ON generation_history(created_at DESC);

-- ============================================
-- 资源表
-- ============================================
CREATE TABLE IF NOT EXISTS assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(500) NOT NULL,
  description TEXT,
  file_name VARCHAR(500) NOT NULL,
  file_type VARCHAR(50) NOT NULL,
  file_size INTEGER NOT NULL,
  storage_provider VARCHAR(50) DEFAULT 'huawei-obs',
  storage_bucket VARCHAR(200),
  storage_key VARCHAR(1000) NOT NULL,
  content_hash VARCHAR(64),
  source VARCHAR(20) NOT NULL CHECK (source IN ('upload', 'ai-generated')),
  generation_prompt TEXT,
  model_used VARCHAR(100),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_assets_user_id ON assets(user_id);
CREATE INDEX IF NOT EXISTS idx_assets_source ON assets(source);
CREATE INDEX IF NOT EXISTS idx_assets_created_at ON assets(created_at);
CREATE INDEX IF NOT EXISTS idx_assets_content_hash ON assets(content_hash);

-- ============================================
-- PRD-资源关联表
-- ============================================
CREATE TABLE IF NOT EXISTS prd_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prd_id UUID NOT NULL REFERENCES prd_documents(id) ON DELETE CASCADE,
  asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  added_by VARCHAR(20) DEFAULT 'manual' CHECK (added_by IN ('manual', 'ai-generated')),
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(prd_id, asset_id)
);

CREATE INDEX IF NOT EXISTS idx_prd_assets_prd_id ON prd_assets(prd_id);
CREATE INDEX IF NOT EXISTS idx_prd_assets_asset_id ON prd_assets(asset_id);

-- ============================================
-- 审计日志表
-- ============================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(50),
  resource_id UUID,
  status VARCHAR(20) NOT NULL DEFAULT 'success',
  ip_address INET,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}',
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_workspace_id ON audit_logs(workspace_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- ============================================
-- 自动更新 updated_at 触发器
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_workspaces_updated_at ON workspaces;
CREATE TRIGGER update_workspaces_updated_at BEFORE UPDATE ON workspaces FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_documents_updated_at ON documents;
CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON documents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_prd_documents_updated_at ON prd_documents;
CREATE TRIGGER update_prd_documents_updated_at BEFORE UPDATE ON prd_documents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_conversations_updated_at ON conversations;
CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON conversations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_prototypes_updated_at ON prototypes;
CREATE TRIGGER update_prototypes_updated_at BEFORE UPDATE ON prototypes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_prototype_pages_updated_at ON prototype_pages;
CREATE TRIGGER update_prototype_pages_updated_at BEFORE UPDATE ON prototype_pages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_api_configs_updated_at ON user_api_configs;
CREATE TRIGGER update_user_api_configs_updated_at BEFORE UPDATE ON user_api_configs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_assets_updated_at ON assets;
CREATE TRIGGER update_assets_updated_at BEFORE UPDATE ON assets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
