-- ============================================
-- 资源管理模块数据库迁移
-- 执行时间: 2024
-- 描述: 添加资源表和 PRD-资源关联表
-- ============================================

-- 创建资源表
CREATE TABLE IF NOT EXISTS assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,

  -- 基本信息
  title VARCHAR(500) NOT NULL,
  description TEXT,

  -- 文件信息
  file_name VARCHAR(500) NOT NULL,
  file_type VARCHAR(50) NOT NULL,
  file_size INTEGER NOT NULL,

  -- 存储信息
  storage_provider VARCHAR(50) DEFAULT 'minio',
  storage_bucket VARCHAR(200),
  storage_key VARCHAR(1000) NOT NULL,
  content_hash VARCHAR(64),

  -- 资源来源
  source VARCHAR(20) NOT NULL CHECK (source IN ('upload', 'ai-generated')),

  -- AI 生成相关
  generation_prompt TEXT,
  model_used VARCHAR(100),

  -- 元数据
  metadata JSONB DEFAULT '{}'::jsonb,

  -- 时间戳
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_assets_user_id ON assets(user_id);
CREATE INDEX IF NOT EXISTS idx_assets_source ON assets(source);
CREATE INDEX IF NOT EXISTS idx_assets_created_at ON assets(created_at);
CREATE INDEX IF NOT EXISTS idx_assets_content_hash ON assets(content_hash);

-- 创建 PRD-资源关联表
CREATE TABLE IF NOT EXISTS prd_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prd_id UUID NOT NULL REFERENCES prd_documents(id) ON DELETE CASCADE,
  asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,

  -- 关联元数据
  added_by VARCHAR(20) DEFAULT 'manual' CHECK (added_by IN ('manual', 'ai-generated')),
  sort_order INTEGER DEFAULT 0,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- 确保 PRD 和资源的组合唯一
  UNIQUE(prd_id, asset_id)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_prd_assets_prd_id ON prd_assets(prd_id);
CREATE INDEX IF NOT EXISTS idx_prd_assets_asset_id ON prd_assets(asset_id);

-- 添加注释
COMMENT ON TABLE assets IS '资源表 - 存储图片、设计稿等素材';
COMMENT ON TABLE prd_assets IS 'PRD-资源关联表';
COMMENT ON COLUMN assets.source IS '资源来源: upload(手动上传) | ai-generated(AI生成)';
COMMENT ON COLUMN assets.generation_prompt IS 'AI 生成时使用的提示词';
COMMENT ON COLUMN assets.content_hash IS '文件内容哈希值,用于去重';
COMMENT ON COLUMN prd_assets.added_by IS '添加方式: manual(手动) | ai-generated(AI生成)';
COMMENT ON COLUMN prd_assets.sort_order IS '显示排序,数字越小越靠前';
