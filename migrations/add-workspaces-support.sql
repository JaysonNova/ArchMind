-- 工作区表
CREATE TABLE IF NOT EXISTS workspaces (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT DEFAULT '📁',
  color TEXT DEFAULT '#3B82F6',
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建默认工作区
INSERT INTO workspaces (id, name, description, icon, color, is_default)
VALUES ('default', '默认工作区', '系统默认工作区，用于组织您的项目和文档', '🏠', '#3B82F6', TRUE)
ON CONFLICT (id) DO NOTHING;

-- 为现有表添加 workspace_id 字段
ALTER TABLE documents ADD COLUMN IF NOT EXISTS workspace_id TEXT DEFAULT 'default' REFERENCES workspaces(id) ON DELETE CASCADE;
ALTER TABLE prd_documents ADD COLUMN IF NOT EXISTS workspace_id TEXT DEFAULT 'default' REFERENCES workspaces(id) ON DELETE CASCADE;

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_documents_workspace_id ON documents(workspace_id);
CREATE INDEX IF NOT EXISTS idx_prd_documents_workspace_id ON prd_documents(workspace_id);
CREATE INDEX IF NOT EXISTS idx_workspaces_is_default ON workspaces(is_default);

-- 更新已有数据的 workspace_id 为 'default'
UPDATE documents SET workspace_id = 'default' WHERE workspace_id IS NULL;
UPDATE prd_documents SET workspace_id = 'default' WHERE workspace_id IS NULL;

-- 创建系统配置项用于存储当前活跃工作区
INSERT INTO system_config (key, value, description, updated_at)
VALUES ('active_workspace_id', '"default"', '当前活跃的工作区 ID', CURRENT_TIMESTAMP)
ON CONFLICT (key) DO NOTHING;
