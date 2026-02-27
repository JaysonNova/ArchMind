<template>
  <div class="design-doc-viewer">
    <!-- Toolbar -->
    <div class="flex items-center justify-between mb-4 px-1">
      <div class="flex items-center gap-2 text-sm text-muted-foreground">
        <FileCode2 class="w-4 h-4" />
        <span>{{ title || $t('designDoc.preview') }}</span>
      </div>
      <div class="flex items-center gap-1">
        <Button
          v-if="editable"
          variant="ghost"
          size="sm"
          @click="toggleEditMode"
        >
          <Pencil v-if="!isEditing" class="w-4 h-4 mr-1" />
          <Eye v-else class="w-4 h-4 mr-1" />
          {{ isEditing ? $t('designDoc.preview') : $t('designDoc.edit') }}
        </Button>
        <Button
          v-if="isEditing"
          variant="default"
          size="sm"
          :disabled="saving || editContent === content"
          @click="handleSave"
        >
          <Loader2 v-if="saving" class="w-4 h-4 mr-1 animate-spin" />
          <Save v-else class="w-4 h-4 mr-1" />
          {{ $t('common.save') }}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          :disabled="!content"
          @click="copyToClipboard"
        >
          <Check v-if="copied" class="w-4 h-4 mr-1 text-green-500" />
          <Copy v-else class="w-4 h-4 mr-1" />
          {{ copied ? $t('common.copied') : $t('common.copy') }}
        </Button>
      </div>
    </div>

    <!-- Edit Mode -->
    <div v-if="isEditing" class="grid grid-cols-2 gap-4">
      <div class="flex flex-col">
        <div class="text-xs font-medium text-muted-foreground mb-1 px-1">Markdown</div>
        <Textarea
          v-model="editContent"
          class="flex-1 font-mono text-sm resize-none min-h-[calc(100vh-320px)]"
          :placeholder="$t('designDoc.editPlaceholder')"
        />
      </div>
      <div class="flex flex-col">
        <div class="text-xs font-medium text-muted-foreground mb-1 px-1">{{ $t('designDoc.preview') }}</div>
        <ScrollArea class="flex-1 rounded-lg border bg-muted/30 p-6 min-h-[calc(100vh-320px)]">
          <div
            v-if="editPreviewHtml"
            class="prose prose-sm prose-slate dark:prose-invert max-w-none design-doc-prose"
            v-html="editPreviewHtml"
          />
        </ScrollArea>
      </div>
    </div>

    <!-- View Mode -->
    <ScrollArea v-else class="h-[calc(100vh-320px)] rounded-lg border bg-muted/30 p-6">
      <div
        v-if="content"
        class="prose prose-sm prose-slate dark:prose-invert max-w-none design-doc-prose"
        v-html="renderedHtml"
      />
      <div v-else class="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <FileCode2 class="w-12 h-12 mb-3 opacity-30" />
        <p class="text-sm">{{ $t('designDoc.noContent') }}</p>
      </div>
    </ScrollArea>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import { FileCode2, Copy, Check, Pencil, Eye, Save, Loader2 } from 'lucide-vue-next'
import { Button } from '~/components/ui/button'
import { Textarea } from '~/components/ui/textarea'
import { ScrollArea } from '~/components/ui/scroll-area'
import { useToast } from '~/components/ui/toast/use-toast'

interface Props {
  content: string
  title?: string
  editable?: boolean
  docId?: string
}

const props = withDefaults(defineProps<Props>(), {
  editable: false
})

const emit = defineEmits<{
  (e: 'update:content', content: string): void
  (e: 'saved', content: string): void
}>()

const { toast } = useToast()
const { t } = useI18n()

const copied = ref(false)
const isEditing = ref(false)
const editContent = ref('')
const saving = ref(false)

marked.setOptions({
  breaks: true,
  gfm: true
})

const SANITIZE_CONFIG = {
  ALLOWED_TAGS: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'br', 'ul', 'ol', 'li',
    'strong', 'em', 'code', 'pre', 'blockquote', 'table', 'thead',
    'tbody', 'tr', 'th', 'td', 'a', 'hr', 'mark', 'del', 'input', 'span', 'div'],
  ALLOWED_ATTR: ['href', 'target', 'rel', 'class', 'type', 'checked', 'disabled']
}

