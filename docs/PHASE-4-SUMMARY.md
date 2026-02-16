# Phase 4 完成总结 - 标签与分类系统

## ✅ 已完成的工作

### 1. 数据库表创建

**文件**: [scripts/create-tags-and-categories-tables.ts](/Users/chenqi/code/ArchMind/scripts/create-tags-and-categories-tables.ts)

**创建的表:**

#### tags 表
```sql
CREATE TABLE tags (
  id UUID PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  color TEXT DEFAULT '#3B82F6',
  description TEXT,
  usage_count INTEGER DEFAULT 0,  -- 自动更新
  created_at TIMESTAMP,
  updated_at TIMESTAMP  -- 自动更新
)
```

#### document_tags 关联表
```sql
CREATE TABLE document_tags (
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES tags(id) ON DELETE CASCADE,
  created_at TIMESTAMP,
  PRIMARY KEY (document_id, tag_id)
)
```

#### categories 表
```sql
CREATE TABLE categories (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  parent_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  path TEXT NOT NULL,  -- 完整路径，如 '技术文档/API文档'
  level INTEGER DEFAULT 0,  -- 层级深度
  sort_order INTEGER DEFAULT 0,
  description TEXT,
  icon TEXT,  -- lucide icon name
  created_at TIMESTAMP,
  updated_at TIMESTAMP,  -- 自动更新
  UNIQUE(name, parent_id)
)
```

#### documents 表扩展
```sql
ALTER TABLE documents
ADD COLUMN category_id UUID REFERENCES categories(id) ON DELETE SET NULL
```

**触发器:**
- `update_tag_usage_count()`: 自动更新标签使用次数
- `update_updated_at_column()`: 自动更新 updated_at 字段

**预设数据:**
- **12 个预设分类**:
  - 技术文档（API 文档、架构设计、数据库设计）
  - 需求文档（产品需求、用户故事、功能规格）
  - 业务文档（市场分析、竞品分析、用户研究）

- **20 个预设标签**:
  - 前端开发、后端开发、数据库、API 设计、架构设计
  - 性能优化、安全、测试、部署运维、产品需求
  - 用户体验、数据分析、移动端、Web、微服务
  - 云服务、AI/ML、区块链、物联网、DevOps

**运行迁移:**
```bash
pnpm tsx scripts/create-tags-and-categories-tables.ts
```

---

### 2. 类型定义

**文件**: [types/tag.ts](/Users/chenqi/code/ArchMind/types/tag.ts)

```typescript
export interface Tag {
  id: string
  name: string
  color: string
  description?: string
  usageCount: number
  createdAt: string
  updatedAt: string
}

export type CreateTagInput = Omit<Tag, 'id' | 'usageCount' | 'createdAt' | 'updatedAt'>
export type UpdateTagInput = Partial<CreateTagInput>
```

**文件**: [types/category.ts](/Users/chenqi/code/ArchMind/types/category.ts)

```typescript
export interface Category {
  id: string
  name: string
  parentId: string | null
  path: string  // 自动计算
  level: number  // 自动计算
  sortOrder: number
  description?: string
  icon?: string
  createdAt: string
  updatedAt: string
}

export interface CategoryTreeNode extends Category {
  children?: CategoryTreeNode[]
}

export type CreateCategoryInput = Omit<Category, 'id' | 'path' | 'level' | 'createdAt' | 'updatedAt'>
export type UpdateCategoryInput = Partial<Omit<Category, 'id' | 'path' | 'level' | 'createdAt' | 'updatedAt'>>
```

---

### 3. TagDAO

**文件**: [lib/db/dao/tag-dao.ts](/Users/chenqi/code/ArchMind/lib/db/dao/tag-dao.ts)

**提供的方法:**

**基础 CRUD:**
- `findAll()` - 查询所有标签（按使用次数和名称排序）
- `findById(id)` - 根据 ID 查询标签
- `findByName(name)` - 根据名称查询标签
- `create(input)` - 创建标签
- `update(id, input)` - 更新标签
- `delete(id)` - 删除标签

