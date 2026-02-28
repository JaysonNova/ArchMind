/**
 * 设计方案 Composable
 * 管理飞书文档解析和设计方案生成的前端逻辑
 */

import type {
  DesignDocument,
  DesignDocGenerateRequest,
  DesignDocListResponse
} from '~/types/design-doc'

export function useDesignDoc() {
  const documents = ref<DesignDocument[]>([])
  const currentDoc = ref<DesignDocument | null>(null)
  const total = ref(0)
  const loading = ref(false)
  const generating = ref(false)
  const parsing = ref(false)
  const generatedContent = ref('')
  const error = ref<string | null>(null)

  const feishuDocTitle = ref('')
  const feishuDocContent = ref('')
  const feishuValidated = ref(false)

  /**
   * 验证飞书链接
   */
  async function validateFeishuUrl(url: string) {
    parsing.value = true
    error.value = null
    feishuValidated.value = false

    try {
      const response = await $fetch<{
        success: boolean
        valid: boolean
        message?: string
        data?: { title: string; documentId: string; type: string }
      }>('/api/v1/feishu/validate', {
        method: 'POST',
        body: { url }
      })

      if (response.valid && response.data) {
        feishuDocTitle.value = response.data.title
        feishuValidated.value = true
        return { valid: true, title: response.data.title }
      }

      error.value = response.message || '链接无效'
      return { valid: false, message: response.message }
    } catch (err: any) {
      error.value = err.data?.message || err.message || '验证失败'
      return { valid: false, message: error.value }
    } finally {
      parsing.value = false
    }
  }

  /**
   * 解析飞书文档内容
   */
  async function parseFeishuDocument(url: string) {
    parsing.value = true
    error.value = null

    try {
      const response = await $fetch<{
        success: boolean
        data: { title: string; documentId: string; content: string; contentLength: number }
      }>('/api/v1/feishu/document', {
        method: 'POST',
        body: { url }
      })

      feishuDocTitle.value = response.data.title
      feishuDocContent.value = response.data.content
      feishuValidated.value = true

      return response.data
    } catch (err: any) {
      error.value = err.data?.message || err.message || '文档解析失败'
      throw err
    } finally {
      parsing.value = false
    }
  }

  /**
   * 流式生成设计方案
   */
  async function generateStream(request: DesignDocGenerateRequest) {
    generating.value = true
    generatedContent.value = ''
    error.value = null

    try {
      const response = await fetch('/api/v1/design-doc/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || '生成请求失败')
      }

      const reader = response.body?.getReader()
      if (!reader) throw new Error('无法读取响应流')

      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })

        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          const trimmed = line.trim()
          if (!trimmed.startsWith('data: ')) continue

          try {
            const data = JSON.parse(trimmed.slice(6))

            if (data.type === 'doc_parsed') {
              feishuDocTitle.value = data.title
            } else if (data.type === 'chunk') {
              generatedContent.value += data.chunk
            } else if (data.type === 'done') {
              feishuDocTitle.value = data.feishuDocTitle || feishuDocTitle.value
            } else if (data.type === 'error') {
              error.value = data.message
            }
          } catch {
            // SSE 行可能不完整，忽略解析错误
          }
        }
      }
    } catch (err: any) {
      error.value = err.message || '生成失败'
      throw err
    } finally {
      generating.value = false
    }
  }

  /**
   * 获取设计方案列表
   */
  async function fetchList(page = 1, limit = 20) {
    loading.value = true
    error.value = null

    try {
      const response = await $fetch<DesignDocListResponse>(
        '/api/v1/design-doc',
        { query: { page, limit } }
      )

      documents.value = response.data.items
      total.value = response.data.total
    } catch (err: any) {
      error.value = err.data?.message || err.message || '获取列表失败'
    } finally {
      loading.value = false
    }
  }

  /**
   * 获取设计方案详情
   */
  async function fetchById(id: string) {
    loading.value = true
    error.value = null

    try {
      const response = await $fetch<{ success: boolean; data: DesignDocument }>(
        `/api/v1/design-doc/${id}`
      )
      currentDoc.value = response.data
      return response.data
    } catch (err: any) {
      error.value = err.data?.message || err.message || '获取详情失败'
      return null
    } finally {
      loading.value = false
    }
  }

  /**
   * 删除设计方案
   */
  async function deleteDoc(id: string) {
    try {
      await $fetch(`/api/v1/design-doc/${id}`, { method: 'DELETE' })
      documents.value = documents.value.filter(d => d.id !== id)
      total.value = Math.max(0, total.value - 1)
      return true
    } catch (err: any) {
      error.value = err.data?.message || err.message || '删除失败'
      return false
    }
  }

  function reset() {
    generatedContent.value = ''
    feishuDocTitle.value = ''
    feishuDocContent.value = ''
    feishuValidated.value = false
    error.value = null
    generating.value = false
    parsing.value = false
  }

  return {
    documents,
    currentDoc,
    total,
    loading,
    generating,
    parsing,
    generatedContent,
    error,
    feishuDocTitle,
    feishuDocContent,
    feishuValidated,
    validateFeishuUrl,
    parseFeishuDocument,
    generateStream,
    fetchList,
    fetchById,
    deleteDoc,
    reset
  }
}
