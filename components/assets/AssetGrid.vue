<script setup lang="ts">
import { Trash2, Eye } from 'lucide-vue-next'
import { Button } from '~/components/ui/button'
import { Badge } from '~/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '~/components/ui/dialog'
import { useAssets } from '~/composables/useAssets'
import { useToast } from '~/components/ui/toast/use-toast'
import type { PrdAsset } from '@/types/asset'

const props = defineProps<{
  assets: readonly PrdAsset[]
  viewMode: 'grid' | 'list'
}>()

const { deleteAsset } = useAssets()
const { t } = useI18n()
const { toast } = useToast()
const selectedAsset = ref<PrdAsset | null>(null)
const previewDialogOpen = ref(false)
const deleteDialogOpen = ref(false)
const assetToDelete = ref<string | null>(null)

function formatFileSize (bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

function handleDelete (assetId: string) {
  assetToDelete.value = assetId
  deleteDialogOpen.value = true
}

async function confirmDelete () {
  if (!assetToDelete.value) return

  try {
    await deleteAsset(assetToDelete.value)
    toast({
      title: t('assets.deleteSuccess')
    })
  } catch (error) {
    console.error('Failed to delete asset:', error)
    toast({
      title: t('assets.deleteFailed'),
      variant: 'destructive'
    })
  } finally {
    deleteDialogOpen.value = false
    assetToDelete.value = null
  }
}

function handlePreview (asset: PrdAsset) {
  selectedAsset.value = asset
  previewDialogOpen.value = true
}

function closePreview () {
  previewDialogOpen.value = false
  selectedAsset.value = null
}
</script>

<template>
  <!-- Grid View -->
  <div v-if="viewMode === 'grid'" class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
    <div
      v-for="prdAsset in assets"
      :key="prdAsset.id"
      class="group relative rounded-lg border overflow-hidden hover:shadow-md transition-shadow"
    >
      <div class="aspect-square bg-muted relative">
        <img
          v-if="prdAsset.asset?.previewUrl"
          :src="prdAsset.asset.previewUrl"
          :alt="prdAsset.asset.title"
          class="w-full h-full object-cover"
        />

        <!-- Overlay on hover -->
        <div class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
          <Button size="icon" variant="ghost" class="text-white hover:text-white hover:bg-white/20" @click="handlePreview(prdAsset)">
            <Eye class="w-4 h-4" />
          </Button>
          <Button size="icon" variant="ghost" class="text-white hover:text-white hover:bg-white/20" @click="handleDelete(prdAsset.assetId)">
            <Trash2 class="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div class="p-3">
        <div class="flex items-start justify-between gap-2 mb-1">
          <p class="text-sm font-medium truncate flex-1">{{ prdAsset.asset?.title }}</p>
          <Badge v-if="prdAsset.asset?.source === 'ai-generated'" variant="secondary" class="text-xs">
            AI
          </Badge>
        </div>
        <p class="text-xs text-muted-foreground">
          {{ formatFileSize(prdAsset.asset?.fileSize || 0) }}
        </p>
      </div>
    </div>
  </div>

  <!-- List View -->
  <div v-else class="space-y-2">
    <div
      v-for="prdAsset in assets"
      :key="prdAsset.id"
      class="flex items-center gap-4 p-3 rounded-lg border hover:bg-accent/50 transition-colors"
    >
      <div class="w-16 h-16 bg-muted rounded overflow-hidden flex-shrink-0">
        <img
          v-if="prdAsset.asset?.previewUrl"
          :src="prdAsset.asset.previewUrl"
          :alt="prdAsset.asset.title"
          class="w-full h-full object-cover"
        />
      </div>

      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-2 mb-1">
          <p class="font-medium truncate">{{ prdAsset.asset?.title }}</p>
          <Badge v-if="prdAsset.asset?.source === 'ai-generated'" variant="secondary" class="text-xs">
            AI
          </Badge>
        </div>
        <p class="text-sm text-muted-foreground">
          {{ formatFileSize(prdAsset.asset?.fileSize || 0) }} • {{ prdAsset.asset?.fileName }}
        </p>
      </div>

      <div class="flex items-center gap-1">
        <Button size="icon" variant="ghost" @click="handlePreview(prdAsset)">
          <Eye class="w-4 h-4" />
        </Button>
        <Button size="icon" variant="ghost" @click="handleDelete(prdAsset.assetId)">
          <Trash2 class="w-4 h-4" />
        </Button>
      </div>
    </div>
  </div>

  <!-- Delete Confirmation Dialog -->
  <Dialog v-model:open="deleteDialogOpen">
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{{ t('assets.deleteConfirm') }}</DialogTitle>
        <DialogDescription>
          {{ t('assets.deleteConfirmDescription') }}
        </DialogDescription>
      </DialogHeader>
      <DialogFooter>
        <Button variant="outline" @click="deleteDialogOpen = false">
          {{ t('common.cancel') }}
        </Button>
        <Button variant="destructive" @click="confirmDelete">
          {{ t('common.delete') }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>

  <!-- Preview Dialog -->
  <Dialog v-model:open="previewDialogOpen" @update:open="(val: boolean) => !val && closePreview()">
    <DialogContent class="max-w-3xl">
      <DialogHeader>
        <DialogTitle>{{ selectedAsset?.asset?.title }}</DialogTitle>
      </DialogHeader>
      <div v-if="selectedAsset?.asset?.previewUrl" class="flex items-center justify-center">
        <img
          :src="selectedAsset.asset.previewUrl"
          :alt="selectedAsset.asset.title"
          class="max-w-full max-h-[60vh] object-contain"
        />
      </div>
    </DialogContent>
  </Dialog>
</template>