**文档关联:**
- `addToDocument(documentId, tagId)` - 为文档添加标签
- `removeFromDocument(documentId, tagId)` - 从文档移除标签
- `findByDocumentId(documentId)` - 查询文档的所有标签
- `findDocumentsByTagId(tagId)` - 查询使用某标签的所有文档
- `setDocumentTags(documentId, tagIds)` - 批量设置文档标签（替换所有）

**高级查询:**
- `search(keyword, limit)` - 搜索标签（模糊匹配）
- `findPopular(limit)` - 获取热门标签

---

### 4. CategoryDAO

**文件**: [lib/db/dao/category-dao.ts](/Users/chenqi/code/ArchMind/lib/db/dao/category-dao.ts)

**提供的方法:**

**基础 CRUD:**
- `findAll()` - 查询所有分类
- `findById(id)` - 根据 ID 查询分类
- `findRootCategories()` - 查询顶级分类
- `findChildren(parentId)` - 查询子分类
- `create(input)` - 创建分类（自动计算 path 和 level）
- `update(id, input)` - 更新分类（自动更新 path）
- `delete(id)` - 删除分类（级联删除子分类）

**高级功能:**
- `move(id, newParentId)` - 移动分类到新父级
- `buildTree()` - 构建分类树结构
- `getDocumentCount(categoryId)` - 查询分类下的文档数量
- `getBreadcrumb(categoryId)` - 查询分类路径（面包屑）

**智能特性:**
- 创建分类时自动计算 `path` 和 `level`
- 更新分类名称时自动更新所有子分类的 `path`
- 移动分类时自动更新所有子分类的 `level` 和 `path`
- 防止循环引用（不能将分类移动到自己的子分类下）

---

### 5. 标签 API

**基础 CRUD:**

1. **GET /api/tags**
   - 查询所有标签
   - 支持参数: `?search=关键词&popular=true&limit=10`

2. **POST /api/tags**
   - 创建标签
   - Body: `{ name, color?, description? }`

3. **GET /api/tags/:id**
   - 查询标签详情
   - 返回: 标签信息 + 使用此标签的文档数量和 ID 列表

4. **PATCH /api/tags/:id**
   - 更新标签
   - Body: `{ name?, color?, description? }`

5. **DELETE /api/tags/:id**
   - 删除标签（级联删除关联）

**文档标签管理:**

6. **GET /api/documents/:id/tags**
   - 查询文档的所有标签

7. **PUT /api/documents/:id/tags**
   - 设置文档标签（替换所有）
   - Body: `{ tagIds: [id1, id2, ...] }`

8. **POST /api/documents/:id/tags**
   - 为文档添加单个标签
   - Body: `{ tagId }`

9. **DELETE /api/documents/:id/tags/:tagId**
   - 从文档移除标签

---

### 6. 分类 API

**基础 CRUD:**

1. **GET /api/categories**
   - 查询所有分类或分类树
   - 支持参数: `?tree=true&root=true&parentId=xxx`

2. **POST /api/categories**
   - 创建分类
   - Body: `{ name, parentId?, sortOrder?, description?, icon? }`

3. **GET /api/categories/:id**
   - 查询分类详情
   - 返回: 分类信息 + 文档数量 + 子分类 + 面包屑

4. **PATCH /api/categories/:id**
   - 更新分类
   - Body: `{ name?, sortOrder?, description?, icon? }`

5. **DELETE /api/categories/:id**
   - 删除分类（级联删除子分类）
   - 如果有文档使用此分类，则拒绝删除

**高级功能:**

6. **POST /api/categories/:id/move**
   - 移动分类到新父级
   - Body: `{ newParentId: string | null }`

**文档分类管理:**

7. **PUT /api/documents/:id/category**
   - 设置文档分类
   - Body: `{ categoryId: string | null }`

---

## 🔄 使用示例

### 1. 创建标签

```bash
curl -X POST http://localhost:3000/api/tags \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Vue 3",
    "color": "#42B883",
    "description": "Vue.js 3.x 相关"
  }'
```

