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
          <!-- Source Selection Tabs -->
          <Tabs v-model="inputSource" class="w-full">
            <TabsList class="grid w-full grid-cols-2">
              <TabsTrigger value="feishu" :disabled="generating">
                {{ $t('designDoc.sourceFeishu') }}
              </TabsTrigger>
              <TabsTrigger value="pdf" :disabled="generating">
                {{ $t('designDoc.sourcePdf') }}
              </TabsTrigger>
            </TabsList>

            <!-- Feishu Input -->
            <TabsContent value="feishu" class="mt-4">
              <FeishuInput
                v-model="feishuUrl"
                :disabled="generating"
                @validated="handleFeishuValidated"
              />
            </TabsContent>

            <!-- PDF Upload -->
            <TabsContent value="pdf" class="mt-4">
              <div class="space-y-3">
                <Label>{{ $t('designDoc.pdfUpload') }}</Label>
                <div class="flex gap-2">
                  <input
                    ref="pdfFileInput"
                    type="file"
                    accept=".pdf"
                    class="hidden"
                    @change="handlePdfUpload"
                  />
                  <Button
                    variant="outline"
                    class="flex-1"
                    :disabled="generating || pdfUploading"
                    @click="pdfFileInput?.click()"
                  >
                    <Loader2 v-if="pdfUploading" class="w-4 h-4 mr-2 animate-spin" />
                    <Upload v-else class="w-4 h-4 mr-2" />
                    {{ pdfUploading ? $t('designDoc.pdfUploading') : (pdfData ? pdfData.title : $t('designDoc.pdfSelect')) }}
                  </Button>
                  <Button
                    v-if="pdfData"
                    variant="ghost"
                    size="icon"
                    :disabled="generating"
                    @click="clearPdf"
                  >
                    <X class="w-4 h-4" />
                  </Button>
                </div>
                <!-- PDF info -->
                <div v-if="pdfData" class="flex items-center gap-2 text-xs text-muted-foreground">
                  <Badge variant="secondary">
                    {{ $t('designDoc.pdfInfo', { pages: pdfData.pageCount, chars: pdfData.textLength, images: pdfData.imageCount }) }}
                  </Badge>
                </div>
                <p v-if="pdfData" class="text-xs text-muted-foreground/70 line-clamp-2">
                  {{ pdfData.preview }}...
                </p>
              </div>
            </TabsContent>
          </Tabs>

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
                variant="outline"
                size="sm"
                :disabled="generating"
                @click="downloadSampleTemplate"
              >
                <FileCode2 class="w-4 h-4 mr-1" />
                {{ $t('designDoc.downloadSample') }}
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
            <!-- Template loaded info with section list -->
            <div v-if="customTemplate" class="space-y-1">
              <p class="text-xs text-muted-foreground">
                {{ $t('designDoc.templateInfo', { sections: templateSectionCount }) }}
              </p>
              <div v-if="templateSectionNames.length > 0" class="flex flex-wrap gap-1 mt-1">
                <Badge
                  v-for="(name, idx) in templateSectionNames"
                  :key="idx"
                  variant="secondary"
                  class="text-xs"
                >
                  {{ name }}
                </Badge>
              </div>
            </div>
            <p v-else class="text-xs text-muted-foreground">
              {{ $t('designDoc.templateHint') }}
            </p>
            <!-- Template format hint -->
            <p class="text-xs text-muted-foreground/70">
              {{ $t('designDoc.templateFormatHint') }}
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
            :disabled="!canGenerate || generating"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs'
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
const inputSource = ref<'feishu' | 'pdf'>('feishu')
const feishuUrl = ref('')
const feishuValidated = ref(false)
const feishuDocTitle = ref('')
const selectedModelId = ref('')
const additionalContext = ref('')
const generating = ref(false)
const generatedContent = ref('')

// PDF upload
const pdfFileInput = ref<HTMLInputElement | null>(null)
const pdfUploading = ref(false)
const pdfData = ref<{
  title: string
  pageCount: number
  textLength: number
  imageCount: number
  content: string
  images: Array<{ base64: string; mediaType: string }>
  preview: string
} | null>(null)

// Can generate: either feishu validated or pdf uploaded
const canGenerate = computed(() => {
  if (inputSource.value === 'feishu') return feishuValidated.value
  if (inputSource.value === 'pdf') return !!pdfData.value
  return false
})

