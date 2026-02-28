<template>
  <div class="max-w-[1400px] mx-auto pt-6">
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold">{{ $t('designDoc.title') }}</h1>
        <p class="text-sm text-muted-foreground mt-1">{{ $t('designDoc.description') }}</p>
      </div>
      <Button class="gap-2" @click="showGenerator = !showGenerator">
        <Sparkles v-if="!showGenerator" class="w-4 h-4" />
        <List v-else class="w-4 h-4" />
        {{ showGenerator ? $t('designDoc.viewList') : $t('designDoc.generate') }}
      </Button>
    </div>

    <!-- Generator Panel -->
    <div v-if="showGenerator" class="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle class="text-lg flex items-center gap-2">
            <Sparkles class="w-5 h-5 text-primary" />
            {{ $t('designDoc.generateTitle') }}
          </CardTitle>
          <CardDescription>{{ $t('designDoc.generateDescription') }}</CardDescription>
        </CardHeader>
        <CardContent class="space-y-6">
          <!-- Feishu URL Input -->
          <FeishuInput
            v-model="feishuUrl"
            :disabled="generating"
            @validated="handleFeishuValidated"
          />

          <!-- Template Upload -->
          <div class="space-y-2">
            <Label>{{ $t('designDoc.customTemplate') }}</Label>
            <div class="flex gap-2">
              <input
                ref="templateFileInput"
                type="file"
                accept=".md,.markdown,.txt"
                class="hidden"
                @change="handleTemplateUpload"
              />
              <Button
                variant="outline"
                class="flex-1"
                :disabled="generating"
                @click="templateFileInput?.click()"
              >
                <Upload class="w-4 h-4 mr-2" />
                {{ customTemplate ? $t('designDoc.templateUploaded') : $t('designDoc.uploadTemplate') }}
              </Button>
              <Button
                v-if="customTemplate"
                variant="ghost"
                size="icon"
                :disabled="generating"
                @click="clearTemplate"
              >
                <X class="w-4 h-4" />
              </Button>
            </div>
            <p v-if="customTemplate" class="text-xs text-muted-foreground">
              {{ $t('designDoc.templateInfo', { sections: templateSectionCount }) }}
            </p>
            <p v-else class="text-xs text-muted-foreground">
              {{ $t('designDoc.templateHint') }}
            </p>
          </div>

          <!-- Model Selection -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="space-y-2">
              <Label>{{ $t('designDoc.selectModel') }}</Label>
              <Select v-model="selectedModelId" :disabled="generating">
                <SelectTrigger>
                  <SelectValue :placeholder="$t('designDoc.selectModelPlaceholder')" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem
                    v-for="model in aiModels.models.value"
                    :key="model.id"
                    :value="model.id"
                  >
                    {{ model.name }}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div class="space-y-2">
              <Label>{{ $t('designDoc.additionalContext') }}</Label>
              <Textarea
                v-model="additionalContext"
                :placeholder="$t('designDoc.additionalContextPlaceholder')"
                :disabled="generating"
                rows="2"
                class="resize-none"
              />
            </div>
          </div>

          <!-- Generate Button -->
          <Button
            class="w-full gap-2"
            size="lg"
            :disabled="!feishuValidated || generating"
            @click="handleGenerate"
          >
            <Loader2 v-if="generating" class="w-4 h-4 animate-spin" />
            <Sparkles v-else class="w-4 h-4" />
            {{ generating ? $t('designDoc.generating') : $t('designDoc.generateBtn') }}
          </Button>
        </CardContent>
      </Card>

      <!-- Generation Result -->
      <Card v-if="generatedContent || generating">
        <CardContent class="pt-6">
          <DesignDocViewer
            :content="generatedContent"
            :title="feishuDocTitle"
          />
          <div v-if="generating" class="flex items-center gap-2 mt-4 text-sm text-muted-foreground">
            <Loader2 class="w-4 h-4 animate-spin" />
            {{ $t('designDoc.generatingHint') }}
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- Document List -->
    <div v-else>
      <!-- Loading -->
      <div v-if="listLoading" class="flex items-center justify-center py-20">
        <Loader2 class="w-6 h-6 animate-spin text-muted-foreground" />
      </div>

      <!-- Empty State -->
      <div v-else-if="designDocs.length === 0" class="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <FileCode2 class="w-16 h-16 mb-4 opacity-40" />
        <p class="text-lg font-medium mb-2">{{ $t('designDoc.empty') }}</p>
        <p class="text-sm mb-6">{{ $t('designDoc.emptyHint') }}</p>
        <Button variant="outline" @click="showGenerator = true">
          <Sparkles class="w-4 h-4 mr-2" />
          {{ $t('designDoc.generate') }}
        </Button>
      </div>

      <!-- Document Cards -->
      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card
          v-for="doc in designDocs"
          :key="doc.id"
          class="cursor-pointer hover:shadow-md transition-shadow group"
          @click="viewDoc(doc)"
        >
          <CardHeader class="pb-3">
            <div class="flex items-start justify-between">
              <div class="flex-1 min-w-0">
                <CardTitle class="text-base truncate">{{ doc.title }}</CardTitle>
                <CardDescription v-if="doc.feishuDocTitle" class="mt-1 truncate">
                  {{ doc.feishuDocTitle }}
                </CardDescription>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger as-child>
                  <Button
                    variant="ghost"
                    size="icon"
                    class="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                    @click.stop
                  >
                    <MoreHorizontal class="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem @click.stop="viewDoc(doc)">
                    <Eye class="w-4 h-4 mr-2" />
                    {{ $t('common.view') }}
                  </DropdownMenuItem>
                  <DropdownMenuItem @click.stop="copyDocContent(doc)">
                    <Copy class="w-4 h-4 mr-2" />
                    {{ $t('common.copy') }}
                  </DropdownMenuItem>
                  <DropdownMenuItem class="text-destructive" @click.stop="handleDelete(doc.id)">
                    <Trash2 class="w-4 h-4 mr-2" />
                    {{ $t('common.delete') }}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardHeader>
          <CardFooter class="pt-0 text-xs text-muted-foreground flex items-center gap-3">
            <Badge v-if="doc.modelUsed" variant="secondary" class="text-xs">{{ doc.modelUsed }}</Badge>
            <span>{{ formatDate(doc.createdAt) }}</span>
            <span v-if="doc.generationTime" class="ml-auto">{{ (doc.generationTime / 1000).toFixed(1) }}s</span>
          </CardFooter>
        </Card>
      </div>
    </div>

    <!-- View Document Dialog -->
    <Dialog v-model:open="viewDialogOpen">
      <DialogContent class="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>{{ viewingDoc?.title }}</DialogTitle>
          <DialogDescription v-if="viewingDoc?.feishuDocTitle">
            {{ $t('designDoc.sourceDoc') }}: {{ viewingDoc.feishuDocTitle }}
          </DialogDescription>
        </DialogHeader>
        <div class="flex-1 overflow-auto">
          <DesignDocViewer
            v-if="viewingDoc"
            :content="viewingDoc.content"
            :title="viewingDoc.title"
            :doc-id="viewingDoc.id"
            editable
            @saved="handleDocSaved"
          />
        </div>
      </DialogContent>
    </Dialog>

    <!-- Delete Confirmation -->
    <AlertDialog v-model:open="deleteDialogOpen">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{{ $t('designDoc.deleteConfirm') }}</AlertDialogTitle>
          <AlertDialogDescription>{{ $t('designDoc.deleteConfirmDesc') }}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{{ $t('common.cancel') }}</AlertDialogCancel>
          <AlertDialogAction class="bg-destructive text-destructive-foreground hover:bg-destructive/90" @click="confirmDelete">
            {{ $t('common.delete') }}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import {
  Sparkles, Loader2, FileCode2, List, MoreHorizontal,
  Eye, Copy, Trash2, Upload, X
} from 'lucide-vue-next'
import { Button } from '~/components/ui/button'
import { Badge } from '~/components/ui/badge'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '~/components/ui/card'
import { Label } from '~/components/ui/label'
import { Textarea } from '~/components/ui/textarea'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '~/components/ui/select'
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem
} from '~/components/ui/dropdown-menu'
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle
} from '~/components/ui/dialog'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle
} from '~/components/ui/alert-dialog'
import { useToast } from '~/components/ui/toast/use-toast'
import FeishuInput from '~/components/design-doc/FeishuInput.vue'
import DesignDocViewer from '~/components/design-doc/DesignDocViewer.vue'
import type { DesignDocument } from '~/types/design-doc'

