-- Logic Maps 表
CREATE TABLE IF NOT EXISTS logic_maps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  prd_id UUID NOT NULL,
  nodes_data JSONB NOT NULL,
  edges_data JSONB NOT NULL,
  summary TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (prd_id) REFERENCES prd_documents(id) ON DELETE CASCADE
);

-- 为 prd_id 创建唯一索引(一个 PRD 只有一个最新的 Logic Map)
CREATE UNIQUE INDEX IF NOT EXISTS idx_logic_maps_prd_id ON logic_maps(prd_id);

-- 为查询优化创建索引
CREATE INDEX IF NOT EXISTS idx_logic_maps_created_at ON logic_maps(created_at);
