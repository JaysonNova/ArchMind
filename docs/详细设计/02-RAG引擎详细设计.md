# RAG 引擎详细设计文档

## 文档版本信息

* **版本：** v1.0
* **创建日期：** 2026-02-01
* **最后更新：** 2026-02-01
* **文档状态：** Draft
* **基于文档：** 架构设计文档 v1.0

---

## 1. 文档概述

### 1.1 文档目的

本文档详细描述 ArchMind AI RAG (Retrieval-Augmented Generation) 引擎的实现规范，包括:
- 文档加载器实现
- 文本分块策略
- 向量化服务
- 语义检索实现
- 性能优化方案

### 1.2 目标读者

- 后端开发工程师
- AI/ML 工程师
- 系统架构师

### 1.3 技术栈

- **RAG 框架:** LangChain.js ^0.1.30
- **文档解析:**
  - PDF: pdf-parse ^1.1.1
  - DOCX: mammoth ^1.7.0
  - Markdown: marked ^12.0.0
- **向量化:** OpenAI text-embedding-3-small
- **向量数据库:** sqlite-vss ^0.1.2

---

## 2. RAG 引擎架构

### 2.1 整体流程

```
文档输入
    │
    ▼
┌─────────────────┐
│  文档加载器      │  ← 支持 PDF/DOCX/Markdown
│  DocumentLoader │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  文本分块器      │  ← RecursiveCharacterTextSplitter
│  TextSplitter   │     Chunk Size: 1000, Overlap: 200
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  向量化引擎      │  ← OpenAI Embeddings
│  EmbeddingService│    1536 维向量
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  向量存储        │  ← sqlite-vss
│  VectorStore    │     余弦相似度
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  检索器          │  ← Top-K 检索
│  RAGRetriever   │     K=5, threshold=0.7
└─────────────────┘
```

### 2.2 核心组件

| 组件 | 职责 | 输入 | 输出 |
|------|------|------|------|
| DocumentLoader | 文档解析 | 文件路径 | 文本内容 |
| TextSplitter | 文本分块 | 文本内容 | 文本块数组 |
| EmbeddingService | 向量化 | 文本块 | 向量数组 |
| VectorStore | 向量存储 | 向量+元数据 | 存储确认 |
| RAGRetriever | 语义检索 | 查询文本 | 相关文档块 |

---

## 3. 文档加载器实现

### 3.1 DocumentProcessor 类

**文件位置:** `lib/rag/document-processor.ts`

```typescript
import fs from 'fs';
import path from 'path';
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';
import { marked } from 'marked';

export class DocumentProcessor {
  /**
   * 提取文档文本内容
   * @param filePath 文件路径
   * @param fileType 文件类型 (.pdf, .docx, .md)
   * @returns 提取的文本内容
   */
  async extractText(filePath: string, fileType: string): Promise<string> {
    const normalizedType = fileType.toLowerCase().replace('.', '');

    switch (normalizedType) {
      case 'pdf':
        return this.extractPDF(filePath);
      case 'docx':
        return this.extractDOCX(filePath);
      case 'md':
      case 'markdown':
        return this.extractMarkdown(filePath);
      default:
        throw new Error(`Unsupported file type: ${fileType}`);
    }
  }

  /**
   * 提取 PDF 文本
   */
  private async extractPDF(filePath: string): Promise<string> {
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdfParse(dataBuffer);
    return data.text;
  }

  /**
   * 提取 DOCX 文本
   */
  private async extractDOCX(filePath: string): Promise<string> {
    const result = await mammoth.extractRawText({ path: filePath });
    return result.value;
  }

  /**
   * 提取 Markdown 文本
   */
  private async extractMarkdown(filePath: string): Promise<string> {
    const content = fs.readFileSync(filePath, 'utf-8');
    // 移除 Markdown 标记，保留纯文本
    const html = marked.parse(content) as string;
    // 简单的 HTML 标签移除
    return html.replace(/<[^>]*>/g, '').trim();
  }

  /**
   * 验证文件是否存在
   */
  validateFile(filePath: string): boolean {
    return fs.existsSync(filePath);
  }

  /**
   * 获取文件大小
   */
  getFileSize(filePath: string): number {
    const stats = fs.statSync(filePath);
    return stats.size;
  }
}
```

