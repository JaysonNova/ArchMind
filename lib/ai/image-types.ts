/**
 * 图片生成适配器接口和类型定义
 */

import type { ImageEditFunction } from '~/types/asset'

/**
 * 图片生成选项
 */
export interface ImageGenerateOptions {
  /** 负面提示词 */
  negativePrompt?: string
  /** 图片尺寸，如 "1024*1024" */
  size?: string
  /** 生成数量 */
  n?: number
  /** 随机种子 */
  seed?: number
  /** 是否添加水印 */
  watermark?: boolean
}

/**
 * 图片编辑选项
 */
export interface ImageEditOptions {
  /** 编辑功能类型 */
  function?: ImageEditFunction
  /** 编辑强度 0-1 */
  strength?: number
  /** 蒙版图片 URL (用于 inpaint) */
  maskImageUrl?: string
  /** 生成数量 */
  n?: number
  /** 随机种子 */
  seed?: number
}

/**
 * 异步任务状态
 */
export type TaskStatus = 'PENDING' | 'RUNNING' | 'SUCCEEDED' | 'FAILED' | 'CANCELED' | 'UNKNOWN'

/**
 * 图片生成任务结果
 */
export interface ImageTaskResult {
  /** 任务 ID */
  taskId: string
  /** 任务状态 */
  status: TaskStatus
  /** 生成的图片 URL 列表 */
  imageUrls?: string[]
  /** 错误信息 */
  error?: string
}

/**
 * 图片生成适配器接口
 */
export interface ImageGenerationAdapter {
  /** 适配器名称 */
  readonly name: string
  /** 提供商 ID */
  readonly providerId: string
  /** 支持的模型 ID */
  readonly modelId: string

  /**
   * 生成图片（文生图）
   * @param prompt 提示词
   * @param options 生成选项
   * @returns 任务 ID（异步任务）
   */
  generateImage(prompt: string, options?: ImageGenerateOptions): Promise<ImageTaskResult>

  /**
   * 编辑图片
   * @param baseImageUrl 原始图片 URL
   * @param prompt 编辑指令
   * @param options 编辑选项
   * @returns 任务 ID（异步任务）
   */
  editImage(baseImageUrl: string, prompt: string, options?: ImageEditOptions): Promise<ImageTaskResult>

  /**
   * 查询任务状态
   * @param taskId 任务 ID
   * @returns 任务结果
   */
  getTaskResult(taskId: string): Promise<ImageTaskResult>

  /**
   * 等待任务完成
   * @param taskId 任务 ID
   * @param maxWaitMs 最大等待时间（毫秒）
   * @param pollIntervalMs 轮询间隔（毫秒）
   * @returns 任务结果
   */
  waitForTask(taskId: string, maxWaitMs?: number, pollIntervalMs?: number): Promise<ImageTaskResult>

  /**
   * 检查适配器是否可用
   */
  isAvailable(): Promise<boolean>

  /**
   * 获取支持的图片尺寸
   */
  getSupportedSizes(): string[]
}
