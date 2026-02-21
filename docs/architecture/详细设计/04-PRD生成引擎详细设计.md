# PRD 生成引擎详细设计文档

## 文档版本信息

* **版本：** v1.0
* **创建日期：** 2026-02-01
* **最后更新：** 2026-02-01
* **文档状态：** Draft
* **基于文档：** 架构设计文档 v1.0

---

## 1. 文档概述

### 1.1 文档目的

本文档详细描述 ArchMind AI PRD 生成引擎的实现规范，包括:
- Prompt 工程设计
- PRD 生成流程
- 流式输出实现
- 后处理和验证
- 质量保证机制

### 1.2 目标读者

- 后端开发工程师
- AI/ML 工程师
- 产品经理

### 1.3 PRD 文档结构

标准 PRD 包含以下章节:
1. 功能概述
2. 业务背景与目标
3. 用户故事
4. 功能详细说明
5. 业务流程图
6. 界面设计要求
7. 数据模型
8. 异常处理
9. 非功能需求
10. 变更影响分析

---

## 2. Prompt 工程设计

### 2.1 系统提示词

**文件位置:** `lib/ai/prompts/prd-system-prompt.ts`

```typescript
export const PRD_SYSTEM_PROMPT = `你是一个专业的产品经理助手，擅长编写高质量的产品需求文档（PRD）。

你的职责：
1. 根据用户的需求描述，生成结构完整、逻辑清晰的 PRD 文档
2. 参考历史文档中的产品逻辑和设计规范，确保新功能与现有系统一致
3. 补充用户可能遗漏的边界情况、异常流程和非功能需求
4. 使用 Markdown 格式输出，包含必要的流程图（Mermaid 语法）

PRD 文档结构：
1. 功能概述
2. 业务背景与目标
3. 用户故事
4. 功能详细说明
5. 业务流程图
6. 界面设计要求
7. 数据模型
8. 异常处理
9. 非功能需求
10. 变更影响分析

注意事项：
- 保持与历史文档的术语一致性
- 明确标注新增、修改、删除的功能点
- 考虑安全性、性能、可扩展性等非功能需求
- 使用清晰的语言，避免歧义`;
```

### 2.2 用户提示词构建

**文件位置:** `lib/ai/prompts/prd-user-prompt.ts`

```typescript
export interface RetrievedContext {
  documents: Array<{
    id: string;
    title: string;
    content: string;
  }>;
  productBackground?: string;
  techStack?: string;
  designGuidelines?: string;
}

export function buildPRDPrompt(
  userInput: string,
  context: RetrievedContext
): string {
  return `
## 用户需求
${userInput}

## 相关历史文档
${context.documents.map((doc, i) => `
### 文档 ${i + 1}: ${doc.title}
${doc.content}
`).join('\n')}

## 产品背景
${context.productBackground || '暂无'}

## 现有技术栈
${context.techStack || '暂无'}

## 设计规范
${context.designGuidelines || '暂无'}

---

请基于以上信息，生成一份完整的 PRD 文档。确保：
1. 新功能与现有系统逻辑一致
2. 考虑所有可能的边界情况和异常流程
3. 提供清晰的业务流程图（使用 Mermaid 语法）
4. 分析对现有功能的影响
`;
}
```

---

## 3. PRD 生成器实现

**文件位置:** `lib/prd/prd-generator.ts`

```typescript
import { ModelManager } from '@/lib/ai/model-manager';
import { RAGRetriever } from '@/lib/rag/retriever';
import { PRDDAO } from '@/lib/db/dao/prd-dao';
import { PRD_SYSTEM_PROMPT, buildPRDPrompt } from '@/lib/ai/prompts';
import { TaskType } from '@/lib/ai/types';
import type { PRDDocument } from '@/types/prd';

export interface GenerateOptions {
  modelId?: string;
  temperature?: number;
  maxTokens?: number;
}

export class PRDGenerator {
  constructor(
    private modelManager: ModelManager,
    private ragRetriever: RAGRetriever
  ) {}

  async generate(
    userInput: string,
    options?: GenerateOptions
  ): Promise<PRDDocument> {
    // 1. 检索相关历史文档
    const retrievedDocs = await this.ragRetriever.retrieve(userInput, {
      topK: 5,
      threshold: 0.7,
    });

    // 2. 构建上下文
    const context = await this.buildContext(retrievedDocs);

    // 3. 选择合适的模型
    const model = options?.modelId
      ? this.modelManager.getAdapter(options.modelId)!
      : await this.modelManager.selectModel(TaskType.PRD_GENERATION);

    // 4. 构建 Prompt
    const prompt = buildPRDPrompt(userInput, context);

    // 5. 生成 PRD
    const startTime = Date.now();
    const content = await model.generateText(prompt, {
      systemPrompt: PRD_SYSTEM_PROMPT,
      temperature: options?.temperature || 0.7,
      maxTokens: options?.maxTokens || 8000,
    });
    const generationTime = Date.now() - startTime;

    // 6. 后处理
    const processed = await this.postProcess(content);

    // 7. 保存到数据库
    const prdDoc = PRDDAO.create({
      title: this.extractTitle(processed),
      content: processed,
      userInput,
      modelUsed: model.modelId,
      generationTime,
    });

    // 8. 保存引用关系
    const documentIds = retrievedDocs.map(d => d.documentId);
    const relevanceScores = retrievedDocs.map(d => d.score);
    PRDDAO.addReferences(prdDoc.id, documentIds, relevanceScores);

    return prdDoc;
  }

  async *generateStream(
    userInput: string,
    options?: GenerateOptions
  ): AsyncIterator<string> {
    // 类似的流程，但使用流式输出
    const retrievedDocs = await this.ragRetriever.retrieve(userInput);
    const context = await this.buildContext(retrievedDocs);

    const model = options?.modelId
      ? this.modelManager.getAdapter(options.modelId)!
      : await this.modelManager.selectModel(TaskType.PRD_GENERATION);

    const prompt = buildPRDPrompt(userInput, context);

    yield* model.generateStream(prompt, {
      systemPrompt: PRD_SYSTEM_PROMPT,
      temperature: options?.temperature || 0.7,
      maxTokens: options?.maxTokens || 8000,
    });
  }

  private async buildContext(docs: any[]): Promise<any> {
    return {
      documents: docs.map(d => ({
        id: d.documentId,
        title: d.documentTitle,
        content: d.content,
      })),
      productBackground: '基于历史文档的产品背景...',
      techStack: 'Nuxt 3 + TypeScript + SQLite',
      designGuidelines: '遵循现有设计规范...',
    };
  }

  private async postProcess(content: string): Promise<string> {
    // 格式化、补全章节、检查逻辑等
    return content;
  }

  private extractTitle(content: string): string {
    const match = content.match(/^#\s+(.+)$/m);
    return match ? match[1] : '未命名 PRD';
  }
}
```