definePageMeta({
  layout: 'dashboard',
  middleware: ['auth']
})

const { t, locale } = useI18n()
const { toast } = useToast()
const aiModels = useAiModels()

const showGenerator = ref(false)
const feishuUrl = ref('')
const feishuValidated = ref(false)
const feishuDocTitle = ref('')
const selectedModelId = ref('')
const additionalContext = ref('')
const generating = ref(false)
const generatedContent = ref('')

// Template upload
const templateFileInput = ref<HTMLInputElement | null>(null)
const customTemplate = ref('')
const templateSectionCount = computed(() => {
  if (!customTemplate.value) return 0
  const matches = customTemplate.value.match(/^##\s*(\d{1,2})[.\s、]/gm) || []
  return matches.length
})

const designDocs = ref<DesignDocument[]>([])
const listLoading = ref(true)
const viewDialogOpen = ref(false)
const viewingDoc = ref<DesignDocument | null>(null)
const deleteDialogOpen = ref(false)
const docToDelete = ref<string | null>(null)

onMounted(async () => {
  await Promise.all([
    fetchList(),
    aiModels.fetchAvailableModels()
  ])

  if (aiModels.selectedModel.value) {
    selectedModelId.value = aiModels.selectedModel.value
  }
})

function handleFeishuValidated(data: { title: string; valid: boolean }) {
  feishuValidated.value = data.valid
  if (data.valid) {
    feishuDocTitle.value = data.title
  }
}

async function handleTemplateUpload(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]

  if (!file) return

  // Validate file type
  const validExtensions = ['.md', '.markdown', '.txt']
  const fileName = file.name.toLowerCase()
  const isValid = validExtensions.some(ext => fileName.endsWith(ext))

  if (!isValid) {
    toast({
      title: t('designDoc.generateFailed'),
      description: '请上传 Markdown 格式的文件（.md, .markdown, .txt）',
      variant: 'destructive'
    })
    return
  }

  try {
    const text = await file.text()
    customTemplate.value = text
    toast({
      title: '模板上传成功',
      description: `已加载 ${templateSectionCount.value} 个章节`
    })
  } catch (err) {
    toast({
      title: '模板读取失败',
      variant: 'destructive'
    })
  }

  // Reset input
  if (target) target.value = ''
}

