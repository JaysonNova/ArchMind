<template>
  <div class="h-full flex flex-col overflow-hidden">
    <!-- 编辑器头部 -->
    <div class="flex-shrink-0 px-3 py-2 border-b border-border flex items-center justify-between bg-muted/30">
      <div class="flex items-center gap-2">
        <Code2 class="w-3.5 h-3.5 text-primary" />
        <span class="text-xs text-muted-foreground font-mono">HTML</span>
        <Badge v-if="!readonly" variant="outline" class="text-[10px] h-4 px-1">
          {{ $t('prototype.editable') }}
        </Badge>
      </div>
      <div class="flex gap-1">
        <Button variant="ghost" size="icon" class="h-6 w-6" :title="$t('prototype.formatCode')" @click="formatCode">
          <AlignLeft class="w-3 h-3" />
        </Button>
        <Button variant="ghost" size="icon" class="h-6 w-6" :title="$t('prototype.copy')" @click="copyCode">
          <Copy class="w-3 h-3" />
        </Button>
      </div>
    </div>
    <!-- Monaco Editor 区域 -->
    <div class="flex-1 overflow-hidden">
      <ClientOnly>
        <MonacoEditor
          :value="localValue"
          language="html"
          :theme="editorTheme"
          :options="editorOptions"
          class="h-full"
          @mount="handleMount"
          @change="handleChange"
        />
        <template #fallback>
          <div class="h-full flex items-center justify-center text-muted-foreground">
            <span class="text-sm">Loading editor...</span>
          </div>
        </template>
      </ClientOnly>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, shallowRef } from 'vue'
import { Code2, Copy, AlignLeft } from 'lucide-vue-next'
import { Button } from '~/components/ui/button'
import { Badge } from '~/components/ui/badge'
import { useToast } from '~/components/ui/toast/use-toast'
import MonacoEditor from '@guolao/vue-monaco-editor'

const { t } = useI18n()
const colorMode = useColorMode()

const props = defineProps<{
  modelValue: string
  readonly?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const { toast } = useToast()
const editorInstance = shallowRef<any>()
const localValue = ref(props.modelValue || '')

// 根据系统主题选择编辑器主题
const editorTheme = computed(() => {
  return colorMode.value === 'dark' ? 'vs-dark' : 'vs'
})

// Monaco Editor 配置
const editorOptions = computed(() => ({
  readOnly: props.readonly,
  minimap: { enabled: false },
  fontSize: 13,
  fontFamily: "'JetBrains Mono', 'Fira Code', 'SF Mono', Consolas, monospace",
  fontLigatures: true,
  lineNumbers: 'on',
  lineNumbersMinChars: 4,
  folding: true,
  foldingHighlight: true,
  foldingStrategy: 'indentation',
  showFoldingControls: 'mouseover',
  bracketPairColorization: { enabled: true },
  autoClosingBrackets: 'always',
  autoClosingQuotes: 'always',
  autoSurround: 'brackets',
  formatOnPaste: true,
  formatOnType: true,
  tabSize: 2,
  insertSpaces: true,
  wordWrap: 'on',
  wrappingStrategy: 'advanced',
  scrollBeyondLastLine: false,
  smoothScrolling: true,
  cursorBlinking: 'smooth',
  cursorSmoothCaretAnimation: 'on',
  renderWhitespace: 'selection',
  guides: {
    bracketPairs: true,
    indentation: true
  },
  suggest: {
    showKeywords: true,
    showSnippets: true,
    showClasses: true,
    showFunctions: true,
    showVariables: true,
    showConstants: true
  },
  quickSuggestions: {
    other: true,
    comments: false,
    strings: true
  },
  parameterHints: { enabled: true },
  padding: { top: 8, bottom: 8 }
}))

// 编辑器挂载后保存实例
function handleMount (editor: any) {
  editorInstance.value = editor
  // 确保编辑器内容与初始值同步
  if (props.modelValue && editor.getValue() !== props.modelValue) {
    editor.setValue(props.modelValue)
  }
  if (!props.readonly) {
    editor.focus()
  }
}

// 处理编辑器内容变化
function handleChange (value: string) {
  localValue.value = value
  if (!props.readonly) {
    emit('update:modelValue', value)
  }
}

// 同步外部更新到本地
watch(() => props.modelValue, (newValue) => {
  if (newValue !== localValue.value) {
    localValue.value = newValue || ''
    // 如果编辑器已挂载，直接更新编辑器内容
    if (editorInstance.value && editorInstance.value.getValue() !== newValue) {
      editorInstance.value.setValue(newValue || '')
    }
  }
})

// 格式化代码
async function formatCode () {
  if (!editorInstance.value || props.readonly) return
  try {
    await editorInstance.value.getAction('editor.action.formatDocument')?.run()
    toast({ title: t('prototype.formatSuccess'), variant: 'success' })
  } catch {
    toast({ title: t('prototype.formatFailed'), variant: 'destructive' })
  }
}

// 复制代码
async function copyCode () {
  try {
    await navigator.clipboard.writeText(localValue.value)
    toast({ title: t('common.copiedToClipboard') })
  } catch {
    toast({ title: t('common.copyFailed'), variant: 'destructive' })
  }
}
</script>
