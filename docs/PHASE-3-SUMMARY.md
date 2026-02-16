* # Phase 3 完成总结 - 状态追踪与日志系统

## ✅ 已完成的工作

### 1. 处理日志表

**文件**: [scripts/create-processing-logs-table.ts](/Users/chenqi/code/ArchMind/scripts/create-processing-logs-table.ts)

**表结构:**
```sql
CREATE TABLE document_processing_logs (
  id UUID PRIMARY KEY,
  document_id UUID REFERENCES documents(id),
  stage TEXT,  -- upload/extract/chunk/embed/store/complete/error
  status TEXT,  -- start/progress/complete/error
  message TEXT,
  metadata JSONB,
  duration_ms INTEGER,
  created_at TIMESTAMP
)
```

**运行迁移:**
```bash
pnpm tsx scripts/create-processing-logs-table.ts
```

---

### 2. ProcessingLogDAO

**文件**: [lib/db/dao/processing-log-dao.ts](/Users/chenqi/code/ArchMind/lib/db/dao/processing-log-dao.ts)

**提供的方法:**
- `create()` - 创建日志记录
- `findByDocumentId()` - 查询文档的所有日志
- `findRecent()` - 查询最近的日志
- `deleteByDocumentId()` - 删除文档的日志
- `cleanupOldLogs(days)` - 清理旧日志

---

### 3. RAG Pipeline 增强

**文件**: [lib/rag/pipeline.ts](/Users/chenqi/code/ArchMind/lib/rag/pipeline.ts)

**添加的日志记录:**

1. **分块阶段 (chunk)**
   - 记录开始时间
   - 记录分块数量和内容长度
   - 记录耗时

2. **存储块阶段 (store)**
   - 记录开始存储
   - 记录存储的块数量
   - 记录耗时

3. **向量化阶段 (embed)**
   - 记录开始向量化
   - 记录使用的模型信息
   - 记录生成的向量数量
   - 记录耗时

4. **存储向量阶段 (store)**
   - 记录向量存储
   - 记录存储的向量数量
   - 记录耗时

5. **完成阶段 (complete)**
   - 记录总耗时
   - 记录最终统计信息

6. **错误处理 (error)**
   - 记录错误信息和堆栈跟踪

**日志示例:**
```typescript
{
  id: "xxx",
  documentId: "doc-123",
  stage: "chunk",
  status: "complete",
  message: "Split document into 15 chunks",
  metadata: {
    chunksCount: 15,
    contentLength: 5000
  },
  durationMs: 120,
  createdAt: "2024-02-10T..."
}
```

---

### 4. 日志查询 API

**文件**: [server/api/documents/[id]/logs.get.ts](/Users/chenqi/code/ArchMind/server/api/documents/[id]/logs.get.ts)

**功能:**
- 查询文档处理过程中的所有日志
- 按时间顺序返回
- 包含每个阶段的耗时

**API 响应:**
```typescript
{
  success: true,
  data: {
    documentId: string,
    logs: [
      {
        id: string,
        stage: string,
        status: string,
        message: string,
        metadata: object,
        durationMs: number,
        timestamp: string
      }
    ],
    total: number
  }
}
```

**使用方式:**
```bash
GET /api/documents/{documentId}/logs
```

---

## 🔄 处理流程

```
1. chunk (start)    → "Starting document processing"
2. chunk (complete) → "Split document into 15 chunks" [120ms]
3. store (start)    → "Storing document chunks"
4. store (complete) → "Stored 15 chunk records" [450ms]
5. embed (start)    → "Generating embeddings for 15 chunks"
6. embed (complete) → "Generated 15 embeddings" [2500ms]
7. store (start)    → "Storing vectors"
8. store (complete) → "Stored 15 vectors" [300ms]
9. complete (complete) → "Processing completed successfully" [3370ms]
```

如果出错:
```
error (error) → "Error message with stack trace"
```

---

## 🎯 核心改进

### 1. 完整的处理追踪

每个文档处理步骤都被详细记录：
- ✅ 什么时候开始
- ✅ 处理了什么
- ✅ 耗时多少
- ✅ 结果如何

### 2. 性能分析

通过 `duration_ms` 字段可以：
- 识别性能瓶颈
- 优化慢速步骤
- 监控系统健康

### 3. 问题诊断

当处理失败时：
- 可以看到具体在哪一步失败
- 错误信息和堆栈跟踪
- 元数据帮助复现问题

### 4. 用户体验提升

前端可以：
- 实时展示处理进度
- 显示当前正在做什么
- 预估剩余时间
- 展示详细的处理日志

---

## 📊 数据示例

**正常处理的日志序列:**

```json
[
  {
    "stage": "chunk",
    "status": "start",
    "message": "Starting document processing",
    "timestamp": "2024-02-10T10:00:00Z"
  },
  {
    "stage": "chunk",
    "status": "complete",
    "message": "Split document into 15 chunks",
    "metadata": { "chunksCount": 15, "contentLength": 5000 },
    "durationMs": 120,
    "timestamp": "2024-02-10T10:00:00.120Z"
  },
  {
    "stage": "store",
    "status": "start",
    "message": "Storing document chunks",
    "timestamp": "2024-02-10T10:00:00.121Z"
  },
  {
    "stage": "store",
    "status": "complete",
    "message": "Stored 15 chunk records",
    "metadata": { "chunksStored": 15 },
    "durationMs": 450,
    "timestamp": "2024-02-10T10:00:00.571Z"
  },
  {
    "stage": "embed",
    "status": "start",
    "message": "Generating embeddings for 15 chunks",
    "metadata": { "provider": "openai" },
    "timestamp": "2024-02-10T10:00:00.572Z"
  },
  {
    "stage": "embed",
    "status": "complete",
    "message": "Generated 15 embeddings",
    "metadata": {
      "embeddingsCount": 15,
      "modelInfo": { "provider": "openai", "modelId": "text-embedding-3-small" }
    },
    "durationMs": 2500,
    "timestamp": "2024-02-10T10:00:03.072Z"
  },
  {
    "stage": "store",
    "status": "start",
    "message": "Storing vectors",
    "timestamp": "2024-02-10T10:00:03.073Z"
  },
  {
    "stage": "store",
    "status": "complete",
    "message": "Stored 15 vectors",
    "metadata": { "vectorsStored": 15 },
    "durationMs": 300,
    "timestamp": "2024-02-10T10:00:03.373Z"
  },
  {
    "stage": "complete",
    "status": "complete",
    "message": "Processing completed successfully",
    "metadata": {
      "chunksCreated": 15,
      "vectorsAdded": 15,
      "totalDuration": 3373
    },
    "durationMs": 3373,
    "timestamp": "2024-02-10T10:00:03.373Z"
  }
]
```

