# 多模型向量存储架构

本文档说明如何在 ArchMind 中使用多模型向量存储功能。

## 🎯 功能特性

- ✅ **支持多个 Embedding 模型**: 同时支持 OpenAI、智谱 AI 等多个模型
- ✅ **任意维度**: 支持 1536、2048、3072 等不同维度的向量
- ✅ **灵活切换**: 可以在不删除现有数据的情况下切换默认模型
- ✅ **并存向量**: 可以为同一文档同时生成多个模型的向量进行对比
- ✅ **无损迁移**: 保留所有现有数据,向后兼容

## 📊 架构对比

### 旧架构 (单模型)
```sql
CREATE TABLE document_chunks (
  id UUID,
  content TEXT,
  embedding vector(1536),  -- 固定 OpenAI 维度
  ...
)
```

**限制:**
- 🔒 只能使用 1536 维的模型
- 🔒 切换模型需要删除所有数据
- 🔒 无法同时测试多个模型

### 新架构 (多模型)
```sql
-- 文档块表(不含向量)
CREATE TABLE document_chunks (
  id UUID,
  content TEXT,
  ...
)

-- 独立的向量存储表
CREATE TABLE document_embeddings (
  id UUID,
  chunk_id UUID,
  model_name VARCHAR(100),
  model_provider VARCHAR(50),
  model_dimensions INTEGER,
  embedding vector,  -- 不固定维度
  ...
  UNIQUE(chunk_id, model_name)
)
```

**优势:**
- ✅ 支持任意维度的模型
- ✅ 可以同时存储多个模型的向量
- ✅ 切换模型无需删除数据
- ✅ 可以对比不同模型的效果

## 🚀 快速开始

### 1. 运行迁移脚本

```bash
# 迁移到多模型架构
pnpm db:migrate-multi-model
```

这个脚本会:
1. 创建 `document_embeddings` 表
2. 为常用模型创建向量索引
3. 迁移现有的向量数据(如果有)
4. 配置默认模型为 `embedding-3` (智谱 AI, 2048 维)

### 2. 配置模型

迁移后,系统会在 `system_config` 表中创建以下配置:

```json
{
  "default": "embedding-3",
  "models": [
    {
      "name": "text-embedding-3-small",
      "provider": "openai",
      "dimensions": 1536,
      "enabled": true
    },
    {
      "name": "embedding-3",
      "provider": "zhipu",
      "dimensions": 2048,
      "enabled": true
    },
    {
      "name": "text-embedding-3-large",
      "provider": "openai",
      "dimensions": 3072,
      "enabled": false
    }
  ]
}
```

### 3. 修改默认模型 (可选)

如果想切换回 OpenAI 模型:

```sql
UPDATE system_config
SET value = jsonb_set(value, '{default}', '"text-embedding-3-small"')
WHERE key = 'embedding_models';
```

### 4. 重新上传文档

迁移后,重新上传你的文档,系统会自动使用配置的默认模型进行向量化。

## 📖 使用示例

### 使用默认模型进行向量搜索

```typescript
import { VectorDAO } from '~/lib/db/dao/vector-dao-v2'

// 使用默认模型搜索
const results = await VectorDAO.similaritySearch(
  queryEmbedding,  // 查询向量
  5,               // 返回前 5 个结果
  0.7              // 相似度阈值
)

// 结果格式
results.forEach(result => {
  console.log(`Chunk: ${result.chunkId}`)
  console.log(`Score: ${result.score}`)
  console.log(`Content: ${result.content}`)
})
```

### 使用指定模型进行搜索

```typescript
// 使用 OpenAI 模型搜索
const results = await VectorDAO.similaritySearch(
  queryEmbedding,
  5,
  0.7,
  'text-embedding-3-small'  // 指定模型名称
)
```

### 获取模型配置信息

```typescript
// 获取默认模型
const defaultModel = await VectorDAO.getDefaultModel()
console.log(defaultModel)
// {
//   name: 'embedding-3',
//   provider: 'zhipu',
//   dimensions: 2048,
//   enabled: true
// }

// 获取所有模型列表
const allModels = await VectorDAO.getEmbeddingModels()
```

### 为文档生成多个模型的向量

```typescript
import { VectorDAO } from '~/lib/db/dao/vector-dao-v2'
import { EmbeddingServiceFactory } from '~/lib/rag/embedding-adapter'

// 同时使用 OpenAI 和智谱 AI 生成向量
const openaiAdapter = await EmbeddingServiceFactory.create(
  'openai',
  process.env.OPENAI_API_KEY,
  'text-embedding-3-small'
)

const zhipuAdapter = await EmbeddingServiceFactory.create(
  'glm',
  process.env.GLM_API_KEY,
  'embedding-3'
)

// 生成两种向量
const openaiEmbedding = await openaiAdapter.embed(content)
const zhipuEmbedding = await zhipuAdapter.embed(content)

// 存储两种向量
await VectorDAO.addVector(
  chunkId,
  openaiEmbedding,
  'text-embedding-3-small',
  'openai',
  1536
)

await VectorDAO.addVector(
  chunkId,
  zhipuEmbedding,
  'embedding-3',
  'zhipu',
  2048
)
```