function renderMarkdown(md: string): string {
  if (!md) return ''
  const rawHtml = marked(md) as string
  if (!import.meta.client) return rawHtml
  return DOMPurify.sanitize(rawHtml, SANITIZE_CONFIG)
}

const renderedHtml = computed(() => renderMarkdown(props.content))
const editPreviewHtml = computed(() => renderMarkdown(editContent.value))

watch(() => props.content, (val) => {
  if (!isEditing.value) {
    editContent.value = val
  }
})

function toggleEditMode() {
  if (!isEditing.value) {
    editContent.value = props.content
  }
  isEditing.value = !isEditing.value
}

async function handleSave() {
  if (!props.docId || editContent.value === props.content) return

  saving.value = true
  try {
    await $fetch(`/api/v1/design-doc/${props.docId}`, {
      method: 'PATCH',
      body: { content: editContent.value }
    })
    emit('update:content', editContent.value)
    emit('saved', editContent.value)
    isEditing.value = false
    toast({ title: t('common.saved') })
  } catch (err: any) {
    toast({ title: err.data?.message || t('common.saveFailed'), variant: 'destructive' })
  } finally {
    saving.value = false
  }
}

async function copyToClipboard() {
  const textToCopy = isEditing.value ? editContent.value : props.content
  if (!textToCopy) return

  try {
    await navigator.clipboard.writeText(textToCopy)
    copied.value = true
    toast({ title: t('common.copied') })
    setTimeout(() => { copied.value = false }, 2000)
  } catch {
    toast({ title: t('common.copyFailed'), variant: 'destructive' })
  }
}
</script>

<style scoped>
.design-doc-prose :deep(h1) {
  @apply text-2xl font-bold mt-8 mb-4 pb-2 border-b border-border;
}
.design-doc-prose :deep(h2) {
  @apply text-xl font-semibold mt-6 mb-3 pb-1 border-b border-border/50;
}
.design-doc-prose :deep(h3) {
  @apply text-lg font-semibold mt-5 mb-2;
}
.design-doc-prose :deep(h4) {
  @apply text-base font-semibold mt-4 mb-2;
}
.design-doc-prose :deep(p) {
  @apply my-2 leading-relaxed;
}
.design-doc-prose :deep(pre) {
  background-color: hsl(var(--muted)) !important;
  @apply p-4 rounded-lg overflow-x-auto my-4 text-sm border border-border/30;
  color: hsl(var(--foreground));
}
.design-doc-prose :deep(code) {
  background-color: hsl(var(--muted));
  @apply px-1.5 py-0.5 rounded text-sm font-mono;
  color: hsl(var(--foreground));
}
.design-doc-prose :deep(code)::before,
.design-doc-prose :deep(code)::after {
  content: '' !important;
}
.design-doc-prose :deep(pre code) {
  background-color: transparent !important;
  @apply p-0;
  font-size: inherit;
}
.design-doc-prose :deep(pre code)::before,
.design-doc-prose :deep(pre code)::after {
  content: '' !important;
}
.design-doc-prose :deep(table) {
  @apply w-full border-collapse my-4 text-sm;
}
.design-doc-prose :deep(thead) {
  @apply bg-muted/50;
}
.design-doc-prose :deep(th) {
  @apply border border-border px-3 py-2 text-left font-semibold;
}
.design-doc-prose :deep(td) {
  @apply border border-border px-3 py-2;
}
.design-doc-prose :deep(tr:nth-child(even)) {
  @apply bg-muted/20;
}
.design-doc-prose :deep(ul) {
  @apply list-disc pl-6 my-3 space-y-1;
}
.design-doc-prose :deep(ol) {
  @apply list-decimal pl-6 my-3 space-y-1;
}
.design-doc-prose :deep(li) {
  @apply leading-relaxed;
}
.design-doc-prose :deep(blockquote) {
  @apply border-l-4 border-primary/30 pl-4 my-4 italic text-muted-foreground;
}
.design-doc-prose :deep(hr) {
  @apply my-6 border-border;
}
.design-doc-prose :deep(a) {
  @apply text-primary hover:underline;
}
.design-doc-prose :deep(strong) {
  @apply font-semibold;
}
</style>
