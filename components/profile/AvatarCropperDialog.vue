<template>
  <Dialog :open="open" @update:open="handleOpenChange">
    <DialogContent class="sm:max-w-[600px]">
      <DialogHeader>
        <DialogTitle>{{ $t('profile.avatar.change') }}</DialogTitle>
        <DialogDescription>
          {{ $t('profile.avatar.uploadHint') }}
        </DialogDescription>
      </DialogHeader>

      <div class="space-y-4">
        <!-- Upload Area -->
        <div
          v-if="!imageSrc"
          class="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center hover:border-primary/50 transition-colors cursor-pointer"
          @click="triggerFileInput"
          @dragover.prevent
          @drop.prevent="handleDrop"
        >
          <Upload class="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
          <p class="text-sm text-muted-foreground mb-2">
            {{ $t('documents.upload.dragDrop') }}
          </p>
          <Button variant="outline" size="sm">
            {{ $t('common.upload') }}
          </Button>
          <input
            ref="fileInput"
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            class="hidden"
            @change="handleFileSelect"
          />
        </div>

        <!-- Cropper Area -->
        <div v-else class="space-y-3">
          <div class="cropper-container">
            <Cropper
              ref="cropperRef"
              class="cropper"
              :src="imageSrc"
              :stencil-component="CircleStencil"
              :stencil-props="{
                handlers: {},
                movable: true,
                resizable: true,
                lines: {}
              }"
              :resize-image="{
                touch: true,
                wheel: true,
                adjustStencil: false
              }"
              :transitions="true"
            />
          </div>

          <div class="flex gap-2 justify-center">
            <Button variant="outline" size="icon" class="h-8 w-8" @click="rotateLeft" :title="$t('profile.avatar.rotateLeft')">
              <RotateCcw class="w-4 h-4" />
            </Button>
            <Button variant="outline" size="icon" class="h-8 w-8" @click="rotateRight" :title="$t('profile.avatar.rotateRight')">
              <RotateCw class="w-4 h-4" />
            </Button>
            <Button variant="outline" size="icon" class="h-8 w-8" @click="flipHorizontal" :title="$t('profile.avatar.flipH')">
              <FlipHorizontal class="w-4 h-4" />
            </Button>
            <Button variant="outline" size="icon" class="h-8 w-8" @click="flipVertical" :title="$t('profile.avatar.flipV')">
              <FlipVertical class="w-4 h-4" />
            </Button>
            <Button variant="outline" size="icon" class="h-8 w-8" @click="resetImage" :title="$t('common.reset')">
              <RefreshCw class="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      <DialogFooter class="gap-2">
        <Button variant="outline" size="sm" @click="handleCancel">
          {{ $t('common.cancel') }}
        </Button>
        <Button
          size="sm"
          @click="handleCrop"
          :disabled="!imageSrc || loading"
        >
          <Loader2 v-if="loading" class="w-4 h-4 mr-2 animate-spin" />
          {{ $t('common.confirm') }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { Upload, Loader2, RotateCcw, RotateCw, FlipHorizontal, FlipVertical, RefreshCw } from 'lucide-vue-next'
import { Cropper, CircleStencil } from 'vue-advanced-cropper'
import 'vue-advanced-cropper/dist/style.css'
import { Button } from '~/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '~/components/ui/dialog'
import { useToast } from '~/components/ui/toast/use-toast'

interface Props {
  open: boolean
  loading?: boolean
}

interface Emits {
  (e: 'update:open', value: boolean): void
  (e: 'crop', blob: Blob): void
}

const props = withDefaults(defineProps<Props>(), {
  loading: false
})

const emit = defineEmits<Emits>()
const { toast } = useToast()

function handleOpenChange(value: boolean) {
  emit('update:open', value)
}

const fileInput = ref<HTMLInputElement | null>(null)
const cropperRef = ref<InstanceType<typeof Cropper> | null>(null)
const imageSrc = ref<string | null>(null)
const imageType = ref<string>('image/jpeg')

// Watch for dialog close to reset
watch(() => props.open, (newVal) => {
  if (!newVal) {
    resetState()
  }
})

function triggerFileInput() {
  fileInput.value?.click()
}

function handleFileSelect(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) {
    loadImage(file)
  }
}

function handleDrop(event: DragEvent) {
  const file = event.dataTransfer?.files?.[0]
  if (file && file.type.startsWith('image/')) {
    loadImage(file)
  }
}

function loadImage(file: File) {
  // Validate file size (10MB)
  if (file.size > 10 * 1024 * 1024) {
    toast({
      title: '文件过大',
      description: '图片大小不能超过 10MB',
      variant: 'destructive'
    })
    return
  }

  imageType.value = file.type || 'image/jpeg'

  const reader = new FileReader()
  reader.onload = (e) => {
    imageSrc.value = e.target?.result as string
  }
  reader.readAsDataURL(file)
}

function rotateLeft() {
  cropperRef.value?.rotate(-90)
}

function rotateRight() {
  cropperRef.value?.rotate(90)
}

function flipHorizontal() {
  cropperRef.value?.flip(true, false)
}

function flipVertical() {
  cropperRef.value?.flip(false, true)
}

function resetImage() {
  cropperRef.value?.reset()
}

function handleCrop() {
  const { canvas } = cropperRef.value?.getResult() || {}

  if (canvas) {
    canvas.toBlob((blob) => {
      if (blob) {
        emit('crop', blob)
      }
    }, imageType.value, 0.9)
  }
}

function handleCancel() {
  emit('update:open', false)
}

function resetState() {
  imageSrc.value = null
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}
</script>

<style scoped>
.cropper-container {
  width: 100%;
  aspect-ratio: 1;
  max-height: 500px;
  margin: 0 auto;
  border-radius: 0.5rem;
  overflow: hidden;
  background: #1a1a1a;
}

.cropper {
  width: 100%;
  height: 100%;
  background: #1a1a1a;
}

:deep(.vue-advanced-cropper) {
  background: #1a1a1a;
}

:deep(.vue-advanced-cropper__background) {
  background: #1a1a1a;
}

:deep(.vue-advanced-cropper__foreground) {
  background: rgba(0, 0, 0, 0.6);
}

/* 隐藏圆形选区的调整手柄 */
:deep(.vue-circle-stencil__handler) {
  display: none;
}
</style>
