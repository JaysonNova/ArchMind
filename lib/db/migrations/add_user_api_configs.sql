-- 添加用户 API 配置表
-- 用于存储用户配置的第三方模型 API Key

-- 创建 user_api_configs 表
CREATE TABLE IF NOT EXISTS user_api_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider VARCHAR(50) NOT NULL UNIQUE,
    api_key_encrypted TEXT,
    base_url VARCHAR(500),
    enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_user_api_configs_provider ON user_api_configs(provider);
CREATE INDEX IF NOT EXISTS idx_user_api_configs_enabled ON user_api_configs(enabled);

-- 添加更新时间触发器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_api_configs_updated_at
    BEFORE UPDATE ON user_api_configs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 插入默认配置（从环境变量迁移）
-- 注意：实际数据需要通过应用程序插入，这里只是创建表结构
