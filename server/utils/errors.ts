// @ts-expect-error h3 is provided by Nuxt
import type { H3Event } from 'h3'
import { useServerT } from './i18n'

/**
 * API 错误消息 i18n key 映射
 * 值为 i18n key 路径，通过 useServerT 翻译
 */
export const ErrorKeys = {
  // 工作区错误
  WORKSPACE_NOT_FOUND: 'errors.workspaceNotFound',
  WORKSPACE_NAME_EXISTS: 'errors.workspaceNameExists',
  CANNOT_DELETE_DEFAULT: 'errors.cannotDeleteDefault',

  // 标签错误
  TAG_NOT_FOUND: 'errors.tagNotFound',
  TAG_NAME_EXISTS: 'errors.tagNameExists',

  // PRD 错误
  PRD_NOT_FOUND: 'errors.prdNotFound',

  // 原型错误
  PROTOTYPE_NOT_FOUND: 'errors.prototypeNotFound',
  PAGE_NOT_FOUND: 'errors.pageNotFound',

  // 文档错误
  DOCUMENT_NOT_FOUND: 'errors.documentNotFound',
  MISSING_REQUIRED_FIELDS: 'errors.missingRequiredFields',
  INVALID_FILE_TYPE: 'errors.invalidFileType',

  // 通用错误
  UNKNOWN_ERROR: 'errors.unknownError',
} as const

/**
 * @deprecated 使用 ErrorKeys + useServerT 替代
 * 保留向后兼容，值为英文默认消息
 */
export const ErrorMessages = {
  WORKSPACE_NOT_FOUND: 'Workspace not found',
  WORKSPACE_NAME_EXISTS: 'Workspace name already exists',
  CANNOT_DELETE_DEFAULT: 'Cannot delete default workspace',
  TAG_NOT_FOUND: 'Tag not found',
  TAG_NAME_EXISTS: 'Tag with this name already exists',
  PRD_NOT_FOUND: 'PRD not found',
  PROTOTYPE_NOT_FOUND: 'Prototype not found',
  PAGE_NOT_FOUND: 'Page not found',
  DOCUMENT_NOT_FOUND: 'Document not found',
  MISSING_REQUIRED_FIELDS: 'Missing required fields',
  INVALID_FILE_TYPE: 'Invalid file type',
  UNKNOWN_ERROR: 'Unknown error',
} as const

/**
 * 创建国际化的错误响应
 */
export function createI18nError(event: H3Event, key: string, statusCode: number = 500) {
  const t = useServerT(event)
  return createError({
    statusCode,
    message: t(key),
  })
}

/**
 * 创建标准化的错误响应
 */
export function createErrorResponse(message: string, statusCode: number = 500) {
  return createError({
    statusCode,
    message,
  })
}