### 2. 为文档添加标签

```bash
curl -X PUT http://localhost:3000/api/documents/{docId}/tags \
  -H "Content-Type: application/json" \
  -d '{
    "tagIds": ["tag-id-1", "tag-id-2", "tag-id-3"]
  }'
```

### 3. 搜索标签

```bash
# 搜索包含 "API" 的标签
curl "http://localhost:3000/api/tags?search=API"

# 获取前 10 个热门标签
curl "http://localhost:3000/api/tags?popular=true&limit=10"
```

### 4. 查询分类树

```bash
curl "http://localhost:3000/api/categories?tree=true"
```

返回:
```json
{
  "success": true,
  "data": {
    "tree": [
      {
        "id": "xxx",
        "name": "技术文档",
        "level": 0,
        "children": [
          {
            "id": "yyy",
            "name": "API 文档",
            "level": 1,
            "children": []
          }
        ]
      }
    ]
  }
}
```

### 5. 创建分类

```bash
curl -X POST http://localhost:3000/api/categories \
  -H "Content-Type: application/json" \
  -d '{
    "name": "前端框架",
    "parentId": "tech-doc-id",
    "icon": "Code",
    "description": "前端框架相关文档"
  }'
```

### 6. 移动分类

```bash
curl -X POST http://localhost:3000/api/categories/{categoryId}/move \
  -H "Content-Type: application/json" \
  -d '{
    "newParentId": "new-parent-id"
  }'
```

### 7. 设置文档分类

```bash
curl -X PUT http://localhost:3000/api/documents/{docId}/category \
  -H "Content-Type: application/json" \
  -d '{
    "categoryId": "category-id"
  }'
```

### 8. 查询分类详情（含面包屑）

```bash
curl "http://localhost:3000/api/categories/{categoryId}"
```

返回:
```json
{
  "success": true,
  "data": {
    "category": {
      "id": "xxx",
      "name": "API 文档",
      "path": "技术文档/API 文档",
      "level": 1
    },
    "documentCount": 15,
    "childrenCount": 3,
    "children": [...],
    "breadcrumb": [
      { "name": "技术文档", "path": "技术文档" },
      { "name": "API 文档", "path": "技术文档/API 文档" }
    ]
  }
}
```

---

## 🎯 核心特性

### 1. 标签系统

**自动使用计数:**
- 数据库触发器自动维护 `usage_count`
- 添加标签时 +1，移除时 -1
- 无需手动更新计数

**灵活标签管理:**
- 支持按名称搜索
- 支持热门标签查询
- 支持批量设置文档标签
- 标签颜色自定义

**关联管理:**
- 删除标签时自动清理文档关联
- 删除文档时自动清理标签关联
- 支持查询某标签下的所有文档

### 2. 分类系统

**树形结构:**
- 支持无限层级嵌套
- 自动维护 `path` 字段（如 "技术文档/API 文档"）
- 自动维护 `level` 字段（层级深度）

**智能路径更新:**
- 重命名分类时自动更新所有子分类路径
- 移动分类时自动更新所有子分类的 level 和 path
- 防止循环引用

**面包屑导航:**
- `getBreadcrumb()` 方法返回从根到当前分类的完整路径
- 前端可直接用于面包屑导航

**文档统计:**
- 查询分类下的文档数量
- 删除分类前检查是否有文档使用

### 3. 数据完整性

**外键约束:**
- `documents.category_id` → `categories.id` (ON DELETE SET NULL)
- `document_tags.document_id` → `documents.id` (ON DELETE CASCADE)
- `document_tags.tag_id` → `tags.id` (ON DELETE CASCADE)
- `categories.parent_id` → `categories.id` (ON DELETE CASCADE)

**唯一性约束:**
- 标签名称全局唯一
- 分类名称在同一父级下唯一
- 文档-标签关联唯一

**自动更新:**
- `updated_at` 字段自动更新（触发器）
- 标签使用计数自动维护（触发器）

---

## 📊 数据库索引

