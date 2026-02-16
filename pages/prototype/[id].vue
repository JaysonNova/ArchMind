<template>
  <div class="h-screen flex flex-col bg-background">
    <!-- 顶部工具栏 -->
    <header class="h-12 border-b flex items-center justify-between px-4 shrink-0">
      <div class="flex items-center gap-3">
        <Button variant="ghost" size="icon" class="h-8 w-8" @click="router.back()">
          <ArrowLeft class="w-4 h-4" />
        </Button>
        <Separator orientation="vertical" class="h-5" />
        <h1 class="text-sm font-semibold truncate max-w-[300px]">
          {{ prototypeState.prototype.value?.title || $t('prototype.title') }}
        </h1>
        <Badge v-if="prototypeState.prototype.value?.status" variant="secondary" class="text-xs">
          {{ prototypeState.prototype.value.status }}
        </Badge>
      </div>
      <div class="flex items-center gap-2">
        <!-- 视图切换 -->
        <div class="flex gap-0.5 bg-muted rounded-md p-0.5">
          <Button
            variant="ghost"
            size="icon"
            class="h-7 w-7"
            :class="{ 'bg-background shadow-sm': activeView === 'preview' }"
            title="预览"
            @click="activeView = 'preview'"
          >
            <Eye class="w-3.5 h-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            class="h-7 w-7"
            :class="{ 'bg-background shadow-sm': activeView === 'code' }"
            title="代码"
            @click="activeView = 'code'"
          >
            <Code class="w-3.5 h-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            class="h-7 w-7"
            :class="{ 'bg-background shadow-sm': activeView === 'split' }"
            title="分屏"
            @click="activeView = 'split'"
          >
            <Columns2 class="w-3.5 h-3.5" />
          </Button>
        </div>

        <Separator orientation="vertical" class="h-5" />

        <Button variant="outline" size="sm" class="h-8 gap-1.5" @click="handleSave">
          <Save class="w-3.5 h-3.5" />
          {{ $t('common.save') }}
        </Button>
        <Button variant="outline" size="sm" class="h-8 gap-1.5" @click="handleExport">
          <Download class="w-3.5 h-3.5" />
          {{ $t('prototype.exportHtml') }}
        </Button>
      </div>
    </header>

    <!-- 主体区域 -->
    <div class="flex-1 flex overflow-hidden">
      <!-- 左侧面板：页面列表 + 代码编辑 / 对话 -->
      <div v-if="activeView === 'split'" class="w-[45%] flex flex-col border-r">
        <PrototypePageNavigator
          v-if="prototypeState.pages.value.length > 1"
          :pages="prototypeState.pages.value"
          :active-page="prototypeState.activePageSlug.value"
          @select="prototypeState.activePageSlug.value = $event"
          @add-page="handleAddPage"
        />
        <PrototypeCodeEditor
          :model-value="prototypeState.activePageHtml.value"
          class="flex-1"
          @update:model-value="handleCodeChange"
        />
      </div>

      <!-- 右侧/全屏预览 -->
      <div class="flex-1 flex flex-col overflow-hidden">
        <PrototypePageNavigator
          v-if="activeView !== 'split' && prototypeState.pages.value.length > 1"
          :pages="prototypeState.pages.value"
          :active-page="prototypeState.activePageSlug.value"
          @select="prototypeState.activePageSlug.value = $event"
          @add-page="handleAddPage"
        />

        <!-- Preview 模式 -->
        <PrototypePreview
          v-if="activeView === 'preview' || activeView === 'split'"
          :html="prototypeState.activePageHtml.value"
          class="flex-1"
        />

        <!-- Code 模式 -->
        <PrototypeCodeEditor
          v-if="activeView === 'code'"
          :model-value="prototypeState.activePageHtml.value"
          class="flex-1"
          @update:model-value="handleCodeChange"
        />
      </div>
    </div>

    <!-- 底部对话输入（可折叠） -->
    <div class="border-t">
      <button
        class="w-full px-4 py-2 text-xs text-muted-foreground hover:bg-muted/50 flex items-center gap-2 transition-colors"
        @click="chatExpanded = !chatExpanded"
      >
        <MessageSquare class="w-3.5 h-3.5" />
        <span>{{ chatExpanded ? '收起 AI 助手' : '展开 AI 助手 — 描述修改需求' }}</span>
        <ChevronUp v-if="chatExpanded" class="w-3.5 h-3.5 ml-auto" />
        <ChevronDown v-else class="w-3.5 h-3.5 ml-auto" />
      </button>
      <div v-if="chatExpanded" class="px-4 pb-3">
        <div class="flex gap-2">
          <Textarea
            v-model="chatInput"
            :placeholder="$t('prototype.chatHint')"
            class="flex-1 min-h-[60px] max-h-[120px] text-sm"
            @keydown.ctrl.enter="handleChatSend"
            @keydown.meta.enter="handleChatSend"
          />
          <Button
            class="self-end"
            size="sm"
            :disabled="!chatInput.trim() || prototypeState.isGenerating.value"
            @click="handleChatSend"
          >
            <Send class="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>

    <!-- 添加页面对话框 -->
    <Dialog v-model:open="showAddPageDialog">
      <DialogContent class="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{{ $t('prototype.addPage') }}</DialogTitle>
        </DialogHeader>
        <div class="space-y-4">
          <div class="space-y-2">
            <Label for="pageName">{{ $t('prototype.pageName') }}</Label>
            <Input id="pageName" v-model="newPageName" :placeholder="$t('prototype.pageNamePlaceholder')" />
          </div>
          <div class="space-y-2">
            <Label for="pageSlug">{{ $t('prototype.pageSlug') }}</Label>
            <Input id="pageSlug" v-model="newPageSlug" :placeholder="$t('prototype.pageSlugPlaceholder')" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" @click="showAddPageDialog = false">{{ $t('common.cancel') }}</Button>
          <Button :disabled="!newPageName || !newPageSlug" @click="confirmAddPage">{{ $t('common.confirm') }}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import {
  ArrowLeft, Eye, Code, Columns2, Save, Download,
  MessageSquare, ChevronUp, ChevronDown, Send
} from 'lucide-vue-next'
import { Button } from '~/components/ui/button'
import { Badge } from '~/components/ui/badge'
import { Separator } from '~/components/ui/separator'
import { Textarea } from '~/components/ui/textarea'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from '~/components/ui/dialog'
import { useToast } from '~/components/ui/toast/use-toast'
import PrototypePreview from '~/components/prototype/PrototypePreview.vue'
import PrototypeCodeEditor from '~/components/prototype/PrototypeCodeEditor.vue'
import PrototypePageNavigator from '~/components/prototype/PrototypePageNavigator.vue'
import { usePrototype } from '~/composables/usePrototype'

