-- 前端设计方案表
CREATE TABLE IF NOT EXISTS design_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  workspace_id TEXT REFERENCES workspaces(id) ON DELETE CASCADE,
  title VARCHAR(500) NOT NULL,
  feishu_url TEXT,
  feishu_doc_title VARCHAR(500),
  feishu_doc_content TEXT,
  content TEXT NOT NULL,
  model_used VARCHAR(100),
  generation_time INTEGER,
  token_count INTEGER,
  estimated_cost DECIMAL(10, 6),
  status VARCHAR(20) DEFAULT 'draft',
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_design_docs_user_id ON design_documents(user_id);
CREATE INDEX IF NOT EXISTS idx_design_docs_workspace_id ON design_documents(workspace_id);
CREATE INDEX IF NOT EXISTS idx_design_docs_created_at ON design_documents(created_at);
CREATE INDEX IF NOT EXISTS idx_design_docs_status ON design_documents(status);