**tags 表:**
- `idx_tags_name` - 名称索引
- `idx_tags_usage_count` - 使用次数索引（DESC）

**document_tags 表:**
- `idx_document_tags_document` - 文档 ID 索引
- `idx_document_tags_tag` - 标签 ID 索引

**categories 表:**
- `idx_categories_parent` - 父分类 ID 索引
- `idx_categories_path` - 路径索引
- `idx_categories_level` - 层级索引

**documents 表:**
- `idx_documents_category` - 分类 ID 索引

---

## 🧪 测试建议

### 1. 标签功能测试

```bash
# 1. 创建标签
TAG_ID=$(curl -s -X POST http://localhost:3000/api/tags \
  -H "Content-Type: application/json" \
  -d '{"name":"测试标签","color":"#FF5733"}' \
  | jq -r '.data.tag.id')

# 2. 查询所有标签
curl http://localhost:3000/api/tags | jq

# 3. 搜索标签
curl "http://localhost:3000/api/tags?search=测试" | jq

# 4. 为文档添加标签
curl -X PUT http://localhost:3000/api/documents/{docId}/tags \
  -H "Content-Type: application/json" \
  -d "{\"tagIds\":[\"$TAG_ID\"]}" | jq

# 5. 查询文档标签
curl http://localhost:3000/api/documents/{docId}/tags | jq

# 6. 删除标签
curl -X DELETE http://localhost:3000/api/tags/$TAG_ID
```

### 2. 分类功能测试

```bash
# 1. 查询分类树
curl "http://localhost:3000/api/categories?tree=true" | jq

# 2. 查询顶级分类
curl "http://localhost:3000/api/categories?root=true" | jq

# 3. 创建子分类
CAT_ID=$(curl -s -X POST http://localhost:3000/api/categories \
  -H "Content-Type: application/json" \
  -d '{
    "name":"测���分类",
    "parentId":"11111111-1111-1111-1111-111111111111",
    "icon":"Folder"
  }' | jq -r '.data.category.id')

# 4. 查询分类详情
curl http://localhost:3000/api/categories/$CAT_ID | jq

# 5. 设置文档分类
curl -X PUT http://localhost:3000/api/documents/{docId}/category \
  -H "Content-Type: application/json" \
  -d "{\"categoryId\":\"$CAT_ID\"}" | jq

# 6. 移动分类
curl -X POST http://localhost:3000/api/categories/$CAT_ID/move \
  -H "Content-Type: application/json" \
  -d '{"newParentId":"22222222-2222-2222-2222-222222222222"}' | jq

# 7. 删除分类
curl -X DELETE http://localhost:3000/api/categories/$CAT_ID
```

---

## 📦 新增文件清单

**数据库迁移:**
- [scripts/create-tags-and-categories-tables.ts](/Users/chenqi/code/ArchMind/scripts/create-tags-and-categories-tables.ts)

**类型定义:**
- [types/tag.ts](/Users/chenqi/code/ArchMind/types/tag.ts)
- [types/category.ts](/Users/chenqi/code/ArchMind/types/category.ts)

**DAO 层:**
- [lib/db/dao/tag-dao.ts](/Users/chenqi/code/ArchMind/lib/db/dao/tag-dao.ts)
- [lib/db/dao/category-dao.ts](/Users/chenqi/code/ArchMind/lib/db/dao/category-dao.ts)

**标签 API:**
- [server/api/tags/index.get.ts](/Users/chenqi/code/ArchMind/server/api/tags/index.get.ts)
- [server/api/tags/index.post.ts](/Users/chenqi/code/ArchMind/server/api/tags/index.post.ts)
- [server/api/tags/[id]/index.get.ts](/Users/chenqi/code/ArchMind/server/api/tags/[id]/index.get.ts)
- [server/api/tags/[id]/index.patch.ts](/Users/chenqi/code/ArchMind/server/api/tags/[id]/index.patch.ts)
- [server/api/tags/[id]/index.delete.ts](/Users/chenqi/code/ArchMind/server/api/tags/[id]/index.delete.ts)