definePageMeta({
  layout: false
})

const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const { toast } = useToast()

const prototypeState = usePrototype()
const activeView = ref<'preview' | 'code' | 'split'>('split')
const chatExpanded = ref(false)
const chatInput = ref('')
const showAddPageDialog = ref(false)
const newPageName = ref('')
const newPageSlug = ref('')

onMounted(async () => {
  const id = route.params.id as string
  if (id) {
    const loaded = await prototypeState.loadFromServer(id)
    if (!loaded) {
      // 尝试从 localStorage
      prototypeState.loadFromStorage()
    }
  }
})

function handleCodeChange (value: string) {
  if (prototypeState.activePageSlug.value) {
    prototypeState.updatePageHtml(prototypeState.activePageSlug.value, value)
  }
}

async function handleSave () {
  try {
    await prototypeState.saveAllToServer()
    toast({ title: t('prototype.saveSuccess'), variant: 'success' })
  } catch {
    toast({ title: t('prototype.saveFailed'), variant: 'destructive' })
  }
}

function handleExport () {
  const html = prototypeState.activePageHtml.value
  if (!html) return
  const blob = new Blob([html], { type: 'text/html' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${prototypeState.activePage.value?.pageName || 'prototype'}.html`
  a.click()
  URL.revokeObjectURL(url)
}

async function handleChatSend () {
  const message = chatInput.value.trim()
  if (!message) return
  chatInput.value = ''

  try {
    await prototypeState.editByChat(message, {
      modelId: 'glm-4.7'
    })
    toast({ title: '原型已更新', variant: 'success' })
  } catch (error) {
    toast({
      title: t('prototype.generateFailed'),
      description: error instanceof Error ? error.message : undefined,
      variant: 'destructive'
    })
  }
}

function handleAddPage () {
  newPageName.value = ''
  newPageSlug.value = ''
  showAddPageDialog.value = true
}

function confirmAddPage () {
  if (newPageName.value && newPageSlug.value) {
    prototypeState.addPage(newPageName.value, newPageSlug.value)
    showAddPageDialog.value = false
  }
}
</script>
