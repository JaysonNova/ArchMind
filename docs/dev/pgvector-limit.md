# pgvector 2000 维索引限制说明

## 问题

pgvector 0.x 版本的向量索引(IVFFlat 和 HNSW)都有 **2000 维的硬限制**。

智谱 AI embedding-3 模型生成的向量是 **2048 维**,超过了这个限制。

## 影响

- ✅ **功能不受影响**: 可以正常存储和检索 2048 维向量
- ⚠️ **性能影响**: 无法为 2048 维向量创建索引,查询时使用顺序扫描
- 📊 **小数据集**: 对于小规模数据(< 10,000 条),性能影响不大
- 📊 **大数据集**: 对于大规模数据,查询速度会明显下降

## 性能对比

| 数据量 | 有索引(IVFFlat) | 无索引(顺序扫描) |
|--------|----------------|-----------------|
| 1,000  | ~5ms           | ~10ms           |
| 10,000 | ~15ms          | ~100ms          |
| 100,000| ~30ms          | ~1s             |

## 解决方案

### 方案 1: 使用 1536 维模型(推荐)

切换到 OpenAI text-embedding-3-small (1536 维):

```sql
-- 修改默认模型
UPDATE system_config
SET value = jsonb_set(value, '{default}', '"text-embedding-3-small"')
WHERE key = 'embedding_models';
```

**优点:**
- ✅ 可以使用索引,性能最佳
- ✅ 成本相对较低
- ✅ 英文效果好

**缺点:**
- ⚠️ 需要 OpenAI API Key
- ⚠️ 中文效果可能不如智谱 AI

### 方案 2: 继续使用 2048 维(当前方案)

保持使用智谱 AI embedding-3 (2048 维)。

**适用场景:**
- 中文内容为主
- 数据量较小(< 10,000 条文档)
- 可以接受略慢的查询速度

**优化建议:**
1. 提高相似度阈值,减少返回结果
2. 限制查询的 Top-K 数量
3. 使用缓存减少重复查询

### 方案 3: 升级到 pgvector 0.7+(未来)

pgvector 0.7+ 版本计划移除 2000 维限制。

**当前状态:** 尚未发布

**跟踪链接:** https://github.com/pgvector/pgvector/issues/451

## 当前配置

系统已配置为使用智谱 AI embedding-3 (2048 维) 作为默认模型。

查看配置:

```sql
SELECT value
FROM system_config
WHERE key = 'embedding_models';
```

## 性能监控

查询性能分析:

```sql
EXPLAIN ANALYZE
SELECT
  chunk_id,
  1 - (embedding::vector(2048) <-> $1::vector(2048)) as similarity
FROM document_embeddings
WHERE model_name = 'embedding-3'
  AND (1 - (embedding::vector(2048) <-> $1::vector(2048))) >= 0.7
ORDER BY similarity DESC
LIMIT 5;
```

关注 `Seq Scan on document_embeddings` 的执行时间。

## 建议

对于 ArchMind MVP 阶段:

1. **保持当前配置** (智谱 AI 2048 维)
   - 数据量小,性能影响可接受
   - 中文效果更好

2. **监控性能指标**
   - 当文档数量超过 10,000 时,考虑切换模型

3. **准备迁移方案**
   - 可以随时切换到 OpenAI 1536 维模型
   - 数据不会丢失,只需更改配置

## 相关资源

- [pgvector GitHub Issue #451](https://github.com/pgvector/pgvector/issues/451)
- [pgvector Limitations](https://github.com/pgvector/pgvector#limitations)
