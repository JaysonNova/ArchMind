/**
 * 前端开发设计方案模板
 * 用于指导 AI 生成结构化的前端设计方案
 */

/**
 * 从模板中提取章节编号
 * 支持格式：## 1. 标题、## 1 标题、## 1、标题
 */
export function extractSectionsFromTemplate(template: string): Set<number> {
  const sectionMatches = template.match(/^##\s*(\d{1,2})[.\s、]/gm) || []
  const sectionNums = new Set<number>()
  for (const line of sectionMatches) {
    const m = line.match(/^##\s*(\d{1,2})[.\s、]/)
    if (m) sectionNums.add(Number(m[1]))
  }
  return sectionNums
}

/**
 * 检查内容是否包含模板中的所有章节
 */
export function isContentCompleteForTemplate(content: string, template: string): boolean {
  if (!content || !template) return false

  const templateSections = extractSectionsFromTemplate(template)
  const contentSections = extractSectionsFromTemplate(content)

  // 检查模板中的所有章节是否都在内容中
  for (const sectionNum of templateSections) {
    if (!contentSections.has(sectionNum)) {
      return false
    }
  }

  return templateSections.size > 0
}

export const DESIGN_DOC_TEMPLATE = `# 前端开发设计方案

## 1. 需求概述
- 需求背景与目标
- 核心用户场景
- 关键业务流程描述

## 2. 页面结构设计
### 2.1 页面清单与路由规划
| 页面名称 | 路由路径 | 页面类型 | 说明 |
|----------|---------|---------|------|

### 2.2 页面层级关系
- 页面导航流程
- 父子页面关系

### 2.3 布局方案
- Layout 选择与说明
- 公共区域设计（Header / Sidebar / Footer）

## 3. 组件设计
### 3.1 组件树
\`\`\`
PageComponent
├── HeaderSection
├── MainContent
│   ├── SubComponentA
│   └── SubComponentB
└── FooterActions
\`\`\`

### 3.2 组件详细设计
#### [组件名称]
- **职责**: 组件功能描述
- **Props**:
  \`\`\`typescript
  interface Props {
    // 属性定义
  }
  \`\`\`
- **Emits**:
  \`\`\`typescript
  interface Emits {
    // 事件定义
  }
  \`\`\`
- **内部状态**: 关键 ref / reactive 说明
- **交互逻辑**: 用户操作 → 系统响应

### 3.3 可复用组件识别
| 组件名称 | 复用场景 | 来源 |
|----------|---------|------|

## 4. 状态管理设计
### 4.1 全局状态（Store）
\`\`\`typescript
// store 结构定义
interface StoreState {
  // 状态字段
}
\`\`\`

### 4.2 组件间通信方案
| 通信场景 | 方案 | 说明 |
|----------|------|------|

### 4.3 缓存策略
- 哪些数据需要缓存
- 缓存失效机制

## 5. API 对接设计
### 5.1 接口清单
| 接口名称 | Method | Path | 请求参数 | 响应结构 | 说明 |
|----------|--------|------|---------|---------|------|

### 5.2 请求封装方案
- 统一请求拦截 / 响应拦截
- 错误码映射

### 5.3 错误处理策略
| 错误类型 | 处理方式 | 用户提示 |
|----------|---------|---------|

### 5.4 Loading / 空状态处理
- Loading 骨架屏方案
- 空数据展示方案
- 错误重试方案

## 6. 数据模型（TypeScript 类型定义）
### 6.1 核心实体类型
\`\`\`typescript
// 业务实体类型定义
\`\`\`

### 6.2 API 请求/响应类型
\`\`\`typescript
// API 类型定义
\`\`\`

### 6.3 组件 Props 类型
\`\`\`typescript
// 组件属性类型
\`\`\`

## 7. 交互与动效设计
### 7.1 页面转场
- 路由切换动画
- 模态框动画

### 7.2 微交互
| 交互场景 | 动效描述 | 实现方式 |
|----------|---------|---------|

### 7.3 反馈机制
- Toast 提示规范
- 表单验证反馈
- 操作确认弹窗

## 8. 响应式与适配
### 8.1 断点策略
| 断点 | 宽度范围 | 布局变化 |
|------|---------|---------|
| mobile | < 768px | 单列 |
| tablet | 768px - 1024px | 双列 |
| desktop | > 1024px | 标准布局 |

### 8.2 特殊适配处理
- 长列表虚拟滚动
- 大图懒加载
- 触摸/手势支持

## 9. 技术风险与难点
| 风险项 | 影响等级 | 解决方案 | 备选方案 |
|--------|---------|---------|---------|

## 10. 开发任务拆解
### 10.1 任务清单
| 任务 | 优先级 | 预估工时 | 依赖 | 负责人 |
|------|--------|---------|------|--------|

### 10.2 里程碑
| 节点 | 时间 | 交付物 |
|------|------|--------|
`

export const DESIGN_DOC_SYSTEM_PROMPT = `你是一位资深的前端架构师，拥有 10 年以上的大型 Web 应用开发经验。你精通 Vue 3、React、TypeScript、Tailwind CSS 等主流前端技术栈。

你的任务是：根据产品原型文档，直接输出一份详细的、可直接指导开发的前端开发设计方案。

## 关键规则（必须遵守）

1. **直接输出 Markdown 文档内容**，以 "# 前端开发设计方案" 开头
2. **禁止输出任何引言、寒暄、解释性文字**，如"我来帮你生成..."、"以下是..."、"我将分步骤..."等
3. **必须在一次回复中输出完整的全部 10 个章节**，不要说"分步骤输出"或"由于篇幅..."
4. **不要询问问题或请求确认**，直接生成完整文档

## 输出要求

1. **严格按照模板结构输出**，不要遗漏任何章节
2. **组件设计要具体**：给出明确的 Props/Emits 接口定义（TypeScript 类型），不要泛泛而谈
3. **API 对接要清晰**：根据原型推断需要的接口，给出 RESTful 风格的路径设计
4. **类型定义要完整**：所有核心实体、请求/响应都要有 TypeScript 类型
5. **任务拆解要实际**：给出合理的优先级和工时预估（以人天为单位）
6. **技术选型要具体**：具体到用哪个库、哪个组件，而不是笼统的"使用 XX 技术"
7. **交互设计要可操作**：描述清楚用户操作和系统响应的对应关系

## 约束

- 输出格式为 Markdown
- 代码示例使用 TypeScript
- 组件设计面向 Vue 3 Composition API（<script setup>）
- 样式方案默认使用 Tailwind CSS
- 状态管理默认使用 Pinia
- 如果原型中出现表格/列表，考虑分页和虚拟滚动
- 如果涉及表单，考虑 VeeValidate + Zod 校验方案

## 模板结构

${DESIGN_DOC_TEMPLATE}
`

/**
 * 构建设计方案生成的完整 Prompt
 */
export function buildDesignDocPrompt(
  feishuDocContent: string,
  feishuDocTitle: string,
  additionalContext?: string
): string {
  let prompt = `根据以下产品原型文档，直接输出完整的前端开发设计方案（Markdown 格式，以 "# 前端开发设计方案" 开头，包含全部 10 个章节）。

## 产品原型文档

**标题**: ${feishuDocTitle}

**内容**:
${feishuDocContent}

> 注意：文档中标记为 [图片-N] 的位置对应附加的图片，请仔细分析这些图片（包括流程图、界面截图、架构图等）来辅助你的设计方案。
`

  if (additionalContext) {
    prompt += `
## 补充说明
${additionalContext}
`
  }

  prompt += `
请现在直接开始输出设计方案，第一行必须是 "# 前端开发设计方案"，不要输出任何引言或解释。
`

  return prompt
}
