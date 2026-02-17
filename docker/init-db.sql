-- 启用 pgvector 扩展
CREATE EXTENSION IF NOT EXISTS vector;

-- 创建全文搜索配置（中文支持）
CREATE TEXT SEARCH CONFIGURATION IF NOT EXISTS chinese_zh (COPY = simple);

-- 授权
GRANT ALL PRIVILEGES ON DATABASE archmind TO archmind;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO archmind;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO archmind;

-- 初始化完成提示
DO $$
BEGIN
    RAISE NOTICE 'ArchMind 数据库初始化完成';
END $$;
