export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ImageInput {
  /** base64-encoded image data (no data URI prefix) */
  base64: string;
  /** MIME type, e.g. 'image/png', 'image/jpeg' */
  mediaType: string;
}

export interface GenerateOptions {
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  stopSequences?: string[];
  systemPrompt?: string;
  messages?: ChatMessage[];
  /** Images to include in the prompt (for vision-capable models) */
  images?: ImageInput[];
}

export interface ModelCapabilities {
  supportsStreaming: boolean;
  supportsStructuredOutput: boolean;
  supportsVision: boolean;
  maxContextLength: number;
  supportedLanguages: string[];
}

export interface CostEstimate {
  inputCost: number;
  outputCost: number;
  currency: string;
}

export interface AIModelAdapter {
  name: string;
  provider: string;
  modelId: string;
  lastStopReason?: string;

  generateText(prompt: string, options?: GenerateOptions): Promise<string>;
  generateStream(prompt: string, options?: GenerateOptions): AsyncGenerator<string>;

  getCapabilities(): ModelCapabilities;
  estimateCost(tokens: number): CostEstimate;
  isAvailable(): Promise<boolean>;
}

export enum TaskType {
  PRD_GENERATION = 'prd_generation',
  CHINESE_CONTENT = 'chinese_content',
  LARGE_DOCUMENT = 'large_document',
  COST_SENSITIVE = 'cost_sensitive',
  PRIVACY_MODE = 'privacy_mode',
}