### 3.2 支持的文档格式

| 格式 | 扩展名 | 解析库 | 特点 |
|------|--------|--------|------|
| PDF | .pdf | pdf-parse | 支持文本提取，不支持图片 OCR |
| Word | .docx | mammoth | 支持现代 Word 格式 |
| Markdown | .md, .markdown | marked | 原生支持 |

---

## 4. 文本分块实现

### 4.1 TextSplitter 类

**文件位置:** `lib/rag/text-splitter.ts`

```typescript
export interface TextSplitterOptions {
  chunkSize: number;      // 块大小（字符数）
  chunkOverlap: number;   // 重叠大小（字符数）
  separators?: string[];  // 分隔符优先级
}

export class TextSplitter {
  private chunkSize: number;
  private chunkOverlap: number;
  private separators: string[];

  constructor(options: TextSplitterOptions) {
    this.chunkSize = options.chunkSize;
    this.chunkOverlap = options.chunkOverlap;
    this.separators = options.separators || [
      '\n\n',  // 段落
      '\n',    // 行
      '。',    // 中文句号
      '.',     // 英文句号
      ' ',     // 空格
      '',      // 字符
    ];
  }

  /**
   * 分割文本为块
   */
  splitText(text: string): string[] {
    if (text.length <= this.chunkSize) {
      return [text];
    }

    return this.recursiveSplit(text, this.separators);
  }

  /**
   * 递归分割文本
   */
  private recursiveSplit(text: string, separators: string[]): string[] {
    const chunks: string[] = [];
    const separator = separators[0];

    if (!separator) {
      // 没有分隔符了，直接按字符分割
      return this.splitByCharacter(text);
    }

    const splits = text.split(separator);
    let currentChunk = '';

    for (const split of splits) {
      const testChunk = currentChunk
        ? currentChunk + separator + split
        : split;

      if (testChunk.length <= this.chunkSize) {
        currentChunk = testChunk;
      } else {
        if (currentChunk) {
          chunks.push(currentChunk);
        }

        if (split.length > this.chunkSize) {
          // 当前片段太大，使用下一个分隔符
          const subChunks = this.recursiveSplit(split, separators.slice(1));
          chunks.push(...subChunks);
          currentChunk = '';
        } else {
          currentChunk = split;
        }
      }
    }

    if (currentChunk) {
      chunks.push(currentChunk);
    }

    // 添加重叠
    return this.addOverlap(chunks);
  }

  /**
   * 按字符分割
   */
  private splitByCharacter(text: string): string[] {
    const chunks: string[] = [];
    for (let i = 0; i < text.length; i += this.chunkSize - this.chunkOverlap) {
      chunks.push(text.slice(i, i + this.chunkSize));
    }
    return chunks;
  }

  /**
   * 添加块之间的重叠
   */
  private addOverlap(chunks: string[]): string[] {
    if (this.chunkOverlap === 0 || chunks.length <= 1) {
      return chunks;
    }

    const overlappedChunks: string[] = [];

    for (let i = 0; i < chunks.length; i++) {
      let chunk = chunks[i];

      // 添加前一个块的尾部
      if (i > 0) {
        const prevChunk = chunks[i - 1];
        const overlap = prevChunk.slice(-this.chunkOverlap);
        chunk = overlap + chunk;
      }

      overlappedChunks.push(chunk);
    }

    return overlappedChunks;
  }
}
```

### 4.2 分块策略说明

**参数配置:**
- **Chunk Size:** 1000 字符
  - 平衡上下文完整性和检索精度
  - 适合大多数文档类型

- **Chunk Overlap:** 200 字符
  - 避免重要信息被分割
  - 提高检索召回率

**分隔符优先级:**
1. 段落分隔符 (`\n\n`)
2. 行分隔符 (`\n`)
3. 中文句号 (`。`)
4. 英文句号 (`.`)
5. 空格 (` `)
6. 字符级分割

---

## 5. 向量化服务实现

### 5.1 EmbeddingService 类

**文件位置:** `lib/rag/embedding-service.ts`

