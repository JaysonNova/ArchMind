// @ts-expect-error h3 is provided by Nuxt
import type { H3Event } from 'h3'
// @ts-expect-error h3 is provided by Nuxt
import { getHeader, getCookie } from 'h3'
import en from '~/i18n/lang/en.json'
import zhCN from '~/i18n/lang/zh-CN.json'

type Messages = Record<string, any>

const locales: Record<string, Messages> = {
  en,
  'zh-CN': zhCN,
}

/**
 * 从请求中解析用户首选语言
 * 优先级: cookie > Accept-Language header > 默认 zh-CN
 */
function getLocaleFromEvent(event: H3Event): string {
  // 1. 从 cookie 中获取
  const cookieLocale = getCookie(event, 'i18n_locale')
  if (cookieLocale && locales[cookieLocale]) {
    return cookieLocale
  }

  // 2. 从 Accept-Language header 获取
  const acceptLanguage = getHeader(event, 'accept-language')
  if (acceptLanguage) {
    const languages = acceptLanguage.split(',').map((lang: string) => {
      const [code, q] = lang.trim().split(';q=')
      return { code: code.trim(), q: q ? parseFloat(q) : 1 }
    }).sort((a: { q: number }, b: { q: number }) => b.q - a.q)

    for (const { code } of languages) {
      if (code.startsWith('zh')) return 'zh-CN'
      if (code.startsWith('en')) return 'en'
    }
  }

  // 3. 默认中文
  return 'zh-CN'
}

/**
 * 根据 key 路径获取翻译值
 * @param messages - 语言包对象
 * @param key - 点分隔的 key 路径，如 'errors.workspaceNotFound'
 */
function getNestedValue(messages: Messages, key: string): string {
  const keys = key.split('.')
  let result: any = messages
  for (const k of keys) {
    if (result == null || typeof result !== 'object') return key
    result = result[k]
  }
  return typeof result === 'string' ? result : key
}

/**
 * 获取服务端翻译函数
 * 用法:
 * ```ts
 * const t = useServerT(event)
 * const msg = t('errors.workspaceNotFound')
 * ```
 */
export function useServerT(event: H3Event): (key: string) => string {
  const locale = getLocaleFromEvent(event)
  const messages = locales[locale] || locales['zh-CN']

  return (key: string) => getNestedValue(messages, key)
}
