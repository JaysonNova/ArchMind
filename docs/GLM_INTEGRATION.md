# GLM (Zhipu AI ChatGLM) 集成指南

## 概览

GLM 已成功集成到 ArchMind 系统中。GLM 是由智谱 AI 开发的大语言模型，提供 OpenAI 兼容的 API 接口，使其可以无缝集成到现有系统中。

## 主要特性

- **OpenAI 兼容 API**: GLM 提供与 OpenAI 相同的 API 接口
- **成本效益**: 相比 Claude 和 GPT-4o，GLM 的成本非常低廉
- **中文优化**: 对中文内容有特殊优化
- **流式支持**: 支持流式生成响应

## API 密钥配置

您的 GLM API 密钥已配置在：

```
.env 文件中：
GLM_API_KEY=cb4ac21f0aa94c51bd3b8b600942d8f3.kdWA3HtCTqzeK7kk
```

**重要安全提示**: 不要将真实的 API 密钥提交到代码仓库。应该在 `.gitignore` 中忽略 `.env` 文件。

## 集成的文件

### 1. GLM 适配器
**位置**: `/lib/ai/adapters/glm.ts`

实现了 `AIModelAdapter` 接口，支持：
- `generateText()`: 非流式文本生成
- `generateStream()`: 流式文本生成
- `getCapabilities()`: 获取模型能力
- `estimateCost()`: 成本估算
- `isAvailable()`: 可用性检查

### 2. 模型管理器更新
**位置**: `/lib/ai/manager.ts`

更新了以下内容：
- 新增 `GLM` 到 `ModelProvider` 枚举
- 在 `initializeAdapters()` 中初始化 GLM 适配器
- 将中文内容任务路由到 `glm-4-flash` 模型（最具成本效益）

### 3. 环境变量配置
**位置**: `.env` 和 `.env.example`

添加了 GLM API 密钥配置项：
```bash
GLM_API_KEY=your_glm_api_key
```

### 4. Nuxt 配置
**位置**: `nuxt.config.ts`

添加了 GLM API 密钥到运行时配置：
```typescript
glmApiKey: process.env.GLM_API_KEY,
```

### 5. 模型测试端点
**位置**: `/server/api/ai/models.get.ts`

获取所有已注册模型的状态和信息：
```bash
GET /api/ai/models
```

响应示例：
```json
{
  "success": true,
  "data": {
    "models": {
      "glm-4-flash": {
        "available": true,
        "info": {
          "modelId": "glm-4-flash",
          "name": "ChatGLM",
          "provider": "glm",
          "capabilities": {
            "supportsStreaming": true,
            "supportsStructuredOutput": true,
            "supportsVision": true,
            "maxContextLength": 128000,
            "supportedLanguages": ["en", "zh", "ja", "ko", "fr", "de", "es"]
          }
        }
      },
      "claude-3.5-sonnet": { ... },
      "gpt-4o": { ... },
      "gemini-1.5-pro": { ... }
    },
    "totalModels": 4
  }
}
```

## 使用场景

### 1. 在 PRD 生成中使用 GLM

当用户输入包含中文内容时，系统会自动选择 GLM：

```typescript
// 在 PRDGenerator 中，当检测到中文内容时
selectModelByTask('chinese_content') // 返回 GLM-4-Flash 适配器
```

### 2. 成本优化

GLM 的价格极具竞争力：
- **输入**: ¥0.001 / 1K tokens
- **输出**: ¥0.001 / 1K tokens

相比之下：
- Claude 3.5 Sonnet: $3 / 1M input, $15 / 1M output
- GPT-4o: $5 / 1M input, $15 / 1M output
- Gemini 1.5 Pro: $1.25 / 1M input (first 128K), $5 / 1M output

### 3. 流式生成

GLM 完全支持流式生成，适合实时显示生成过程：

```typescript
const adapter = modelManager.getAdapter('glm-4-flash')
const stream = adapter.generateStream(prompt)

for await (const chunk of stream) {
  console.log(chunk)
}
```

## API 调用示例

### 非流式请求
```bash
curl -X POST http://localhost:3000/api/prd \
  -H "Content-Type: application/json" \
  -d '{
    "userInput": "我想要一个电商平台",
    "model": "glm-4-flash",
    "useRAG": true
  }'
```

### 流式请求
```bash
curl -X POST http://localhost:3000/api/prd/stream \
  -H "Content-Type: application/json" \
  -d '{
    "userInput": "我想要一个电商平台",
    "model": "glm-4-flash",
    "useRAG": true
  }'
```

## 模型规范

### 支持的模型

GLM 目前支持以下模型：
- `glm-4-flash`: 快速、低成本的模型（推荐）
- `glm-4`: 更强大的模型版本

### 模型能力

```typescript
{
  supportsStreaming: true,           // 支持流式输出
  supportsStructuredOutput: true,    // 支持 JSON 结构化输出
  supportsVision: true,              // 支持视觉理解
  maxContextLength: 128000,          // 128K token 上下文窗口
  supportedLanguages: [              // 支持的语言
    'en', 'zh', 'ja', 'ko',
    'fr', 'de', 'es'
  ]
}
```

## 成本计算

GLM 成本计算公式：

```typescript
// 假设输入输出比例为 1:1
const inputTokens = totalTokens / 2
const outputTokens = totalTokens / 2

const cnyPerToken = 0.001 / 1000  // ¥0.000001 per token
const usdPerToken = cnyPerToken / 7

const totalCost = (inputTokens + outputTokens) * usdPerToken
```

对于 10,000 个 tokens：
- 成本约: 0.0014 USD (约 0.01 CNY)

相比 Claude 3.5 Sonnet：
- 成本约: 0.035 USD

**成本节省**: 约 96%

## 故障排除

### 1. GLM 模型不可用

检查以下项目：
- API 密钥是否正确配置在 `.env` 文件中
- 网络连接是否正常
- API 密钥是否已过期或被禁用

```bash
# 测试 GLM 可用性
curl http://localhost:3000/api/ai/models
```

### 2. 身份验证失败

确保 `.env` 中的 API 密钥与您在智谱 AI 控制台中的密钥一致。

### 3. 速率限制

GLM 可能有速率限制。如果收到 429 错误，请等待一段时间后重试。

## 文档和资源

- 官方文档: https://docs.bigmodel.cn/cn/guide/develop/openai/introduction
- GitHub: https://github.com/THUDM/ChatGLM3
- 官方网站: https://www.zhipu.ai/

## 下一步

1. **测试 GLM**: 使用 `/api/ai/models` 端点测试 GLM 是否可用
2. **集成到前端**: 在 UI 中显示 GLM 作为可选模型
3. **监控成本**: 跟踪 GLM 的使用情况和成本
4. **A/B 测试**: 对比 GLM 和其他模型的生成质量

## 常见问题

**Q: GLM 和 Claude 哪个更好？**
A: 取决于您的需求。Claude 更强大，但 GLM 成本更低。对于中文内容，GLM 提供了很好的平衡。

**Q: 可以同时使用多个模型吗？**
A: 可以！系统支持多个模型并行使用。用户可以在每次请求时选择不同的模型。

**Q: GLM 支持的最大上下文长度是多少？**
A: GLM-4-Flash 支持 128K token 的上下文窗口。

**Q: 如何在生成过程中切换模型？**
A: 在 API 请求中指定 `model` 参数即可切换模型。
