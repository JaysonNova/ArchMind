<script setup lang="ts">
import { CloudUpload, X } from 'lucide-vue-next'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '~/components/ui/dialog'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Textarea } from '~/components/ui/textarea'
import { useAssets } from '~/composables/useAssets'
import { useToast } from '~/components/ui/toast/use-toast'

const props = defineProps<{
  open: boolean
  prdId: string | null
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  success: []
}>()

const { uploadAsset, isUploading } = useAssets()
const { t } = useI18n()
const { toast } = useToast()

const fileInput = ref<HTMLInputElement>()
const selectedFile = ref<File | null>(null)
const previewUrl = ref<string>('')
const title = ref('')
const description = ref('')
const dragOver = ref(false)

function handleFileSelect (event: Event) {
  const target = event.target as HTMLInputElement
  if (target.files && target.files[0]) {
    selectedFile.value = target.files[0]
    if (!title.value) {
      title.value = target.files[0].name.replace(/\.[^/.]+$/, '')
    }
    // 创建预览 URL
    previewUrl.value = URL.createObjectURL(target.files[0])
  }
}

function handleDrop (event: DragEvent) {
  dragOver.value = false
  if (event.dataTransfer?.files && event.dataTransfer.files[0]) {
    selectedFile.value = event.dataTransfer.files[0]
    if (!title.value) {
      title.value = event.dataTransfer.files[0].name.replace(/\.[^/.]+$/, '')
    }
    // 创建预览 URL
    previewUrl.value = URL.createObjectURL(event.dataTransfer.files[0])
  }
}

function removeFile () {
  selectedFile.value = null
  title.value = ''
  description.value = ''
  // 清理预览 URL
  if (previewUrl.value) {
    URL.revokeObjectURL(previewUrl.value)
    previewUrl.value = ''
  }
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

async function handleUpload () {
  if (!selectedFile.value) return

  try {
    await uploadAsset(selectedFile.value, {
      prdId: props.prdId || undefined,
      title: title.value,
      description: description.value
    })

    emit('success')
    emit('update:open', false)

    // Reset
    removeFile()
  } catch (err) {
    console.error('Upload failed:', err)
    toast({
      title: t('assets.uploadFailed'),
      description: err instanceof Error ? err.message : undefined,
      variant: 'destructive'
    })
  }
}

function handleClose () {
  emit('update:open', false)
  removeFile()
}

// 组件卸载时清理预览 URL
onUnmounted(() => {
  if (previewUrl.value) {
    URL.revokeObjectURL(previewUrl.value)
  }
})
</script>

<template>
  <Dialog :open="open" @update:open="handleClose">
    <DialogContent class="sm:max-w-[500px]">
      <DialogHeader>
        <DialogTitle>{{ $t('assets.uploadAsset') }}</DialogTitle>
        <DialogDescription>{{ $t('assets.uploadHint') }}</DialogDescription>
      </DialogHeader>

      <div class="space-y-4">
        <!-- Drag & Drop Area -->
        <div
          class="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors"
          :class="{
            'border-primary bg-primary/5': dragOver,
            'border-border hover:border-primary': !dragOver
          }"
          @dragover.prevent="dragOver = true"
          @dragleave.prevent="dragOver = false"
          @drop.prevent="handleDrop"
          @click="fileInput?.click()"
        >
          <input
            ref="fileInput"
            type="file"
            accept="image/png,image/jpeg,image/gif,image/svg+xml,image/webp"
            class="hidden"
            @change="handleFileSelect"
          >

          <div v-if="!selectedFile">
            <CloudUpload class="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p class="text-foreground mb-2">{{ $t('assets.dragDrop') }}</p>
            <p class="text-sm text-muted-foreground">{{ $t('assets.supportedFormats') }}</p>
          </div>

          <div v-else class="bg-accent/50 rounded p-3">
            <div class="flex items-center gap-3">
              <div class="w-16 h-16 bg-muted rounded flex-shrink-0 overflow-hidden">
                <img
                  v-if="previewUrl"
                  :src="previewUrl"
                  :alt="selectedFile.name"
                  class="w-full h-full object-cover"
                />
              </div>
              <div class="min-w-0 flex-1">
                <p class="font-medium text-sm break-all line-clamp-2">{{ selectedFile.name }}</p>
                <p class="text-sm text-muted-foreground mt-1">
                  {{ (selectedFile.size / 1024 / 1024).toFixed(2) }} MB
                </p>
              </div>
              <Button size="icon" variant="ghost" class="flex-shrink-0" @click.stop="removeFile">
                <X class="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        <!-- Title -->
        <div class="space-y-2">
          <Label for="title">{{ $t('assets.title') }}</Label>
          <Input
            id="title"
            v-model="title"
            :placeholder="$t('assets.titlePlaceholder')"
          />
        </div>

        <!-- Description -->
        <div class="space-y-2">
          <Label for="description">{{ $t('assets.description') }} ({{ $t('common.optional') }})</Label>
          <Textarea
            id="description"
            v-model="description"
            :placeholder="$t('assets.descriptionPlaceholder')"
            rows="3"
          />
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" @click="handleClose">
          {{ $t('common.cancel') }}
        </Button>
        <Button
          :disabled="!selectedFile || isUploading"
          @click="handleUpload"
        >
          <CloudUpload v-if="!isUploading" class="w-4 h-4 mr-2" />
          <div v-else class="w-4 h-4 mr-2 animate-spin border-2 border-white border-t-transparent rounded-full" />
          {{ isUploading ? $t('assets.uploading') : $t('common.upload') }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
