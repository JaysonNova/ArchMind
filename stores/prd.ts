import { defineStore } from 'pinia'
import type { PRDDocument } from '@/types/prd'

export const usePrdStore = defineStore('prd', () => {
  const prds = ref<PRDDocument[]>([])
  const currentPrd = ref<PRDDocument | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchPrds () {
    loading.value = true
    error.value = null

    try {
      const response = await $fetch('/api/prd') as any
      prds.value = response.data.prds
    } catch (err: any) {
      error.value = err.message || '获取 PRD 列表失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function getPrd (id: string) {
    loading.value = true
    error.value = null

    try {
      const response = await $fetch(`/api/prd/${id}`) as any
      currentPrd.value = response.data
      return response.data
    } catch (err: any) {
      error.value = err.message || '获取 PRD 失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function deletePrd (id: string) {
    await $fetch(`/api/prd/${id}`, { method: 'DELETE' })
    prds.value = prds.value.filter(p => p.id !== id)
  }

  return {
    prds,
    currentPrd,
    loading,
    error,
    fetchPrds,
    getPrd,
    deletePrd
  }
})
