<template>
  <div class="document-list">
    <div v-if="loading" class="text-center py-8">
      <div class="flex flex-col items-center gap-2">
        <div class="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
        <p class="text-muted-foreground">
          {{ $t('documents.loading') }}
        </p>
      </div>
    </div>

    <div v-else-if="documents.length === 0" class="text-center py-8">
      <FileText class="w-12 h-12 mx-auto text-muted-foreground mb-2" />
      <p class="text-muted-foreground">
        {{ $t('documents.noDocuments') }}
      </p>
    </div>

    <div v-else class="space-y-3">
      <Card
        v-for="doc in displayDocuments"
        :key="doc.id"
        class="hover:shadow-md transition-shadow cursor-pointer"
        @click="$emit('select', doc.id)"
      >
        <CardContent class="p-4">
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-3 flex-1 min-w-0">
              <component :is="getFileIcon(doc.fileType)" class="w-8 h-8 text-primary flex-shrink-0" />
              <div class="flex-1 min-w-0">
                <h4 class="font-semibold truncate">
                  {{ doc.title }}
                </h4>
                <p class="text-sm text-muted-foreground truncate">
                  {{ getOriginalFileName(doc) }}
                </p>
              </div>
            </div>
            <div class="flex items-center space-x-2 flex-shrink-0">
              <Badge :variant="getStatusVariant(doc.processingStatus)" class="text-xs">
                {{ $t(getStatusKey(doc.processingStatus)) }}
              </Badge>
              <span class="text-sm text-muted-foreground">{{ formatFileSize(doc.fileSize) }}</span>
              <Button
                variant="ghost"
                size="icon"
                class="text-destructive hover:text-destructive"
                @click.stop="$emit('delete', doc.id)"
              >
                <Trash2 class="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { FileText, FileType, Trash2 } from 'lucide-vue-next'
import type { Component } from 'vue'
import type { Document } from '@/types/document'

const props = defineProps<{
  documents: Document[];
  loading?: boolean;
  limit?: number;
}>()

defineEmits<{
  select: [id: string];
  delete: [id: string];
}>()

const displayDocuments = computed(() => {
  if (props.limit) {
    return props.documents.slice(0, props.limit)
  }
  return props.documents
})

function getFileIcon (fileType: string): Component {
  const icons: Record<string, Component> = {
    pdf: FileText,
    docx: FileType,
    markdown: FileText
  }
  return icons[fileType] || FileText
}

function formatFileSize (bytes: number) {
  if (bytes < 1024) { return bytes + ' B' }
  if (bytes < 1024 * 1024) { return (bytes / 1024).toFixed(1) + ' KB' }
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

function getOriginalFileName (doc: Document) {
  if (doc.metadata?.originalFileName) {
    return doc.metadata.originalFileName
  }
  return doc.filePath.split('/').pop() || doc.title
}

function getStatusVariant (status?: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case 'completed': return 'default'
    case 'processing':
    case 'pending':
    case 'retrying': return 'secondary'
    case 'failed': return 'destructive'
    default: return 'outline'
  }
}

function getStatusKey (status?: string): string {
  switch (status) {
    case 'completed': return 'documents.status.indexed'
    case 'processing': return 'documents.status.processing'
    case 'pending': return 'documents.status.pending'
    case 'retrying': return 'documents.status.retrying'
    case 'failed': return 'documents.status.failed'
    default: return 'documents.status.pending'
  }
}
</script>
