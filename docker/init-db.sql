-- ArchMind AI - 数据库初始化脚本
-- 由 PostgreSQL 容器启动时自动执行（docker-entrypoint-initdb.d）

-- ============================================
-- 启用必要的扩展
-- ============================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- 全文搜索配置（中文支持）
CREATE TEXT SEARCH CONFIGURATION IF NOT EXISTS chinese_zh (COPY = simple);

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
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- ============================================
-- 工作区表
-- ============================================
CREATE TABLE IF NOT EXISTS workspaces (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(200) NOT NULL,
  description TEXT,
  owner_id UUID REFERENCES users(id) ON DELETE CASCADE,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_workspaces_owner_id ON workspaces(owner_id);

-- ============================================
-- 工作区成员表
-- ============================================
CREATE TABLE IF NOT EXISTS workspace_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(20) DEFAULT 'member',
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(workspace_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_workspace_members_workspace_id ON workspace_members(workspace_id);
CREATE INDEX IF NOT EXISTS idx_workspace_members_user_id ON workspace_members(user_id);

-- ============================================
-- 文档表
-- ============================================
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(500) NOT NULL,
  file_path TEXT NOT NULL,
  file_type VARCHAR(20) NOT NULL,
  file_size INTEGER NOT NULL,
  content TEXT,
  metadata JSONB DEFAULT '{}',
  status VARCHAR(20) DEFAULT 'uploaded',
  search_vector tsvector,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_documents_workspace_id ON documents(workspace_id);
CREATE INDEX IF NOT EXISTS idx_documents_user_id ON documents(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_status ON documents(status);
CREATE INDEX IF NOT EXISTS idx_documents_created_at ON documents(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_documents_metadata ON documents USING gin(metadata);
CREATE INDEX IF NOT EXISTS idx_documents_title_trgm ON documents USING gin(title gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_documents_search ON documents USING GIN(search_vector);

-- ============================================
-- 文档版本表
-- ============================================
CREATE TABLE IF NOT EXISTS document_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  content TEXT,
  file_path TEXT,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_document_versions_document_id ON document_versions(document_id);

-- ============================================
-- 文档块表（用于向量检索）
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

-- 向量相似度搜索索引（IVFFlat）
CREATE INDEX IF NOT EXISTS idx_chunks_embedding_ivfflat
ON document_chunks
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- ============================================
-- PRD 文档表
-- ============================================
CREATE TABLE IF NOT EXISTS prd_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
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

CREATE INDEX IF NOT EXISTS idx_prd_workspace_id ON prd_documents(workspace_id);
CREATE INDEX IF NOT EXISTS idx_prd_user_id ON prd_documents(user_id);
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
-- PRD 向量块表（用于 RAG 检索）
-- ============================================
CREATE TABLE IF NOT EXISTS prd_chunks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  prd_id UUID NOT NULL,
  chunk_index INTEGER NOT NULL,
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_prd_chunks_prd_id ON prd_chunks(prd_id);

-- ============================================
-- 对话表
-- ============================================
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(500) NOT NULL,
  summary TEXT,
  message_count INTEGER DEFAULT 0,
  prd_id UUID REFERENCES prd_documents(id) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_conversations_workspace_id ON conversations(workspace_id);
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
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  prd_id UUID REFERENCES prd_documents(id) ON DELETE SET NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(500) NOT NULL,
  description TEXT,
  current_version INTEGER DEFAULT 1,
  status VARCHAR(20) DEFAULT 'draft',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_prototypes_workspace_id ON prototypes(workspace_id);
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
-- 用户 API 配置表
-- ============================================
CREATE TABLE IF NOT EXISTS user_api_configs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  provider VARCHAR(50) NOT NULL,
  api_key_encrypted TEXT NOT NULL,
  model_preferences JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, provider)
);

CREATE INDEX IF NOT EXISTS idx_user_api_configs_user_id ON user_api_configs(user_id);

-- ============================================
-- 标签表
-- ============================================
CREATE TABLE IF NOT EXISTS tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  color VARCHAR(20),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(workspace_id, name)
);

-- ============================================
-- 分类表
-- ============================================
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  parent_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(workspace_id, name)
);

-- ============================================
-- 逻辑图表
-- ============================================
CREATE TABLE IF NOT EXISTS logic_maps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  prd_id UUID REFERENCES prd_documents(id) ON DELETE SET NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(500) NOT NULL,
  content JSONB NOT NULL DEFAULT '{}',
  status VARCHAR(20) DEFAULT 'draft',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_logic_maps_workspace_id ON logic_maps(workspace_id);
CREATE INDEX IF NOT EXISTS idx_logic_maps_prd_id ON logic_maps(prd_id);

-- ============================================
-- 系统配置表
-- ============================================
CREATE TABLE IF NOT EXISTS system_config (
  key VARCHAR(100) PRIMARY KEY,
  value JSONB NOT NULL,
  description TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

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
-- 自动更新 updated_at 触发器函数
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'users', 'workspaces', 'documents', 'prd_documents',
    'conversations', 'prototypes', 'prototype_pages',
    'user_api_configs', 'logic_maps'
  ] LOOP
    EXECUTE format('
      DROP TRIGGER IF EXISTS update_%s_updated_at ON %s;
      CREATE TRIGGER update_%s_updated_at
        BEFORE UPDATE ON %s
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    ', t, t, t, t);
  END LOOP;
END;
$$;

-- ============================================
-- 授权
-- ============================================
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO archmind;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO archmind;

DO $$
BEGIN
  RAISE NOTICE 'ArchMind 数据库初始化完成';
END $$;
