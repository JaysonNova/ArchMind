<template>
  <div class="flex flex-col h-full overflow-hidden">
    <!-- Header -->
    <div class="flex-shrink-0 px-4 py-3 border-b border-border flex items-center justify-between gap-3 bg-muted/30">
      <h3 class="text-sm font-bold text-foreground tracking-tight">
        {{ $t('generate.documentEditor') }}
      </h3>
      <div v-if="content" class="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          class="h-8 w-8"
          :title="$t('generate.exportDeliverable')"
          @click="downloadPrd"
        >
          <Download class="w-4 h-4" />
        </Button>
      </div>
    </div>

    <!-- Toolbar -->
    <div v-if="editor" class="flex-shrink-0 border-b border-border px-2 py-1.5 flex flex-wrap items-center gap-0.5 bg-muted/20">
      <!-- Text formatting -->
      <Button
        variant="ghost"
        size="icon"
        class="h-7 w-7"
        :class="{ 'bg-accent': editor.isActive('bold') }"
        @click="editor.chain().focus().toggleBold().run()"
        title="Bold (Ctrl+B)"
      >
        <Bold class="w-3.5 h-3.5" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        class="h-7 w-7"
        :class="{ 'bg-accent': editor.isActive('italic') }"
        @click="editor.chain().focus().toggleItalic().run()"
        title="Italic (Ctrl+I)"
      >
        <Italic class="w-3.5 h-3.5" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        class="h-7 w-7"
        :class="{ 'bg-accent': editor.isActive('strike') }"
        @click="editor.chain().focus().toggleStrike().run()"
        title="Strikethrough"
      >
        <Strikethrough class="w-3.5 h-3.5" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        class="h-7 w-7"
        :class="{ 'bg-accent': editor.isActive('code') }"
        @click="editor.chain().focus().toggleCode().run()"
        title="Inline Code"
      >
        <Code class="w-3.5 h-3.5" />
      </Button>

      <Separator orientation="vertical" class="mx-1 h-5" />

      <!-- Headings -->
      <Button
        variant="ghost"
        size="icon"
        class="h-7 w-7"
        :class="{ 'bg-accent': editor.isActive('heading', { level: 1 }) }"
        @click="editor.chain().focus().toggleHeading({ level: 1 }).run()"
        title="Heading 1"
      >
        <Heading1 class="w-3.5 h-3.5" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        class="h-7 w-7"
        :class="{ 'bg-accent': editor.isActive('heading', { level: 2 }) }"
        @click="editor.chain().focus().toggleHeading({ level: 2 }).run()"
        title="Heading 2"
      >
        <Heading2 class="w-3.5 h-3.5" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        class="h-7 w-7"
        :class="{ 'bg-accent': editor.isActive('heading', { level: 3 }) }"
        @click="editor.chain().focus().toggleHeading({ level: 3 }).run()"
        title="Heading 3"
      >
        <Heading3 class="w-3.5 h-3.5" />
      </Button>

      <Separator orientation="vertical" class="mx-1 h-5" />

      <!-- Lists -->
      <Button
        variant="ghost"
        size="icon"
        class="h-7 w-7"
        :class="{ 'bg-accent': editor.isActive('bulletList') }"
        @click="editor.chain().focus().toggleBulletList().run()"
        title="Bullet List"
      >
        <List class="w-3.5 h-3.5" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        class="h-7 w-7"
        :class="{ 'bg-accent': editor.isActive('orderedList') }"
        @click="editor.chain().focus().toggleOrderedList().run()"
        title="Ordered List"
      >
        <ListOrdered class="w-3.5 h-3.5" />
      </Button>

      <Separator orientation="vertical" class="mx-1 h-5" />

      <!-- Block elements -->
      <Button
        variant="ghost"
        size="icon"
        class="h-7 w-7"
        :class="{ 'bg-accent': editor.isActive('blockquote') }"
        @click="editor.chain().focus().toggleBlockquote().run()"
        title="Blockquote"
      >
        <Quote class="w-3.5 h-3.5" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        class="h-7 w-7"
        :class="{ 'bg-accent': editor.isActive('codeBlock') }"
        @click="editor.chain().focus().toggleCodeBlock().run()"
        title="Code Block"
      >
        <FileCode class="w-3.5 h-3.5" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        class="h-7 w-7"
        @click="editor.chain().focus().setHorizontalRule().run()"
        title="Horizontal Rule"
      >
        <Minus class="w-3.5 h-3.5" />
      </Button>

      <Separator orientation="vertical" class="mx-1 h-5" />

      <!-- Table -->
      <Button
        variant="ghost"
        size="icon"
        class="h-7 w-7"
        @click="editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()"
        title="Insert Table"
      >
        <TableIcon class="w-3.5 h-3.5" />
      </Button>

      <Separator orientation="vertical" class="mx-1 h-5" />

      <!-- Undo/Redo -->
      <Button
        variant="ghost"
        size="icon"
        class="h-7 w-7"
        :disabled="!editor.can().undo()"
        @click="editor.chain().focus().undo().run()"
        title="Undo (Ctrl+Z)"
      >
        <Undo class="w-3.5 h-3.5" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        class="h-7 w-7"
        :disabled="!editor.can().redo()"
        @click="editor.chain().focus().redo().run()"
        title="Redo (Ctrl+Shift+Z)"
      >
        <Redo class="w-3.5 h-3.5" />
      </Button>
    </div>

    <!-- Editor Content -->
    <div class="flex-1 overflow-y-auto">
      <EditorContent
        v-if="editor"
        :editor="editor"
        class="prd-editor-content"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { watch, onBeforeUnmount, ref } from 'vue'
