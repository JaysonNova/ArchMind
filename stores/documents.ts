import { defineStore } from 'pinia'
import type { Document, DocumentListResponse, DocumentUploadResponse } from '@/types/document'

export const useDocumentsStore = defineStore('documents', () => {
  const documents = ref<Document[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchDocuments (workspaceId?: string) {
    loading.value = true
    error.value = null

    try {
      const query: Record<string, string> = {}
      if (workspaceId) {
        query.workspace_id = workspaceId
      }
      const response = await $fetch<DocumentListResponse>('/api/documents', { query })
      documents.value = response.data.documents
    } catch (err: any) {
      error.value = err.message || '获取文档列表失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function uploadDocument (file: File, workspaceId?: string) {
    const formData = new FormData()
    formData.append('file', file)
    if (workspaceId) {
      formData.append('workspace_id', workspaceId)
    }

    const response = await $fetch<DocumentUploadResponse>('/api/documents/upload', {
      method: 'POST',
      body: formData
    })

    documents.value.unshift(response.data)
    return response.data
  }

  async function deleteDocument (id: string) {
    await $fetch(`/api/documents/${id}`, { method: 'DELETE' })
    documents.value = documents.value.filter(d => d.id !== id)
  }

  async function getDocument (id: string) {
    const response = await $fetch<DocumentUploadResponse>(`/api/documents/${id}`)
    return response.data
  }

  return {
    documents,
    loading,
    error,
    fetchDocuments,
    uploadDocument,
    deleteDocument,
    getDocument
  }
})
