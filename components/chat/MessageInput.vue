<template>
  <div class="p-4 flex-shrink-0">
    <!-- Integrated Input Container -->
    <div
      ref="containerRef"
      class="relative rounded-xl bg-muted shadow-sm transition-all"
      :style="{ height: `${containerHeight}px` }"
    >
      <!-- Resize Handle -->
      <div
        class="resize-handle absolute top-0 left-0 right-0 h-4 cursor-ns-resize flex items-center justify-center group select-none"
        :class="{ 'is-resizing': isResizing }"
        @mousedown="startResize"
      >
        <div class="w-12 h-1 rounded-full bg-border transition-all group-hover:bg-primary group-hover:w-16" />
      </div>

      <!-- Input Area -->
      <Textarea
        ref="textareaRef"
        v-model="input"
        :placeholder="$t('chat.inputPlaceholder')"
        :disabled="isLoading"
        class="w-full h-full resize-none border-0 rounded-none focus-visible:ring-0 focus-visible:ring-offset-0 pt-3 pb-12 px-4 bg-transparent"
        @keydown="handleKeydown"
        @compositionstart="isComposing = true"
        @compositionend="isComposing = false"
      />

      <!-- Bottom Controls Bar -->
      <div ref="bottomBarRef" class="absolute bottom-0 left-0 right-0 px-3 py-2 flex items-center justify-between bg-transparent rounded-b-lg">
        <!-- Left Controls -->
        <div ref="leftControlsRef" class="flex items-center gap-2 shrink-0">
          <!-- Model Selector -->
          <Select v-model="selectedModel" :disabled="isLoading">
            <SelectTrigger class="h-8 w-[160px] text-xs border-0 shadow-none hover:bg-background/80">
              <SelectValue :placeholder="$t('chat.selectModel')" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem v-for="model in availableModels" :key="model.id" :value="model.id">
                {{ model.label }}
              </SelectItem>
            </SelectContent>
          </Select>

          <!-- RAG Toggle -->
          <Button
            variant="ghost"
            size="sm"
            :disabled="isLoading"
            class="h-8 gap-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-background/60"
            @click="useRAG = !useRAG"
          >
            <span
              class="w-2 h-2 rounded-full shrink-0"
              :class="useRAG ? 'bg-green-400 animate-pulse' : 'bg-muted-foreground/30'"
            />
            <BookOpen class="w-3.5 h-3.5" />
            <span>RAG</span>
          </Button>
        </div>

        <!-- Right Controls -->
        <div class="flex items-center gap-2 shrink-0">
          <!-- Keyboard Hint (hidden entirely when space is insufficient) -->
          <span
            ref="hintRef"
            class="text-xs text-muted-foreground whitespace-nowrap"
            :class="{ 'invisible absolute': !showHint }"
          >
            {{ $t('chat.sendShortcutEnter') }}
          </span>

          <!-- Send Button -->
          <Button
            size="sm"
            :disabled="!input.trim() || isLoading"
            @click="handleSubmit"
            class="h-8 w-8 p-0 shrink-0"
          >
            <Loader2 v-if="isLoading" class="w-4 h-4 animate-spin" />
            <Send v-else class="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { BookOpen, Send, Loader2 } from 'lucide-vue-next'

const { locale } = useI18n()

const emit = defineEmits<{
  send: [message: string, options: { modelId: string; useRAG: boolean }]
}>()

const props = defineProps<{
  isLoading?: boolean
  availableModels: Array<{ id: string; label: string }>
}>()

const RAG_STORAGE_KEY = 'archmind-use-rag'
const HEIGHT_STORAGE_KEY = 'archmind-input-height'
const MIN_HEIGHT = 120
const MAX_HEIGHT = 400
const DEFAULT_HEIGHT = 160

const input = ref('')
const selectedModel = ref(props.availableModels[0]?.id || '')
const useRAG = ref(false)
const isComposing = ref(false)
const containerRef = ref<HTMLDivElement>()
const textareaRef = ref<HTMLTextAreaElement>()
const bottomBarRef = ref<HTMLDivElement>()
const leftControlsRef = ref<HTMLDivElement>()
const hintRef = ref<HTMLSpanElement>()
const containerHeight = ref(DEFAULT_HEIGHT)
const isResizing = ref(false)
const startY = ref(0)
const startHeight = ref(0)
const showHint = ref(false)
let resizeObserver: ResizeObserver | null = null
let hintNaturalWidth = 0