function clearTemplate() {
  customTemplate.value = ''
  toast({ title: '已清除自定义模板' })
}

async function handleGenerate() {
  if (!feishuUrl.value || !feishuValidated.value) return

  generating.value = true
  generatedContent.value = ''

  try {
    const response = await fetch('/api/v1/design-doc/stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        feishuUrl: feishuUrl.value,
        modelId: selectedModelId.value || undefined,
        additionalContext: additionalContext.value || undefined,
        customTemplate: customTemplate.value || undefined,
        maxTokens: 16384
      })
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
          } else if (data.type === 'retry') {
            generatedContent.value = ''
          } else if (data.type === 'done') {
            toast({ title: t('designDoc.generateSuccess') })
            fetchList()
          } else if (data.type === 'error') {
            throw new Error(data.message)
          }
        } catch (parseErr: any) {
          if (parseErr.message && !parseErr.message.includes('JSON')) {
            throw parseErr
          }
        }
      }
    }
  } catch (err: any) {
    toast({ title: err.message || t('designDoc.generateFailed'), variant: 'destructive' })
  } finally {
    generating.value = false
  }
}

async function fetchList() {
  listLoading.value = true
  try {
    const response = await $fetch<{
      success: boolean
      data: { items: DesignDocument[]; total: number }
    }>('/api/v1/design-doc', {
      query: { page: 1, limit: 50 }
    })

    if (response.success) {
      designDocs.value = response.data.items
    }
  } catch (err) {
    console.error('Failed to fetch design docs:', err)
  } finally {
    listLoading.value = false
  }
}

function viewDoc(doc: DesignDocument) {
  viewingDoc.value = { ...doc }
  viewDialogOpen.value = true
}

function handleDocSaved(newContent: string) {
  if (viewingDoc.value) {
    viewingDoc.value.content = newContent
    const idx = designDocs.value.findIndex(d => d.id === viewingDoc.value?.id)
    if (idx !== -1) {
      designDocs.value[idx].content = newContent
    }
  }
}

async function copyDocContent(doc: DesignDocument) {
  try {
    await navigator.clipboard.writeText(doc.content)
    toast({ title: t('common.copied') })
  } catch {
    toast({ title: t('common.copyFailed'), variant: 'destructive' })
  }
}

function handleDelete(id: string) {
  docToDelete.value = id
  deleteDialogOpen.value = true
}

async function confirmDelete() {
  if (!docToDelete.value) return

  try {
    await $fetch(`/api/v1/design-doc/${docToDelete.value}`, { method: 'DELETE' })
    designDocs.value = designDocs.value.filter(d => d.id !== docToDelete.value)
    toast({ title: t('designDoc.deleteSuccess') })
  } catch {
    toast({ title: t('designDoc.deleteFailed'), variant: 'destructive' })
  } finally {
    deleteDialogOpen.value = false
    docToDelete.value = null
  }
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr)
  return date.toLocaleDateString(locale.value, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
}
</script>
