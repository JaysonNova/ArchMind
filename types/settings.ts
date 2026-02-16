/**
 * 设置相关类型定义
 */

export interface AIModelSettings {
  defaultModel: string;
  temperature: number;
  maxTokens: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
}

export interface RAGSettings {
  chunkSize: number;
  chunkOverlap: number;
  topK: number;
  similarityThreshold: number;
  embeddingModel: string;
}

export interface SystemSettings {
  aiModel: AIModelSettings;
  rag: RAGSettings;
  [key: string]: any;
}

export interface SettingsResponse {
  success: boolean;
  data?: SystemSettings;
  message?: string;
}

// 可用的模型信息（从后端返回给前端）
export interface AvailableModelInfo {
  id: string;
  name: string;
  provider: string;
  description: string;
  capabilities: {
    maxContextLength: number;
    supportsStreaming: boolean;
    supportsStructuredOutput: boolean;
    supportsVision: boolean;
    supportedLanguages: string[];
  };
  costEstimate: {
    input: string;
    output: string;
  };
  embedding?: {
    supported: boolean;
    provider?: string;
    model?: string;
    dimensions?: number;
  };
}

// 模型列表 API 响应
export interface AvailableModelsResponse {
  success: boolean;
  data: {
    availableModels: AvailableModelInfo[];
    defaultModel: string;
    selectedModel?: string;
  };
  message?: string;
}