import { useEditor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import { Markdown } from '@tiptap/markdown'
import Placeholder from '@tiptap/extension-placeholder'
import { Table, TableRow, TableCell, TableHeader } from '@tiptap/extension-table'
import {
  Download,
  Bold,
  Italic,
  Strikethrough,
  Code,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  FileCode,
  Minus,
  Undo,
  Redo,
  Table as TableIcon,
} from 'lucide-vue-next'
import { Button } from '~/components/ui/button'
import { Separator } from '~/components/ui/separator'

const { t } = useI18n()

const props = defineProps<{
  content: string
}>()

const emit = defineEmits<{
  'update:content': [value: string]
}>()

// Flag to prevent feedback loops when setting content from prop
const isUpdatingFromProp = ref(false)

const editor = useEditor({
  content: props.content || '',
  contentType: 'markdown',
  extensions: [
    StarterKit.configure({
      link: {
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-primary underline',
        },
      },
    }),
    Markdown,
    Placeholder.configure({
      placeholder: () => t('generate.editorPlaceholder'),
    }),
    Table.configure({
      resizable: true,
    }),
    TableRow,
    TableCell,
    TableHeader,
  ],
  editorProps: {
    attributes: {
      class: 'prd-editor-content-inner focus:outline-none px-6 py-6 min-h-full',
    },
  },
  onUpdate: ({ editor: ed }) => {
    if (isUpdatingFromProp.value) return
    const markdown = ed.getMarkdown()
    emit('update:content', markdown)
  },
})

// Watch content prop changes (e.g., from AI generation)
watch(
  () => props.content,
  (newContent) => {
    if (!editor.value) return
    // Only update if content actually changed (avoid infinite loops)
    const currentMarkdown = editor.value.getMarkdown()
    if (newContent === currentMarkdown) return

    isUpdatingFromProp.value = true
    editor.value.commands.setContent(newContent || '', {
      emitUpdate: false,
      contentType: 'markdown',
    })
    isUpdatingFromProp.value = false
  }
)

function downloadPrd () {
  const markdown = editor.value?.getMarkdown() || props.content
  const element = document.createElement('a')
  element.setAttribute('href', 'data:text/markdown;charset=utf-8,' + encodeURIComponent(markdown))
  element.setAttribute('download', `PRD-${new Date().toISOString().split('T')[0]}.md`)
  element.style.display = 'none'
  document.body.appendChild(element)
  element.click()
  document.body.removeChild(element)
}

onBeforeUnmount(() => {
  editor.value?.destroy()
})
</script>