```typescript
import OpenAI from 'openai';

export class EmbeddingService {
  private client: OpenAI;
  private model: string;

  constructor() {
    this.client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    this.model = process.env.EMBEDDING_MODEL || 'text-embedding-3-small';
  }

  /**
   * 批量生成文本向量
   * @param texts 文本数组
   * @returns 向量数组 (1536 维)
   */
  async embedDocuments(texts: string[]): Promise<number[][]> {
    if (texts.length === 0) {
      return [];
    }

    // OpenAI API 限制每次最多 2048 个文本
    const batchSize = 2048;
    const allEmbeddings: number[][] = [];

    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, i + batchSize);
      const response = await this.client.embeddings.create({
        model: this.model,
        input: batch,
      });

      const embeddings = response.data.map(item => item.embedding);
      allEmbeddings.push(...embeddings);
    }

    return allEmbeddings;
  }

  /**
   * 生成单个查询向量
   * @param text 查询文本
   * @returns 向量 (1536 维)
   */
  async embedQuery(text: string): Promise<number[]> {
    const response = await this.client.embeddings.create({
      model: this.model,
      input: text,
    });

    return response.data[0].embedding;
  }

  /**
   * 获取向量维度
   */
  getDimension(): number {
    return 1536; // text-embedding-3-small 固定维度
  }
}
```

### 5.2 向量化配置

**环境变量:**
```bash
OPENAI_API_KEY=sk-...
EMBEDDING_MODEL=text-embedding-3-small
```

**模型特性:**
- **模型:** text-embedding-3-small
- **维度:** 1536
- **成本:** $0.02 / 1M tokens
- **性能:** ~62.3% MTEB 分数

---

## 6. 语义检索实现

### 6.1 RAGRetriever 类

**文件位置:** `lib/rag/retriever.ts`

```typescript
import { EmbeddingService } from './embedding-service';
import { VectorDAO } from '@/lib/db/dao/vector-dao';
import { DocumentChunkDAO } from '@/lib/db/dao/document-chunk-dao';
import { DocumentDAO } from '@/lib/db/dao/document-dao';

export interface RetrieveOptions {
  topK?: number;        // 返回前 K 个结果
  threshold?: number;   // 相似度阈值 (0-1)
}

export interface RetrieveResult {
  documentId: string;
  documentTitle: string;
  chunkId: string;
  chunkIndex: number;
  content: string;
  score: number;
  metadata: Record<string, any>;
}

export class RAGRetriever {
  private embeddingService: EmbeddingService;

  constructor() {
    this.embeddingService = new EmbeddingService();
  }

  /**
   * 检索相关文档
   * @param query 查询文本
   * @param options 检索选项
   * @returns 相关文档块数组
   */
  async retrieve(query: string, options?: RetrieveOptions): Promise<RetrieveResult[]> {
    const { topK = 5, threshold = 0.7 } = options || {};

    // 1. 生成查询向量
    const queryEmbedding = await this.embeddingService.embedQuery(query);

    // 2. 向量相似度搜索
    const vectorResults = VectorDAO.similaritySearch(queryEmbedding, topK, threshold);

    if (vectorResults.length === 0) {
      return [];
    }

    // 3. 获取文档块详情
    const chunkIds = vectorResults.map(r => r.chunkId);
    const chunks = DocumentChunkDAO.findByIds(chunkIds);

    // 4. 获取文档信息
    const documentIds = [...new Set(chunks.map(c => c.documentId))];
    const documents = documentIds.map(id => DocumentDAO.findById(id)).filter(Boolean);
    const documentMap = new Map(documents.map(d => [d!.id, d!]));

    // 5. 组装结果
    const results: RetrieveResult[] = [];

    for (const vectorResult of vectorResults) {
      const chunk = chunks.find(c => c.id === vectorResult.chunkId);
      if (!chunk) continue;

      const document = documentMap.get(chunk.documentId);
      if (!document) continue;

      results.push({
        documentId: document.id,
        documentTitle: document.title,
        chunkId: chunk.id,
        chunkIndex: chunk.chunkIndex,
        content: chunk.content,
        score: vectorResult.score,
        metadata: {
          ...document.metadata,
          ...chunk.metadata,
        },
      });
    }

    return results;
  }
}
```

## 7. 完整工作流程

### 7.1 文档索引流程

