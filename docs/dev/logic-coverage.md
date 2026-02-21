# Logic Coverage 实现文档

## 概述

Logic Coverage (逻辑覆盖率) 是一个用于衡量 PRD 文档逻辑完整性的指标,基于 Logic Map(逻辑图谱)的数据计算得出。

## 计算方法

### 综合评分公式

Logic Coverage 由四个维度加权计算:

```
Logic Coverage =
  功能覆盖度 × 40% +
  关系密度 × 30% +
  角色覆盖度 × 20% +
  实体覆盖度 × 10%
```

### 各维度说明

#### 1. 功能覆盖度 (40% 权重)

衡量实际识别的功能节点与估算应有功能节点的比例。

```
功能覆盖度 = min(实际功能节点数 / 估算功能节点数, 1) × 100
```

**估算规则:**
- 基于 PRD 内容长度初步估算
- 通过关键词(功能、feature、模块等)优化估算
- 内容长度 > 5000: 基础 8 个功能点
- 内容长度 > 3000: 基础 6 个功能点
- 内容长度 > 1500: 基础 4 个功能点
- 默认: 3 个功能点

#### 2. 关系密度 (30% 权重)

衡量节点之间关系的完整性。

```
关系密度 = min(实际边数 / 估算应有边数, 1) × 100
估算应有边数 = 节点总数 × 1.75
```

**边的类型:**
- `dependency`: 依赖关系
- `interaction`: 交互关系
- `dataflow`: 数据流

#### 3. 角色覆盖度 (20% 权重)

衡量用户角色定义的完整性。

```
角色覆盖度 = min(实际角色节点数 / 理想角色数, 1) × 100
理想角色数 = 3
```

#### 4. 实体覆盖度 (10% 权重)

衡量数据实体定义的完整性。

```
实体覆盖度 = min(实际实体节点数 / 最小实体数, 1) × 100
最小实体数 = max(2, 功能节点数 × 50%)
```

## 数据结构

### Logic Map 数据库表

```sql
CREATE TABLE logic_maps (
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
```

### Logic Map 数据格式

```typescript
interface LogicMapData {
  nodes: LogicMapNodeData[]
  edges: LogicMapEdgeData[]
  summary: string
}

interface LogicMapNodeData {
  id: string
  type: 'feature' | 'role' | 'entity'
  label: string
  description: string
}

interface LogicMapEdgeData {
  source: string
  target: string
  label: string
  type: 'dependency' | 'interaction' | 'dataflow'
}
```

## API 端点

### 1. 获取单个 PRD 的 Logic Coverage

```
GET /api/prd/{prdId}/logic-coverage
```

**响应:**
```json
{
  "success": true,
  "data": {
    "coverage": 75,
    "featureCoverage": 80,
    "roleCoverage": 100,
    "entityCoverage": 60,
    "relationshipDensity": 70,
    "details": {
      "totalNodes": 15,
      "featureNodes": 8,
      "roleNodes": 3,
      "entityNodes": 4,
      "totalEdges": 20,
      "dependencyEdges": 8,
      "interactionEdges": 7,
      "dataflowEdges": 5,
      "estimatedRequiredNodes": 10,
      "estimatedRequiredEdges": 26
    }
  }
}
```

### 2. 批量获取 Logic Coverage

```
GET /api/logic-coverage/batch?prdIds=id1&prdIds=id2
```

**响应:**
```json
{
  "success": true,
  "data": {
    "id1": 75,
    "id2": 60
  }
}
```

### 3. 获取 Logic Map 数据

```
GET /api/logic-maps/{prdId}
```

### 4. 生成 Logic Map

```
POST /api/logic-maps/generate-from-prd
Body: {
  "prdId": "uuid",
  "modelId": "claude-3.5-sonnet"
}
```

## 使用流程

### 1. 生成 PRD

用户在 `/generate` 页面通过对话生成 PRD 文档。

### 2. 生成 Logic Map

在 PRD 预览界面的 "逻辑图谱" 标签页,点击"生成"按钮:
- 调用 AI 模型分析 PRD 内容
- 提取功能、角色、实体节点
- 识别节点之间的关系
- 保存到数据库

### 3. 查看 Logic Coverage

在项目列表页面 (`/`)自动显示每个项目的 Logic Coverage 进度条:
- 页面加载时批量获取所有项目的 Logic Coverage
- 如果项目没有 Logic Map,显示 0%
- 如果有 Logic Map,显示计算后的百分比

### 4. 优化覆盖率

通过以下方式提高 Logic Coverage:
- 补充功能描述,增加功能节点
- 明确角色定义
- 完善数据实体说明
- 理清功能之间的依赖关系

## 数据库迁移

执行以下命令创建 logic_maps 表:

```bash
pnpm db:migrate-logic-maps
```

或手动执行:

```bash
psql -h localhost -U your_user -d archmind -f lib/db/migrations/add_logic_maps_table.sql
```

## 技术实现

### 核心文件

1. **计算服务**: `lib/logic-map/coverage-calculator.ts`
   - LogicCoverageCalculator 类
   - calculate() 方法: 完整计算
   - calculateQuick() 方法: 快速计算

2. **数据访问**: `lib/db/dao/logic-map-dao.ts`
   - LogicMapDAO 类
   - upsert() 保存或更新
   - findByPrdId() 查询

3. **API 端点**:
   - `server/api/prd/[id]/logic-coverage.get.ts`
   - `server/api/logic-coverage/batch.get.ts`
   - `server/api/logic-maps/[id].get.ts`
   - `server/api/logic-maps/generate-from-prd.post.ts`

4. **前端集成**: `pages/index.vue`
   - onMounted 时批量加载 Logic Coverage
   - ProjectCard 组件显示进度条

## 未来优化方向

1. **动态权重**: 允许用户自定义各维度权重
2. **趋势分析**: 跟踪 Logic Coverage 随时间的变化
3. **智能建议**: 基于低覆盖率维度给出改进建议
4. **可视化**: 在 Logic Map 图谱上标注覆盖率薄弱点
5. **缓存优化**: 缓存计算结果,仅在 Logic Map 变更时重新计算