**文档标签 API:**
- [server/api/documents/[id]/tags.get.ts](/Users/chenqi/code/ArchMind/server/api/documents/[id]/tags.get.ts)
- [server/api/documents/[id]/tags.put.ts](/Users/chenqi/code/ArchMind/server/api/documents/[id]/tags.put.ts)
- [server/api/documents/[id]/tags.post.ts](/Users/chenqi/code/ArchMind/server/api/documents/[id]/tags.post.ts)
- [server/api/documents/[id]/tags/[tagId].delete.ts](/Users/chenqi/code/ArchMind/server/api/documents/[id]/tags/[tagId].delete.ts)

**分类 API:**
- [server/api/categories/index.get.ts](/Users/chenqi/code/ArchMind/server/api/categories/index.get.ts)
- [server/api/categories/index.post.ts](/Users/chenqi/code/ArchMind/server/api/categories/index.post.ts)
- [server/api/categories/[id]/index.get.ts](/Users/chenqi/code/ArchMind/server/api/categories/[id]/index.get.ts)
- [server/api/categories/[id]/index.patch.ts](/Users/chenqi/code/ArchMind/server/api/categories/[id]/index.patch.ts)
- [server/api/categories/[id]/index.delete.ts](/Users/chenqi/code/ArchMind/server/api/categories/[id]/index.delete.ts)
- [server/api/categories/[id]/move.post.ts](/Users/chenqi/code/ArchMind/server/api/categories/[id]/move.post.ts)

**文档分类 API:**
- [server/api/documents/[id]/category.put.ts](/Users/chenqi/code/ArchMind/server/api/documents/[id]/category.put.ts)

---

## ✅ 成功指标

- [x] tags 表创建成功，包含 20 个预设标签
- [x] document_tags 关联表创建成功
- [x] categories 表创建成功，包含 12 个预设分类
- [x] documents 表添加 category_id 外键
- [x] 触发器自动维护标签使用计数
- [x] 触发器自动更新 updated_at 字段
- [x] TagDAO 实现完整，支持所有标签操作
- [x] CategoryDAO 实现完整，支持树形结构和智能路径更新
- [x] 标签 CRUD API 完整（5 个端点）
- [x] 文档标签管理 API 完整（4 个端点）
- [x] 分类 CRUD API 完整（6 个端点）
- [x] 文档分类管理 API 完整（1 个端点）
- [x] 支持标签搜索和热门标签查询
- [x] 支持分类树构建和面包屑导航
- [x] 支持分类移动和级联更新

---

## 🎉 总结

**Phase 4 已完成！** 标签与分类系统已全面实现：

### 标签系统
1. ✅ 完整的标签 CRUD
2. ✅ 文档-标签多对多关联
3. ✅ 自动维护使用计数
4. ✅ 支持标签搜索和热门标签
5. ✅ 批量设置文档标签

### 分类系统
1. ✅ 无限层级树形结构
2. ✅ 自动维护路径和层级
3. ✅ 智能路径更新（重命名、移动）
4. ✅ 面包屑导航支持
5. ✅ 文档计数和统计
6. ✅ 防止循环引用

### 数据库
1. ✅ 3 个新表（tags, document_tags, categories）
2. ✅ 12 个预设分类
3. ✅ 20 个预设标签
4. ✅ 2 个触发器自动维护数据
5. ✅ 完整的外键约束和索引

### API
1. ✅ 16 个 API 端点
2. ✅ 完整的输入验证（Zod）
3. ✅ 详细的错误处理
4. ✅ RESTful 设计

现在用户可以：
- 为文档添加多个标签
- 将文档归类到树形分类结构中
- 按标签和分类筛选文档
- 查看标签使用统计
- 查看分类下的文档数量
- 移动分类并自动更新所有子分类

**系统的组织能力大幅提升！** 🚀

---

## 🚀 下一步

**Phase 5: 实现混合搜索与引用可视化**

1. 添加全文检索（PostgreSQL tsvector）
2. 实现混合检索算法（RRF）
3. 引用关系可视化 API