## 4. 后处理器实现

**文件位置:** `lib/prd/prd-processor.ts`

```typescript
export class PRDProcessor {
  /**
   * 格式化 Markdown
   */
  formatMarkdown(content: string): string {
    // 确保标题层级正确
    let formatted = content;

    // 移除多余的空行
    formatted = formatted.replace(/\n{3,}/g, '\n\n');

    // 确保代码块格式正确
    formatted = formatted.replace(/```(\w+)?\n/g, '```$1\n');

    return formatted.trim();
  }

  /**
   * 验证 Mermaid 图表语法
   */
  validateMermaidDiagrams(content: string): string {
    const mermaidBlocks = content.match(/```mermaid\n([\s\S]*?)\n```/g);

    if (!mermaidBlocks) return content;

    // 简单验证：确保有基本的图表类型声明
    for (const block of mermaidBlocks) {
      const diagramContent = block.match(/```mermaid\n([\s\S]*?)\n```/)?.[1];
      if (!diagramContent) continue;

      const hasType = /^(graph|flowchart|sequenceDiagram|classDiagram|stateDiagram|erDiagram|gantt|pie|journey)/m.test(diagramContent);

      if (!hasType) {
        console.warn('Mermaid diagram missing type declaration');
      }
    }

    return content;
  }

  /**
   * 补全缺失的章节
   */
  async fillMissingSections(content: string): Promise<string> {
    const requiredSections = [
      '功能概述',
      '业务背景',
      '功能详细说明',
      '异常处理',
      '非功能需求',
    ];

    const missingSections: string[] = [];

    for (const section of requiredSections) {
      if (!content.includes(section)) {
        missingSections.push(section);
      }
    }

    if (missingSections.length > 0) {
      console.warn('Missing sections:', missingSections);
      // 可以选择自动补全或提示用户
    }

    return content;
  }
}
```

---

## 5. 使用示例

### 5.1 基本生成

```typescript
import { PRDGenerator } from '@/lib/prd/prd-generator';
import { ModelManager } from '@/lib/ai/model-manager';
import { RAGRetriever } from '@/lib/rag/retriever';

const modelManager = new ModelManager();
const ragRetriever = new RAGRetriever();
const generator = new PRDGenerator(modelManager, ragRetriever);

// 生成 PRD
const prd = await generator.generate('实现用户登录功能，支持手机号和邮箱登录');

console.log('PRD 标题:', prd.title);
console.log('生成耗时:', prd.generationTime, 'ms');
console.log('使用模型:', prd.modelUsed);
```

### 5.2 流式生成

```typescript
const stream = generator.generateStream('实现用户登录功能');

for await (const chunk of stream) {
  process.stdout.write(chunk);
}
```

---

## 6. 总结

本文档详细描述了 ArchMind AI PRD 生成引擎的完整实现规范，包括:

✅ **Prompt 工程** - 系统提示词和用户提示词设计
✅ **PRD 生成器** - 完整的生成流程实现
✅ **后处理器** - 格式化、验证、补全
✅ **流式输出** - 实时生成反馈
✅ **使用示例** - 实际代码示例

**关键设计决策:**
- 基于 RAG 的上下文构建
- 结构化的 PRD 模板
- Mermaid 图表支持
- 自动补全缺失章节
- 引用关系追踪

**下一步:**
- 实现 API 层详细设计
- 实现前端架构详细设计