// 检测底部栏是否有足够空间显示 tips
function checkHintVisibility() {
  if (!bottomBarRef.value || !leftControlsRef.value) return
  const barWidth = bottomBarRef.value.clientWidth
  const leftWidth = leftControlsRef.value.offsetWidth
  // 发送按钮 32px + gap 8px + justify-between 间距
  const rightFixedWidth = 40
  const available = barWidth - leftWidth - rightFixedWidth
  // hintNaturalWidth 包含 tips 文字宽度 + gap
  showHint.value = available >= hintNaturalWidth + 8
}

// 从 localStorage 恢复状态
onMounted(() => {
  const savedRAGState = localStorage.getItem(RAG_STORAGE_KEY)
  if (savedRAGState !== null) {
    useRAG.value = savedRAGState === 'true'
  }

  const savedHeight = localStorage.getItem(HEIGHT_STORAGE_KEY)
  if (savedHeight) {
    const height = parseInt(savedHeight, 10)
    if (height >= MIN_HEIGHT && height <= MAX_HEIGHT) {
      containerHeight.value = height
    }
  }

  // 先测量 hint 的自然宽度（此时 hint 为 invisible absolute，不影响布局但可测量）
  if (hintRef.value) {
    hintNaturalWidth = hintRef.value.offsetWidth
  }

  // 监听底部控制栏宽度，决定是否显示 tips
  if (bottomBarRef.value) {
    resizeObserver = new ResizeObserver(() => {
      checkHintVisibility()
    })
    resizeObserver.observe(bottomBarRef.value)
    checkHintVisibility()
  }
})

// 监听语言切换，重新测量 hint 宽度并检查可见性
watch(locale, async () => {
  showHint.value = false
  await nextTick()
  if (hintRef.value) {
    hintNaturalWidth = hintRef.value.offsetWidth
  }
  checkHintVisibility()
})

// 监听 RAG 开关变化,持久化到 localStorage
watch(useRAG, (newValue) => {
  localStorage.setItem(RAG_STORAGE_KEY, String(newValue))
})

// 监听高度变化,持久化到 localStorage
watch(containerHeight, (newValue) => {
  localStorage.setItem(HEIGHT_STORAGE_KEY, String(newValue))
})

// Auto-select first model when availableModels changes
watch(
  () => props.availableModels,
  (newModels) => {
    if (newModels.length > 0 && !selectedModel.value) {
      selectedModel.value = newModels[0].id
    }
  }
)

function startResize(event: MouseEvent) {
  isResizing.value = true
  startY.value = event.clientY
  startHeight.value = containerHeight.value

  // 添加 body 样式防止选中文本
  document.body.style.userSelect = 'none'
  document.body.style.cursor = 'ns-resize'

  document.addEventListener('mousemove', handleResize)
  document.addEventListener('mouseup', stopResize)
  event.preventDefault()
}

function handleResize(event: MouseEvent) {
  if (!isResizing.value) return

  // 使用 requestAnimationFrame 优化性能
  requestAnimationFrame(() => {
    const deltaY = startY.value - event.clientY // 向上为正
    const newHeight = Math.max(MIN_HEIGHT, Math.min(MAX_HEIGHT, startHeight.value + deltaY))
    containerHeight.value = newHeight
  })
}

function stopResize() {
  isResizing.value = false

  // 恢复 body 样式
  document.body.style.userSelect = ''
  document.body.style.cursor = ''

  document.removeEventListener('mousemove', handleResize)
  document.removeEventListener('mouseup', stopResize)
}

onUnmounted(() => {
  document.removeEventListener('mousemove', handleResize)
  document.removeEventListener('mouseup', stopResize)
  resizeObserver?.disconnect()
  resizeObserver = null
})

function handleKeydown (event: KeyboardEvent) {
  // Enter without Shift sends the message (but not during IME composition)
  if (event.key === 'Enter' && !event.shiftKey && !isComposing.value) {
    event.preventDefault()
    handleSubmit()
  }
  // Shift+Enter allows newline (default textarea behavior)
}

function handleSubmit () {
  if (!input.value.trim() || props.isLoading) return
  emit('send', input.value, {
    modelId: selectedModel.value,
    useRAG: useRAG.value
  })
  input.value = ''
}
</script>

<style scoped>
.resize-handle {
  user-select: none;
  -webkit-user-select: none;
  touch-action: none;
}

.resize-handle.is-resizing {
  cursor: ns-resize !important;
}

/* 拖拽时禁用文本选择 */
.resize-handle.is-resizing * {
  user-select: none !important;
  -webkit-user-select: none !important;
}

</style>