---

## 🧪 测试

### 1. 上传文档并查看日志

```bash
# 1. 启动开发服务器
pnpm dev

# 2. 上传测试文件
pnpm test:upload

# 3. 查询日志
curl http://localhost:3000/api/documents/{documentId}/logs | jq
```

### 2. 查看状态和日志

```bash
# 查询文档状态
curl http://localhost:3000/api/documents/{documentId}/status

# 查询处理日志
curl http://localhost:3000/api/documents/{documentId}/logs
```

---

## 📦 新增 API

### 1. GET /api/documents/:id/logs

**功能**: 查询文档处理日志

**响应示例:**
```json
{
  "success": true,
  "data": {
    "documentId": "xxx",
    "logs": [...],
    "total": 9
  }
}
```

---

## 🎨 前端集成建议

### 1. 进度条组件

```vue
<template>
  <div class="space-y-4">
    <Progress :value="progress" class="h-2" />

    <div class="space-y-2">
      <div v-for="log in logs" :key="log.id" class="text-sm">
        <div class="flex items-center gap-2">
          <component :is="getStageIcon(log.stage)" class="w-4 h-4" />
          <span>{{ log.message }}</span>
          <span v-if="log.durationMs" class="text-muted-foreground">
            ({{ log.durationMs }}ms)
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Progress } from '~/components/ui/progress'

const props = defineProps<{
  documentId: string
}>()

const logs = ref([])
const progress = ref(0)

onMounted(async () => {
  // 轮询查询日志
  const interval = setInterval(async () => {
    const response = await $fetch(`/api/documents/${props.documentId}/logs`)
    logs.value = response.data.logs

    // 根据阶段计算进度
    progress.value = calculateProgress(logs.value)

    // 如果完成，停止轮询
    const lastLog = logs.value[logs.value.length - 1]
    if (lastLog?.stage === 'complete' || lastLog?.stage === 'error') {
      clearInterval(interval)
    }
  }, 1000)
})

function calculateProgress(logs) {
  const stages = ['chunk', 'store', 'embed', 'store', 'complete']
  const completedStages = logs.filter(l => l.status === 'complete').map(l => l.stage)
  return (completedStages.length / stages.length) * 100
}
</script>
```

### 2. 日志查看器

```vue
<template>
  <Card>
    <CardHeader>
      <CardTitle>处理日志</CardTitle>
    </CardHeader>
    <CardContent>
      <ScrollArea class="h-[300px]">
        <div class="space-y-2">
          <div
            v-for="log in logs"
            :key="log.id"
            class="p-2 rounded border"
            :class="{
              'border-green-500': log.status === 'complete',
              'border-red-500': log.status === 'error',
              'border-blue-500': log.status === 'start'
            }"
          >
            <div class="flex justify-between">
              <span class="font-medium">{{ formatStage(log.stage) }}</span>
              <span class="text-xs text-muted-foreground">
                {{ formatTime(log.timestamp) }}
              </span>
            </div>
            <p class="text-sm">{{ log.message }}</p>
            <p v-if="log.durationMs" class="text-xs text-muted-foreground">
              耗时: {{ log.durationMs }}ms
            </p>
          </div>
        </div>
      </ScrollArea>
    </CardContent>
  </Card>
</template>
```

---

## 🚀 下一步工作

### Phase 4: 构建标签与分类系统

1. 创建 `tags` 表
2. 创建 `categories` 表
3. 创建 `document_tags` 关联表
4. 实现标签 CRUD API
5. 实现分类树管理 API
6. 前端标签选择器组件

### Phase 5: 实现混合搜索与引用可视化

1. 添加全文检索(PostgreSQL tsvector)
2. 实现混合检索算法(RRF)
3. 引用关系可视化 API

### Phase 6: 添加版本控制等高级功能

1. 文档版本管理
2. 批量上传
3. 导出功能

---

## ✅ 成功指标

- [x] 处理日志表创建成功
- [x] ProcessingLogDAO 实现完整
- [x] RAG Pipeline 集成日志记录
- [x] 日志查询 API 可用
- [x] 每个处理阶段都有详细记录
- [x] 记录了每个步骤的耗时
- [x] 错误信息包含堆栈跟踪

---

## 🎉 总结

**Phase 3 已完成！** 状态追踪与日志系统已实现：

1. ✅ 完整的处理日志记录
2. ✅ 每个阶段的耗时统计
3. ✅ 详细的错误信息
4. ✅ 元数据记录
5. ✅ 日志查询 API
6. ✅ 支持前端实时展示

现在用户可以实时看到文档处理的每一个步骤，包括：
- 当前正在做什么
- 已经完成了什么
- 每个步骤耗时多少
- 如果失败，具体失败在哪里

**系统透明度和可调试性大幅提升！** 🚀
