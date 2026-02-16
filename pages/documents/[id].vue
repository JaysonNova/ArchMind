<template>
  <div class="container mx-auto px-4 py-8">
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div class="flex items-center gap-4">
        <Button variant="ghost" @click="router.back()">
          <ArrowLeft class="w-4 h-4 mr-2" />
          {{ $t('common.back') }}
        </Button>
        <div>
          <h1 class="text-3xl font-bold">{{ document?.title }}</h1>
          <div class="flex items-center gap-2 mt-1">
            <Badge variant="outline">{{ document?.fileType }}</Badge>
            <span class="text-muted-foreground">{{ formatSize(document?.fileSize) }}</span>
          </div>
        </div>
      </div>
      <div class="flex items-center gap-2">
        <Button variant="outline" @click="handleDownload">
          <Download class="w-4 h-4 mr-2" />
          {{ $t('documents.details.actions.download') }}
        </Button>
        <Button variant="outline" @click="handleReindex">
          <RefreshCw class="w-4 h-4 mr-2" />
          {{ $t('documents.details.actions.reindex') }}
        </Button>
        <Button variant="destructive" @click="handleDelete">
          <Trash2 class="w-4 h-4 mr-2" />
          {{ $t('documents.details.actions.delete') }}
        </Button>
      </div>
    </div>

    <!-- Tabs -->
    <Tabs v-model="activeTab" class="w-full">
      <TabsList>
        <TabsTrigger value="content">{{ $t('documents.details.content') }}</TabsTrigger>
        <TabsTrigger value="chunks">{{ $t('documents.details.chunks') }}</TabsTrigger>
        <TabsTrigger value="usage">{{ $t('documents.details.usage') }}</TabsTrigger>
      </TabsList>

      <TabsContent value="content" class="mt-6">
        <Card>
          <CardContent class="p-6">
            <ScrollArea class="h-[600px]">
              <pre class="whitespace-pre-wrap font-mono text-sm">{{ document?.content || $t('documents.details.noContent') }}</pre>
            </ScrollArea>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="chunks" class="mt-6">
        <div class="space-y-4">
          <Card v-for="(chunk, index) in chunks" :key="chunk.id">
            <CardHeader>
              <CardTitle class="text-base flex items-center justify-between">
                <span>{{ $t('documents.details.chunkNumber', { number: index + 1 }) }}</span>
                <Badge variant="outline">{{ $t('documents.details.chunkIndex') }}: {{ chunk.chunkIndex }}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p class="text-sm whitespace-pre-wrap">{{ chunk.content }}</p>
            </CardContent>
          </Card>
          <p v-if="chunks.length === 0" class="text-center text-muted-foreground py-8">
            {{ $t('documents.details.noChunks') }}
          </p>
        </div>
      </TabsContent>

      <TabsContent value="usage" class="mt-6">
        <div class="space-y-4">
          <Card v-for="prd in usedInPRDs" :key="prd.id">
            <CardHeader>
              <CardTitle class="flex items-center justify-between text-base">
                <span>{{ prd.title }}</span>
                <Badge v-if="prd.relevanceScore">
                  {{ Math.round((prd.relevanceScore || 0) * 100) }}%
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div class="flex items-center justify-between">
                <p class="text-sm text-muted-foreground">
                  {{ formatDate(prd.createdAt) }}
                </p>
                <Button variant="outline" @click="viewPRD(prd.id)">
                  {{ $t('common.view') }}
                </Button>
              </div>
            </CardContent>
          </Card>
          <p v-if="usedInPRDs.length === 0" class="text-center text-muted-foreground py-8">
            {{ $t('documents.details.notUsed') }}
          </p>
        </div>
      </TabsContent>
    </Tabs>

    <!-- Delete Confirmation Dialog -->
    <Dialog v-model:open="deleteDialogOpen">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{{ $t('documents.deleteDialog.title') }}</DialogTitle>
          <DialogDescription>
            {{ $t('documents.deleteDialog.description', { name: document?.title }) }}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" @click="deleteDialogOpen = false">
            {{ $t('documents.deleteDialog.cancel') }}
          </Button>
          <Button variant="destructive" @click="confirmDelete">
            {{ $t('documents.deleteDialog.confirm') }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- Reindex Confirmation Dialog -->
    <Dialog v-model:open="reindexDialogOpen">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{{ $t('documents.reindexDialog.title') }}</DialogTitle>
          <DialogDescription>
            {{ $t('documents.reindexDialog.description') }}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" @click="reindexDialogOpen = false">
            {{ $t('documents.reindexDialog.cancel') }}
          </Button>
          <Button @click="confirmReindex">
            {{ $t('documents.reindexDialog.confirm') }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ArrowLeft, Download, RefreshCw, Trash2 } from 'lucide-vue-next'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Badge } from '~/components/ui/badge'
import { ScrollArea } from '~/components/ui/scroll-area'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '~/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '~/components/ui/dialog'
import { useToast } from '~/components/ui/toast/use-toast'

definePageMeta({
  layout: 'dashboard',
  middleware: ['auth']
})

const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const { toast } = useToast()

const documentId = route.params.id as string
const document = ref<any>(null)
const chunks = ref<any[]>([])
const usedInPRDs = ref<any[]>([])
const activeTab = ref('content')
const deleteDialogOpen = ref(false)
const reindexDialogOpen = ref(false)

onMounted(async () => {
  try {
    const docResponse = await $fetch<{ data: any }>(`/api/documents/${documentId}`)
    document.value = docResponse.data

    const chunksResponse = await $fetch<{ data: any[] }>(`/api/documents/${documentId}/chunks`)
    chunks.value = chunksResponse.data

    const usageResponse = await $fetch<{ data: any[] }>(`/api/documents/${documentId}/usage`)
    usedInPRDs.value = usageResponse.data
  } catch (error) {
    console.error('Failed to load document:', error)
    toast({
      title: t('documents.loadFailed'),
      variant: 'destructive',
    })
  }
})

function formatSize (bytes: number | undefined) {
  if (!bytes) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}

function formatDate (date: string | undefined) {
  if (!date) return ''
  return new Date(date).toLocaleDateString('zh-CN')
}

function viewPRD (prdId: string) {
  router.push(`/projects/${prdId}`)
}

async function handleDownload () {
  if (!document.value?.filePath) return

  // 下载原始文件
  const link = window.document.createElement('a')
  link.href = document.value.filePath
  link.download = document.value.title
  link.click()
}

async function handleReindex() {
  reindexDialogOpen.value = true
}

async function confirmReindex() {
  try {
    await $fetch(`/api/documents/${documentId}/reindex`, { method: 'POST' })

    // 重新加载分块数据
    const chunksResponse = await $fetch<{ data: any[] }>(`/api/documents/${documentId}/chunks`)
    chunks.value = chunksResponse.data

    reindexDialogOpen.value = false
    toast({
      title: t('documents.reindexSuccess'),
      variant: 'success',
    })
  } catch (error) {
    console.error('Failed to reindex:', error)
    toast({
      title: t('documents.reindexFailed'),
      variant: 'destructive',
    })
  }
}

function handleDelete() {
  deleteDialogOpen.value = true
}

async function confirmDelete() {
  try {
    await $fetch(`/api/documents/${documentId}`, { method: 'DELETE' })
    toast({
      title: t('documents.deleteSuccess'),
      variant: 'success',
    })
    router.push('/knowledge-base')
  } catch (error) {
    console.error('Failed to delete document:', error)
    toast({
      title: t('documents.deleteFailed'),
      variant: 'destructive',
    })
  }
}
</script>
