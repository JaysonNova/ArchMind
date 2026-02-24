/**
 * 阿里云通义万象图片生成适配器
 *
 * 支持的功能：
 * - 文生图 (wanx2.1-t2i-turbo, wanx2.1-t2i-plus, flux-schnell)
 * - 图片编辑 (wanx2.1-imageedit): 风格化、超分、扩展、inpaint 等
 *
 * API 文档: https://help.aliyun.com/zh/model-studio/developer-reference/use-qwen-by-calling-api
 */

import type { ImageGenerationAdapter, ImageGenerateOptions, ImageEditOptions, ImageTaskResult, TaskStatus } from '../image-types'
import { getImageProviderConfig } from '../image-providers'

const DASHSCOPE_BASE_URL = 'https://dashscope.aliyuncs.com'

interface DashScopeResponse {
  output?: {
    task_id: string
    task_status: TaskStatus
    results?: Array<{ url: string }>
    message?: string
  }
  request_id?: string
  code?: string
  message?: string
}

/**
 * 通义万象适配器
 */
export class WanxAdapter implements ImageGenerationAdapter {
  readonly name: string
  readonly providerId = 'wanx'
  readonly modelId: string

  private apiKey: string
  private supportedSizes: string[]

  constructor(apiKey: string, modelId: string = 'wanx2.1-t2i-turbo') {
    this.apiKey = apiKey
    this.modelId = modelId

    const providerConfig = getImageProviderConfig('wanx')
    const modelConfig = providerConfig?.models.find(m => m.id === modelId)
    this.name = modelConfig?.name || modelId
    this.supportedSizes = modelConfig?.capabilities.supportedSizes || ['1024*1024']
  }

  /**
   * 生成图片（文生图）- 异步任务模式
   */
  async generateImage(prompt: string, options?: ImageGenerateOptions): Promise<ImageTaskResult> {
    const url = `${DASHSCOPE_BASE_URL}/api/v1/services/aigc/text2image/image-synthesis`

    const body: Record<string, any> = {
      model: this.modelId,
      input: {
        prompt
      },
      parameters: {
        size: options?.size || '1024*1024',
        n: options?.n || 1
      }
    }

    // 添加负面提示词
    if (options?.negativePrompt) {
      body.input.negative_prompt = options.negativePrompt
    }

    // 添加随机种子
    if (options?.seed !== undefined) {
      body.parameters.seed = options.seed
    }

    // FLUX 模型特定参数
    if (this.modelId === 'flux-schnell') {
      body.parameters.steps = 4
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
        'X-DashScope-Async': 'enable'
      },
      body: JSON.stringify(body)
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Wanx API error: ${response.status} - ${errorText}`)
    }

    const data: DashScopeResponse = await response.json()

    if (data.code) {
      throw new Error(`Wanx API error: ${data.code} - ${data.message}`)
    }

    return {
      taskId: data.output!.task_id,
      status: data.output!.task_status || 'PENDING'
    }
  }

  /**
   * 编辑图片 - 异步任务模式
   */
  async editImage(baseImageUrl: string, prompt: string, options?: ImageEditOptions): Promise<ImageTaskResult> {
    const url = `${DASHSCOPE_BASE_URL}/api/v1/services/aigc/image2image/image-synthesis`

    const editFunction = options?.function || 'description_edit'

    const body: Record<string, any> = {
      model: 'wanx2.1-imageedit',
      input: {
        function: editFunction,
        prompt,
        base_image_url: baseImageUrl
      },
      parameters: {
        n: options?.n || 1
      }
    }

    // 添加蒙版图片 (用于 inpaint)
    if (options?.maskImageUrl && editFunction === 'description_edit_with_mask') {
      body.input.mask_image_url = options.maskImageUrl
    }

    // 添加编辑强度
    if (options?.strength !== undefined) {
      body.parameters.strength = options.strength
    }

    // 添加随机种子
    if (options?.seed !== undefined) {
      body.parameters.seed = options.seed
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
        'X-DashScope-Async': 'enable'
      },
      body: JSON.stringify(body)
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Wanx Edit API error: ${response.status} - ${errorText}`)
    }

    const data: DashScopeResponse = await response.json()

    if (data.code) {
      throw new Error(`Wanx Edit API error: ${data.code} - ${data.message}`)
    }

    return {
      taskId: data.output!.task_id,
      status: data.output!.task_status || 'PENDING'
    }
  }

  /**
   * 查询任务状态
   */
  async getTaskResult(taskId: string): Promise<ImageTaskResult> {
    const url = `${DASHSCOPE_BASE_URL}/api/v1/tasks/${taskId}`

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`
      }
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Wanx Task API error: ${response.status} - ${errorText}`)
    }

    const data: DashScopeResponse = await response.json()

    if (data.code) {
      return {
        taskId,
        status: 'FAILED',
        error: `${data.code}: ${data.message}`
      }
    }

    const result: ImageTaskResult = {
      taskId,
      status: data.output?.task_status || 'UNKNOWN'
    }

    // 如果任务成功，提取图片 URL
    if (data.output?.task_status === 'SUCCEEDED' && data.output.results) {
      result.imageUrls = data.output.results.map(r => r.url)
    }

    // 如果任务失败，提取错误信息
    if (data.output?.task_status === 'FAILED') {
      result.error = data.output.message || 'Unknown error'
    }

    return result
  }

  /**
   * 等待任务完成
   */
  async waitForTask(
    taskId: string,
    maxWaitMs: number = 120000,
    pollIntervalMs: number = 2000
  ): Promise<ImageTaskResult> {
    const startTime = Date.now()

    while (Date.now() - startTime < maxWaitMs) {
      const result = await this.getTaskResult(taskId)

      if (result.status === 'SUCCEEDED' || result.status === 'FAILED' || result.status === 'CANCELED') {
        return result
      }

      // 等待后继续轮询
      await new Promise(resolve => setTimeout(resolve, pollIntervalMs))
    }

    return {
      taskId,
      status: 'FAILED',
      error: 'Task timeout'
    }
  }

  /**
   * 检查适配器是否可用
   */
  async isAvailable(): Promise<boolean> {
    try {
      // 简单检查 API Key 格式
      return this.apiKey.startsWith('sk-') && this.apiKey.length > 10
    } catch {
      return false
    }
  }

  /**
   * 获取支持的图片尺寸
   */
  getSupportedSizes(): string[] {
    return this.supportedSizes
  }
}

/**
 * 创建通义万象适配器实例
 */
export function createWanxAdapter(apiKey: string, modelId?: string): WanxAdapter {
  return new WanxAdapter(apiKey, modelId)
}