// Template upload
const templateFileInput = ref<HTMLInputElement | null>(null)
const customTemplate = ref('')
const templateSectionCount = computed(() => {
  if (!customTemplate.value) return 0
  // Match numbered sections: ## 1. / ## 1 / ## 1、
  const numberedMatches = customTemplate.value.match(/^##\s*(\d{1,2})[.\s、]/gm) || []
  if (numberedMatches.length > 0) return numberedMatches.length
  // Fallback: count all ## headings
  const allH2Matches = customTemplate.value.match(/^##\s+[^#\n]+/gm) || []
  return allH2Matches.length
})
const templateSectionNames = computed(() => {
  if (!customTemplate.value) return []
  // Try numbered sections first
  const numbered = customTemplate.value.match(/^##\s*\d{0,2}[.\s、]*[^\n]+/gm) || []
  if (numbered.length > 0) {
    return numbered.map(s => s.replace(/^##\s*/, '').trim())
  }
  // Fallback: all ## headings
  const allH2 = customTemplate.value.match(/^##\s+[^#\n]+/gm) || []
  return allH2.map(s => s.replace(/^##\s+/, '').trim())
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

function downloadSampleTemplate() {
  const sampleTemplate = `# 前端开发设计方案

## 1. 需求概述
- 需求背景与目标
- 核心用户场景
- 关键业务流程

### 业务流程图

\`\`\`mermaid
flowchart TD
    A[用户访问] --> B{是否登录?}
    B -->|是| C[进入主页面]
    B -->|否| D[跳转登录页]
    D --> E[完成登录]
    E --> C
    C --> F[核心操作流程]
    F --> G[操作结果反馈]
\`\`\`

## 2. 页面结构设计
### 2.1 页面清单与路由规划
| 页面名称 | 路由路径 | 页面类型 | 说明 |
|----------|---------|---------|------|

### 2.2 页面导航流程

\`\`\`mermaid
flowchart LR
    Home[首页] --> List[列表页]
    List --> Detail[详情页]
    Detail --> Edit[编辑页]
    Home --> Create[创建页]
    Create --> Detail
\`\`\`

### 2.3 布局方案
- Layout 选择与说明
- 公共区域设计（Header / Sidebar / Footer）

## 3. 组件架构设计

### 3.1 组件层级关系

\`\`\`mermaid
graph TD
    App[App.vue] --> Layout[Layout]
    Layout --> Header[HeaderNav]
    Layout --> Sidebar[AppSidebar]
    Layout --> Main[MainContent]
    Main --> PageA[PageComponent]
    PageA --> CompA[子组件A]
    PageA --> CompB[子组件B]
    CompB --> CompC[孙组件C]
\`\`\`

### 3.2 组件详细设计
#### [组件名称]
- **职责**: 组件功能描述
- **Props**:
  \`\`\`typescript
  interface Props {
    // 属性定义
  }
  \`\`\`
- **Emits**:
  \`\`\`typescript
  interface Emits {
    // 事件定义
  }
  \`\`\`
- **内部状态**: 关键 ref / reactive
- **交互逻辑**: 用户操作 → 系统响应

### 3.3 可复用组件识别
| 组件名称 | 复用场景 | 来源 |
|----------|---------|------|

## 4. 数据流与状态管理

### 4.1 数据流向图

\`\`\`mermaid
flowchart TD
    API[API 层] --> Store[Pinia Store]
    Store --> CompA[组件 A]
    Store --> CompB[组件 B]
    CompA -->|emit| Parent[父组件]
    Parent -->|props| CompA
    CompB -->|emit| Parent
\`\`\`

### 4.2 Store 结构定义
\`\`\`typescript
interface StoreState {
  // 状态字段
}
\`\`\`

### 4.3 缓存策略
- 缓存范围
- 失效机制

## 5. API 对接设计

### 5.1 接口清单
| 接口名称 | Method | Path | 请求参数 | 响应结构 | 说明 |
|----------|--------|------|---------|---------|------|

### 5.2 请求/响应流程

\`\`\`mermaid
sequenceDiagram
    participant U as 用户
    participant C as 组件
    participant S as Store
    participant A as API

    U->>C: 触发操作
    C->>S: dispatch action
    S->>A: HTTP 请求
    A-->>S: 响应数据
    S-->>C: 状态更新
    C-->>U: UI 更新
\`\`\`

### 5.3 错误处理策略
| 错误类型 | 处理方式 | 用户提示 |
|----------|---------|---------|

## 6. TypeScript 类型定义
### 6.1 核心实体类型
\`\`\`typescript
// 业务实体类型定义
\`\`\`

### 6.2 API 请求/响应类型
\`\`\`typescript
// API 类型定义
\`\`\`

## 7. 交互与动效设计

### 7.1 用户操作流程

\`\`\`mermaid
stateDiagram-v2
    [*] --> 空闲
    空闲 --> 加载中: 用户触发
    加载中 --> 成功: 请求完成
    加载中 --> 失败: 请求失败
    失败 --> 加载中: 重试
    成功 --> 空闲: 返回
\`\`\`

### 7.2 微交互设计
| 交互场景 | 动效描述 | 实现方式 |
|----------|---------|---------|

## 8. 响应式与性能优化
### 8.1 断点策略
| 断点 | 宽度范围 | 布局变化 |
|------|---------|---------|

### 8.2 性能优化
- 虚拟滚动
- 懒加载
- 代码分割

## 9. 技术风险与难点
| 风险项 | 影响等级 | 解决方案 | 备选方案 |
|--------|---------|---------|---------|

## 10. 开发任务拆解

### 10.1 任务依赖关系

\`\`\`mermaid
gantt
    title 开发计划
    dateFormat  YYYY-MM-DD
    section 基础设施
    项目搭建     :a1, 2026-01-01, 2d
    路由配置     :a2, after a1, 1d
    section 核心功能
    页面开发     :b1, after a2, 5d
    API 对接     :b2, after a2, 3d
    section 优化
    性能优化     :c1, after b1, 2d
    测试         :c2, after b2, 3d
\`\`\`

### 10.2 任务清单
| 任务 | 优先级 | 预估工时 | 依赖 | 负责人 |
|------|--------|---------|------|--------|
`

  const blob = new Blob([sampleTemplate], { type: 'text/markdown' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'design-doc-template-sample.md'
  a.click()
  URL.revokeObjectURL(url)

  toast({
    title: t('designDoc.sampleDownloaded'),
    description: t('designDoc.sampleDownloadedDesc')
  })
}

async function handlePdfUpload(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  if (file.size > 20 * 1024 * 1024) {
    toast({ title: t('designDoc.pdfSizeLimit'), variant: 'destructive' })
    return
  }

  if (!file.name.toLowerCase().endsWith('.pdf')) {
    toast({ title: t('designDoc.pdfFormatError'), variant: 'destructive' })
    return
  }

  pdfUploading.value = true
  try {
    const formData = new FormData()
    formData.append('pdf', file)

    const response = await $fetch<{ success: boolean; data: any }>('/api/v1/design-doc/upload-pdf', {
      method: 'POST',
      body: formData
    })

    if (response.success) {
      pdfData.value = response.data
      toast({ title: t('designDoc.pdfUploadSuccess') })
    }
  } catch (err: any) {
    toast({
      title: t('designDoc.pdfUploadFailed'),
      description: err.data?.message || err.message,
      variant: 'destructive'
    })
  } finally {
    pdfUploading.value = false
    if (target) target.value = ''
  }
}

function clearPdf() {
  pdfData.value = null
}

async function handleGenerate() {
  if (!canGenerate.value) return

  generating.value = true
  generatedContent.value = ''

  try {
    const requestBody: Record<string, any> = {
      modelId: selectedModelId.value || undefined,
      additionalContext: additionalContext.value || undefined,
      customTemplate: customTemplate.value || undefined,
      maxTokens: 16384,
      source: inputSource.value
    }

    if (inputSource.value === 'feishu') {
      requestBody.feishuUrl = feishuUrl.value
    } else if (inputSource.value === 'pdf' && pdfData.value) {
      requestBody.pdfContent = pdfData.value.content
      requestBody.pdfTitle = pdfData.value.title
      requestBody.pdfImages = pdfData.value.images
    }

    const response = await fetch('/api/v1/design-doc/stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
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
