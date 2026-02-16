#!/usr/bin/env node

/**
 * 数据库迁移脚本 - 创建标签和分类表
 *
 * 用于支持文档的标签和分类管理
 *
 * 使用方式:
 * pnpm tsx scripts/create-tags-and-categories-tables.ts
 */

import 'dotenv/config'
import { dbClient } from '../lib/db/client'

async function createTagsAndCategoriesTables() {
  console.log('🔄 开始创建 tags 和 categories 表...\n')

  try {
    // ========== 1. 创建 tags 表 ==========
    console.log('1️⃣ 创建 tags 表...')
    await dbClient.query(`
      CREATE TABLE IF NOT EXISTS tags (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL UNIQUE,
        color TEXT DEFAULT '#3B82F6',
        description TEXT,
        usage_count INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `)
    console.log('   ✅ tags 表创建成功\n')

    // ========== 2. 创建 document_tags 关联表 ==========
    console.log('2️⃣ 创建 document_tags 关联表...')
    await dbClient.query(`
      CREATE TABLE IF NOT EXISTS document_tags (
        document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
        tag_id UUID REFERENCES tags(id) ON DELETE CASCADE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        PRIMARY KEY (document_id, tag_id)
      )
    `)
    console.log('   ✅ document_tags 表创建成功\n')

    // ========== 3. 创建 categories 表 ==========
    console.log('3️⃣ 创建 categories 表...')
    await dbClient.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        parent_id UUID REFERENCES categories(id) ON DELETE CASCADE,
        path TEXT NOT NULL,
        level INTEGER DEFAULT 0,
        sort_order INTEGER DEFAULT 0,
        description TEXT,
        icon TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(name, parent_id)
      )
    `)
    console.log('   ✅ categories 表创建成功\n')

    // ========== 4. 为 documents 表添加 category_id 外键 ==========
    console.log('4️⃣ 为 documents 表添加 category_id 字段...')
    await dbClient.query(`
      ALTER TABLE documents
      ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES categories(id) ON DELETE SET NULL
    `)
    console.log('   ✅ category_id 字段添加成功\n')

    // ========== 5. 创建索引 ==========
    console.log('5️⃣ 创建索引...')
    await dbClient.query(`
      CREATE INDEX IF NOT EXISTS idx_tags_name ON tags(name);
      CREATE INDEX IF NOT EXISTS idx_tags_usage_count ON tags(usage_count DESC);

      CREATE INDEX IF NOT EXISTS idx_document_tags_document ON document_tags(document_id);
      CREATE INDEX IF NOT EXISTS idx_document_tags_tag ON document_tags(tag_id);

      CREATE INDEX IF NOT EXISTS idx_categories_parent ON categories(parent_id);
      CREATE INDEX IF NOT EXISTS idx_categories_path ON categories(path);
      CREATE INDEX IF NOT EXISTS idx_categories_level ON categories(level);

      CREATE INDEX IF NOT EXISTS idx_documents_category ON documents(category_id);
    `)
    console.log('   ✅ 索引创建成功\n')

    // ========== 6. 创建触发器自动更新标签使用计数 ==========
    console.log('6️⃣ 创建触发器函数...')

    // 创建触发器函数
    await dbClient.query(`
      CREATE OR REPLACE FUNCTION update_tag_usage_count()
      RETURNS TRIGGER AS $$
      BEGIN
        IF TG_OP = 'INSERT' THEN
          UPDATE tags SET usage_count = usage_count + 1 WHERE id = NEW.tag_id;
        ELSIF TG_OP = 'DELETE' THEN
          UPDATE tags SET usage_count = usage_count - 1 WHERE id = OLD.tag_id;
        END IF;
        RETURN NULL;
      END;
      $$ LANGUAGE plpgsql;
    `)

    // 删除旧触发器（如果存在）
    await dbClient.query(`
      DROP TRIGGER IF EXISTS trg_document_tags_usage ON document_tags;
    `)

    // 创建触发器
    await dbClient.query(`
      CREATE TRIGGER trg_document_tags_usage
      AFTER INSERT OR DELETE ON document_tags
      FOR EACH ROW EXECUTE FUNCTION update_tag_usage_count();
    `)
    console.log('   ✅ 触发器创建成功\n')

    // ========== 7. 创建更新 updated_at 的触发器 ==========
    console.log('7️⃣ 创建 updated_at 自动更新触发器...')

    // 创建通用的 updated_at 触发器函数
    await dbClient.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `)

    // 为 tags 表创建触发器
    await dbClient.query(`
      DROP TRIGGER IF EXISTS trg_tags_updated_at ON tags;
      CREATE TRIGGER trg_tags_updated_at
      BEFORE UPDATE ON tags
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    `)

    // 为 categories 表创建触发器
    await dbClient.query(`
      DROP TRIGGER IF EXISTS trg_categories_updated_at ON categories;
      CREATE TRIGGER trg_categories_updated_at
      BEFORE UPDATE ON categories
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    `)
    console.log('   ✅ updated_at 触发器创建成功\n')

    // ========== 8. 插入预设分类数据 ==========
    console.log('8️⃣ 插入预设分类数据...')
    await dbClient.query(`
      INSERT INTO categories (id, name, parent_id, path, level, icon, sort_order) VALUES
      -- 技术文档
      ('11111111-1111-1111-1111-111111111111', '技术文档', NULL, '技术文档', 0, 'Code', 1),
      ('11111111-1111-1111-1111-111111111112', 'API 文档', '11111111-1111-1111-1111-111111111111', '技术文档/API 文档', 1, 'Webhook', 1),
      ('11111111-1111-1111-1111-111111111113', '架构设计', '11111111-1111-1111-1111-111111111111', '技术文档/架构设计', 1, 'Network', 2),
      ('11111111-1111-1111-1111-111111111114', '数据库设计', '11111111-1111-1111-1111-111111111111', '技术文档/数据库设计', 1, 'Database', 3),

      -- 需求文档
      ('22222222-2222-2222-2222-222222222222', '需求文档', NULL, '需求文档', 0, 'FileText', 2),
      ('22222222-2222-2222-2222-222222222223', '产品需求', '22222222-2222-2222-2222-222222222222', '需求文档/产品需求', 1, 'Target', 1),
      ('22222222-2222-2222-2222-222222222224', '用户故事', '22222222-2222-2222-2222-222222222222', '需求文档/用户故事', 1, 'Users', 2),
      ('22222222-2222-2222-2222-222222222225', '功能规格', '22222222-2222-2222-2222-222222222222', '需求文档/功能规格', 1, 'List', 3),

      -- 业务文档
      ('33333333-3333-3333-3333-333333333333', '业务文档', NULL, '业务文档', 0, 'Briefcase', 3),
      ('33333333-3333-3333-3333-333333333334', '市场分析', '33333333-3333-3333-3333-333333333333', '业务文档/市场分析', 1, 'TrendingUp', 1),
      ('33333333-3333-3333-3333-333333333335', '竞品分析', '33333333-3333-3333-3333-333333333333', '业务文档/竞品分析', 1, 'GitCompare', 2),
      ('33333333-3333-3333-3333-333333333336', '用户研究', '33333333-3333-3333-3333-333333333333', '业务文档/用户研究', 1, 'Users2', 3)
      ON CONFLICT (id) DO NOTHING
    `)
    console.log('   ✅ 预设分类数据插入成功\n')

    // ========== 9. 插入预设标签数据 ==========
    console.log('9️⃣ 插入预设标签数据...')
    await dbClient.query(`
      INSERT INTO tags (name, color, description) VALUES
      ('前端开发', '#3B82F6', '前端相关技术文档'),
      ('后端开发', '#10B981', '后端相关技术文档'),
      ('数据库', '#8B5CF6', '数据库设计和优化'),
      ('API 设计', '#F59E0B', 'RESTful API 和 GraphQL'),
      ('架构设计', '#EF4444', '系统架构和设计模式'),
      ('性能优化', '#EC4899', '性能分析和优化'),
      ('安全', '#6366F1', '安全相关文档'),
      ('测试', '#14B8A6', '测试策略和用例'),
      ('部署运维', '#F97316', 'CI/CD 和运维'),
      ('产品需求', '#06B6D4', '产品功能需求'),
      ('用户体验', '#A855F7', 'UX/UI 设计'),
      ('数据分析', '#0EA5E9', '数据统计和分析'),
      ('移动端', '#84CC16', 'iOS 和 Android'),
      ('Web', '#22C55E', 'Web 应用开发'),
      ('微服务', '#F43F5E', '微服务架构'),
      ('云服务', '#06B6D4', '云计算和 serverless'),
      ('AI/ML', '#8B5CF6', '人工智能和机器学习'),
      ('区块链', '#F59E0B', '区块链技术'),
      ('物联网', '#10B981', 'IoT 相关'),
      ('DevOps', '#EF4444', 'DevOps 实践')
      ON CONFLICT (name) DO NOTHING
    `)
    console.log('   ✅ 预设标签数据插入成功\n')

    console.log('🎉 数据库迁移完成!\n')
    console.log('📋 创建的表:')
    console.log('   - tags: 标签表')
    console.log('   - document_tags: 文档-标签关联表')
    console.log('   - categories: 分类表')
    console.log('\n📋 新增字段:')
    console.log('   - documents.category_id: 文档分类外键')
    console.log('\n📋 创建的索引:')
    console.log('   - 标签索引: name, usage_count')
    console.log('   - 关联表索引: document_id, tag_id')
    console.log('   - 分类索引: parent_id, path, level')
    console.log('\n📋 触发器:')
    console.log('   - update_tag_usage_count: 自动更新标签使用次数')
    console.log('   - update_updated_at_column: 自动更新 updated_at 字段')
    console.log('\n📋 预设数据:')
    console.log('   - 12 个预设分类（3 个顶级 + 9 个子分类）')
    console.log('   - 20 个预设标签')

  } catch (error) {
    console.error('❌ 迁移失败:', error)
    throw error
  } finally {
    await dbClient.close()
  }
}

// 运行迁移
createTagsAndCategoriesTables().catch(error => {
  console.error('\n❌ 迁移失败:', error)
  process.exit(1)
})
