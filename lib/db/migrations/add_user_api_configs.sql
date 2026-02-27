-- 用户 API 配置表（存储用户配置的第三方模型 API Key）
CREATE TABLE IF NOT EXISTS user_api_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider VARCHAR(50) NOT NULL,
    api_key_encrypted TEXT,
    base_url VARCHAR(500),
    models JSONB DEFAULT '[]'::jsonb,
    enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_api_configs_user_id ON user_api_configs(user_id);
CREATE INDEX IF NOT EXISTS idx_user_api_configs_provider ON user_api_configs(provider);
CREATE INDEX IF NOT EXISTS idx_user_api_configs_enabled ON user_api_configs(enabled);
CREATE UNIQUE INDEX IF NOT EXISTS unique_user_provider ON user_api_configs(user_id, provider);

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_user_api_configs_updated_at ON user_api_configs;
CREATE TRIGGER update_user_api_configs_updated_at
    BEFORE UPDATE ON user_api_configs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