```typescript
// lib/rag/document-indexer.ts
import { DocumentProcessor } from './document-processor';
import { TextSplitter } from './text-splitter';
import { EmbeddingService } from './embedding-service';
import { DocumentDAO } from '@/lib/db/dao/document-dao';
import { DocumentChunkDAO } from '@/lib/db/dao/document-chunk-dao';
import { VectorDAO } from '@/lib/db/dao/vector-dao';

export class DocumentIndexer {
  private processor: DocumentProcessor;
  private splitter: TextSplitter;
  private embeddingService: EmbeddingService;

  constructor() {
    this.processor = new DocumentProcessor();
    this.splitter = new TextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });
    this.embeddingService = new EmbeddingService();
  }

  /**
   * 索引文档
   * @param documentId 文档 ID
   */
  async indexDocument(documentId: string): Promise<void> {
    // 1. 获取文档
    const document = DocumentDAO.findById(documentId);
    if (!document || !document.content) {
      throw new Error('Document not found or has no content');
    }

    // 2. 文本分块
    const chunks = this.splitter.splitText(document.content);

    // 3. 创建文档块记录
    const chunkRecords = chunks.map((content, index) => ({
      documentId: document.id,
      chunkIndex: index,
      content,
      metadata: {
        documentTitle: document.title,
        chunkLength: content.length,
      },
    }));

    const createdChunks = DocumentChunkDAO.createMany(chunkRecords);

    // 4. 生成向量
    const embeddings = await this.embeddingService.embedDocuments(chunks);

    // 5. 保存向量
    const vectorData = createdChunks.map((chunk, index) => ({
      chunkId: chunk.id,
      embedding: embeddings[index],
    }));

    VectorDAO.addVectors(vectorData);
  }
}
```

---

## 8. 性能优化

### 8.1 批量处理优化

**问题:** 大文档处理耗时长

**解决方案:**
```typescript
// 批量向量化
async embedDocuments(texts: string[]): Promise<number[][]> {
  const batchSize = 100; // 每批 100 个文本
  const allEmbeddings: number[][] = [];

  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize);
    const embeddings = await this.embeddingService.embedDocuments(batch);
    allEmbeddings.push(...embeddings);
  }

  return allEmbeddings;
}
```

### 8.2 缓存策略

**查询缓存:**
```typescript
// 简单的内存缓存
const queryCache = new Map<string, RetrieveResult[]>();

async retrieve(query: string, options?: RetrieveOptions): Promise<RetrieveResult[]> {
  const cacheKey = `${query}-${JSON.stringify(options)}`;

  if (queryCache.has(cacheKey)) {
    return queryCache.get(cacheKey)!;
  }

  const results = await this.performRetrieval(query, options);
  queryCache.set(cacheKey, results);

  return results;
}
```

---

## 9. 使用示例

### 9.1 完整索引流程

```typescript
import { DocumentIndexer } from '@/lib/rag/document-indexer';

const indexer = new DocumentIndexer();

// 索引文档
await indexer.indexDocument('doc123');
```

### 9.2 语义检索

```typescript
import { RAGRetriever } from '@/lib/rag/retriever';

const retriever = new RAGRetriever();

// 检索相关文档
const results = await retriever.retrieve('用户登录功能', {
  topK: 5,
  threshold: 0.7,
});

console.log('找到', results.length, '个相关文档块');
results.forEach(result => {
  console.log(`文档: ${result.documentTitle}`);
  console.log(`相似度: ${result.score}`);
  console.log(`内容: ${result.content.substring(0, 100)}...`);
});
```

---

## 10. 总结

本文档详细描述了 ArchMind AI RAG 引擎的完整实现规范，包括:

✅ **文档加载器** - 支持 PDF/DOCX/Markdown
✅ **文本分块器** - 递归分割策略，智能重叠
✅ **向量化服务** - OpenAI Embeddings 集成
✅ **语义检索器** - Top-K 相似度搜索
✅ **完整工作流程** - 从文档到检索的端到端流程
✅ **性能优化** - 批量处理和缓存策略

**关键设计决策:**
- 使用 RecursiveCharacterTextSplitter 保持上下文完整性
- Chunk Size 1000 + Overlap 200 平衡精度和召回
- OpenAI text-embedding-3-small 性价比最优
- sqlite-vss 实现本地向量检索
- Top-K=5, threshold=0.7 的默认检索参数

**下一步:**
- 实现 AI 服务层详细设计
- 实现 PRD 生成引擎详细设计
- 实现 API 层详细设计