## 🔧 管理命令

### 统计向量数量

```typescript
// 统计所有向量
const total = await VectorDAO.count()

// 统计指定模型的向量
const zhipuCount = await VectorDAO.count('embedding-3')

// 按模型分组统计
const countByModel = await VectorDAO.countByModel()
// { 'embedding-3': 100, 'text-embedding-3-small': 50 }
```

### 删除���量

```typescript
// 删除文档的所有向量(所有模型)
await VectorDAO.deleteByChunkIds(['chunk-id-1', 'chunk-id-2'])

// 删除指定模型的所有向量
await VectorDAO.deleteByModel('text-embedding-3-small')
```

### 检查向量化状态

```typescript
// 检查是否已向量化(任意模型)
const isVectorized = await VectorDAO.isVectorized('chunk-id')

// 检查是否已向量化(指定模型)
const isZhipuVectorized = await VectorDAO.isVectorized(
  'chunk-id',
  'embedding-3'
)
```

## 🗄️ 数据库结构

### document_embeddings 表

| 字段 | 类型 | 说明 |
|-----|------|------|
| id | UUID | 主键 |
| chunk_id | UUID | 关联的文档块 ID |
| model_name | VARCHAR(100) | 模型名称 |
| model_provider | VARCHAR(50) | 模型提供商 |
| model_dimensions | INTEGER | 向量维度 |
| embedding | vector | 向量数据 |
| created_at | TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | 更新时间 |

### 索引策略

系统为每个模型创建独立的部分索引:

```sql
-- OpenAI 1536 维索引
CREATE INDEX idx_embeddings_openai_1536
ON document_embeddings
USING ivfflat ((embedding::vector(1536)) vector_cosine_ops)
WHERE model_name = 'text-embedding-3-small'
WITH (lists = 100);

-- 智谱 AI 2048 维索引
CREATE INDEX idx_embeddings_zhipu_2048
ON document_embeddings
USING ivfflat ((embedding::vector(2048)) vector_cosine_ops)
WHERE model_name = 'embedding-3'
WITH (lists = 100);
```

## 💡 最佳实践

### 1. 选择合适的模型

- **OpenAI text-embedding-3-small (1536 维)**
  - ✅ 性能好,成本低
  - ✅ 适合英文内容
  - ⚠️ 需要 OpenAI API Key

- **智谱 AI embedding-3 (2048 维)**
  - ✅ 适合中文内容
  - ✅ 国内访问速度快
  - ⚠️ 维度更高,存储空间更大

- **OpenAI text-embedding-3-large (3072 维)**
  - ✅ 最高精度
  - ❌ 成本高,速度慢
  - ❌ 存储空间大

### 2. 何时使用多模型

- **对比测试**: 评估不同模型在你的数据上的效果
- **多语言场景**: 英文用 OpenAI,中文用智谱 AI
- **渐进迁移**: 先保留旧模型向量,验证新模型效果后再删除

### 3. 存储优化

```sql
-- 如果只需要一个模型,可以删除其他模型的向量
DELETE FROM document_embeddings
WHERE model_name != 'embedding-3';

-- 清理不再使用的索引
DROP INDEX IF EXISTS idx_embeddings_openai_1536;
```

## ⚠️ 注意事项

1. **向量维度**: 查询向量的维度必须与存储的向量维度匹配
2. **索引创建**: 添加新模型时,记得创建对应的向量索引
3. **存储空间**: 多模型会增加存储空间占用
4. **API 配额**: 使用多个模型会消耗更多 API 额度

## 🔄 回退方案

如果需要回退到旧架构:

```sql
-- 1. 将向量复制回 document_chunks 表
UPDATE document_chunks dc
SET embedding = (
  SELECT e.embedding::vector(1536)
  FROM document_embeddings e
  WHERE e.chunk_id = dc.id
    AND e.model_name = 'text-embedding-3-small'
  LIMIT 1
);

-- 2. 删除新表(可选)
-- DROP TABLE document_embeddings;
```

## 📚 相关文档

- [pgvector 官方文档](https://github.com/pgvector/pgvector)
- [OpenAI Embeddings API](https://platform.openai.com/docs/guides/embeddings)
- [智谱 AI Embedding API](https://open.bigmodel.cn/dev/api#text_embedding)
