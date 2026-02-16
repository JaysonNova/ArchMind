<template>
  <div class="h-full flex flex-col overflow-hidden">
    <!-- 编辑器头部 -->
    <div class="flex-shrink-0 px-3 py-2 border-b border-border flex items-center justify-between bg-muted/30">
      <span class="text-xs text-muted-foreground font-mono">HTML</span>
      <div class="flex gap-1">
        <Button variant="ghost" size="icon" class="h-6 w-6" :title="$t('prototype.copy')" @click="copyCode">
          <Copy class="w-3 h-3" />
        </Button>
      </div>
    </div>
    <!-- 编辑区域 -->
    <div class="flex-1 overflow-hidden relative">
      <textarea
        ref="textareaRef"
        :value="modelValue"
        :readonly="readonly"
        class="w-full h-full resize-none bg-background text-foreground font-mono text-sm p-4 focus:outline-none overflow-auto"
        :class="{ 'opacity-80 cursor-default': readonly }"
        spellcheck="false"
        @input="handleInput"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'
import { Copy } from 'lucide-vue-next'
import { Button } from '~/components/ui/button'
import { useToast } from '~/components/ui/toast/use-toast'

const { t } = useI18n()

const props = defineProps<{
  modelValue: string
  readonly?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const { toast } = useToast()
const textareaRef = ref<HTMLTextAreaElement>()

let debounceTimer: ReturnType<typeof setTimeout> | null = null

function handleInput (e: Event) {
  if (props.readonly) return
  const value = (e.target as HTMLTextAreaElement).value
  // debounce 300ms 避免频繁更新 iframe
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    emit('update:modelValue', value)
  }, 300)
}

// 流式更新时自动滚动到底部
watch(() => props.modelValue, async () => {
  if (props.readonly && textareaRef.value) {
    await nextTick()
    textareaRef.value.scrollTop = textareaRef.value.scrollHeight
  }
})

async function copyCode () {
  try {
    await navigator.clipboard.writeText(props.modelValue)
    toast({ title: t('common.copiedToClipboard') })
  } catch {
    toast({ title: t('common.copyFailed'), variant: 'destructive' })
  }
}
</script>
