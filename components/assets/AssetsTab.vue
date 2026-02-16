<script setup lang="ts">
import { Upload, Sparkles, AlertCircle } from 'lucide-vue-next'
import { Button } from '~/components/ui/button'
import { Alert, AlertTitle, AlertDescription } from '~/components/ui/alert'
import { useAssets } from '~/composables/useAssets'
import { useToast } from '~/components/ui/toast/use-toast'
import AssetsToolbar from './AssetsToolbar.vue'
import AssetGrid from './AssetGrid.vue'
import AssetUploadDialog from './AssetUploadDialog.vue'

const props = defineProps<{
  prdContent: string
  prdId: string | null
  availableModels: any[]
  selectedModelId: string
}>()

const { t } = useI18n()
const { toast } = useToast()

const {
  prdAssets,
  isLoading,
  error,
  viewMode,
  hasPrdAssets,
  fetchPrdAssets,
  setViewMode,
  loadFromStorage
} = useAssets()

const showUploadDialog = ref(false)
const showGenerateDialog = ref(false)

// 初始化
onMounted(() => {
  loadFromStorage()
  if (props.prdId) {
    fetchPrdAssets(props.prdId)
  }
})

// 监听 prdId 变化
watch(() => props.prdId, (newPrdId) => {
  if (newPrdId) {
    fetchPrdAssets(newPrdId)
  }
})

function handleUpload () {
  showUploadDialog.value = true
}

function handleGenerate () {
  if (!props.prdContent) {
    toast({
      title: t('assets.noPrdContent'),
      variant: 'destructive'
    })
    return
  }
  showGenerateDialog.value = true
}

function handleUploadSuccess () {
  toast({
    title: t('assets.uploadSuccess'),
    variant: 'success'
  })
}
</script>

<template>
  <div class="flex flex-col h-full">
    <!-- Toolbar -->
    <AssetsToolbar
      :view-mode="viewMode"
      @upload="handleUpload"
      @generate="handleGenerate"
      @toggle-view="setViewMode"
    />

    <!-- Loading -->
    <div v-if="isLoading" class="flex-1 flex items-center justify-center">
      <div class="text-center">
        <div class="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
        <p class="text-sm text-muted-foreground">{{ $t('common.loading') }}</p>
      </div>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="flex-1 flex items-center justify-center p-6">
      <Alert variant="destructive">
        <AlertCircle class="h-4 w-4" />
        <AlertTitle>{{ $t('common.error') }}</AlertTitle>
        <AlertDescription>{{ error }}</AlertDescription>
      </Alert>
    </div>

    <!-- Content -->
    <div v-else-if="hasPrdAssets" class="flex-1 overflow-auto p-6">
      <AssetGrid :assets="prdAssets" :view-mode="viewMode" />
    </div>

    <!-- Empty State -->
    <div v-else class="flex-1 flex items-center justify-center p-6">
      <div class="text-center max-w-md">
        <Upload class="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
        <h3 class="text-lg font-semibold mb-2">{{ $t('assets.emptyTitle') }}</h3>
        <p class="text-sm text-muted-foreground mb-6">{{ $t('assets.emptyHint') }}</p>
        <div class="flex gap-3 justify-center">
          <Button @click="handleUpload">
            <Upload class="w-4 h-4 mr-2" />
            {{ $t('assets.uploadAsset') }}
          </Button>
          <Button variant="outline" @click="handleGenerate">
            <Sparkles class="w-4 h-4 mr-2" />
            {{ $t('assets.generateWithAI') }}
          </Button>
        </div>
      </div>
    </div>

    <!-- Upload Dialog -->
    <AssetUploadDialog
      v-model:open="showUploadDialog"
      :prd-id="prdId"
      @success="handleUploadSuccess"
    />
  </div>
</template>
