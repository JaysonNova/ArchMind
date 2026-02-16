import type { H3Event } from 'h3'

declare global {
  // 为 defineEventHandler 提供类型支持
  function defineEventHandler<T = any>(
    handler: (event: H3Event) => T | Promise<T>
  ): (event: H3Event) => T | Promise<T>
}

export {}

