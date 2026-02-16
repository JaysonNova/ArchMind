<template>
  <DropdownMenu>
    <DropdownMenuTrigger as-child>
      <Button variant="outline" class="gap-2 min-w-[200px] justify-between">
        <div class="flex items-center gap-2">
          <span class="text-lg">{{ currentWorkspace?.icon || '📁' }}</span>
          <span class="font-medium">{{ currentWorkspace?.name || t('workspace.select') }}</span>
        </div>
        <ChevronsUpDown class="w-4 h-4 text-muted-foreground" />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="start" class="w-[280px]">
      <DropdownMenuLabel>{{ t('workspace.switchWorkspace') }}</DropdownMenuLabel>
      <DropdownMenuSeparator />

      <!-- 工作区列表 -->
      <DropdownMenuRadioGroup :model-value="currentWorkspaceId">
        <DropdownMenuRadioItem
          v-for="workspace in workspaces"
          :key="workspace.id"
          :value="workspace.id"
          @click="handleSwitch(workspace.id)"
          class="gap-2 cursor-pointer"
        >
          <div class="flex items-center gap-2 flex-1">
            <span class="text-base">{{ workspace.icon }}</span>
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2">
                <span class="font-medium truncate">{{ workspace.name }}</span>
                <Badge v-if="workspace.isDefault" variant="secondary" class="text-xs">
                  {{ t('workspace.default') }}
                </Badge>
              </div>
              <p v-if="workspace.stats" class="text-xs text-muted-foreground">
                {{ workspace.stats.prdCount }} {{ t('workspace.projects') }} ·
                {{ workspace.stats.documentCount }} {{ t('workspace.documents') }}
              </p>
            </div>
          </div>
        </DropdownMenuRadioItem>
      </DropdownMenuRadioGroup>

      <DropdownMenuSeparator />

      <!-- 管理工作区 -->
      <DropdownMenuItem @click="showManageDialog = true" class="gap-2 cursor-pointer">
        <Settings class="w-4 h-4" />
        <span>{{ t('workspace.manage') }}</span>
      </DropdownMenuItem>

      <DropdownMenuItem @click="showCreateDialog = true" class="gap-2 cursor-pointer">
        <Plus class="w-4 h-4" />
        <span>{{ t('workspace.create') }}</span>
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>

  <!-- 创建工作区对话框 -->
  <Dialog v-model:open="showCreateDialog">
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>{{ t('workspace.createTitle') }}</DialogTitle>
        <DialogDescription>{{ t('workspace.createDescription') }}</DialogDescription>
      </DialogHeader>

      <div class="space-y-4 py-4">
        <div class="space-y-2">
          <Label for="name">{{ t('workspace.name') }}</Label>
          <Input
            id="name"
            v-model="newWorkspace.name"
            :placeholder="t('workspace.namePlaceholder')"
          />
        </div>

        <div class="space-y-2">
          <Label for="description">{{ t('workspace.description') }} {{ t('common.optional') }}</Label>
          <Textarea
            id="description"
            v-model="newWorkspace.description"
            :placeholder="t('workspace.descriptionPlaceholder')"
            rows="3"
          />
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div class="space-y-2">
            <Label for="icon">{{ t('workspace.icon') }}</Label>
            <Input
              id="icon"
              v-model="newWorkspace.icon"
              placeholder="📁"
              maxlength="2"
            />
          </div>

          <div class="space-y-2">
            <Label for="color">{{ t('workspace.color') }}</Label>
            <Input
              id="color"
              v-model="newWorkspace.color"
              type="color"
            />
          </div>
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" @click="showCreateDialog = false">
          {{ t('common.cancel') }}
        </Button>
        <Button @click="handleCreate" :disabled="!newWorkspace.name.trim() || creating">
          <Loader2 v-if="creating" class="w-4 h-4 mr-2 animate-spin" />
          {{ t('common.create') }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>

  <!-- 管理工作区对话框 -->
  <Dialog v-model:open="showManageDialog">
    <DialogContent class="sm:max-w-2xl">
      <DialogHeader>
        <DialogTitle>{{ t('workspace.manageTitle') }}</DialogTitle>
        <DialogDescription>{{ t('workspace.manageDescription') }}</DialogDescription>
      </DialogHeader>

      <div class="space-y-3 py-4 max-h-[400px] overflow-y-auto">
        <Card
          v-for="workspace in workspaces"
          :key="workspace.id"
          class="p-4"
        >
          <div class="flex items-start justify-between gap-4">
            <div class="flex items-start gap-3 flex-1">
              <span class="text-2xl">{{ workspace.icon }}</span>
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 mb-1">
                  <h4 class="font-semibold">{{ workspace.name }}</h4>
                  <Badge v-if="workspace.isDefault" variant="secondary" class="text-xs">
                    {{ t('workspace.default') }}
                  </Badge>
                </div>
                <p v-if="workspace.description" class="text-sm text-muted-foreground mb-2">
                  {{ workspace.description }}
                </p>
                <p v-if="workspace.stats" class="text-xs text-muted-foreground">
                  {{ workspace.stats.prdCount }} {{ t('workspace.projects') }} ·
                  {{ workspace.stats.documentCount }} {{ t('workspace.documents') }}
                </p>
              </div>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger as-child>
                <Button variant="ghost" size="sm">
                  <MoreVertical class="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  v-if="!workspace.isDefault"
                  @click="handleSetDefault(workspace.id)"
                  class="cursor-pointer"
                >
                  <Star class="w-4 h-4 mr-2" />
                  {{ t('workspace.setAsDefault') }}
                </DropdownMenuItem>
                <DropdownMenuItem
                  v-if="!workspace.isDefault"
                  @click="handleDelete(workspace.id)"
                  class="cursor-pointer text-destructive focus:text-destructive"
                >
                  <Trash2 class="w-4 h-4 mr-2" />
                  {{ t('common.delete') }}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </Card>
      </div>

      <DialogFooter>
        <Button @click="showManageDialog = false">
          {{ t('common.close') }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>

  <!-- Delete Confirmation Dialog -->
  <Dialog v-model:open="deleteDialogOpen">
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{{ t('workspace.deleteConfirm') }}</DialogTitle>
        <DialogDescription>
          {{ t('workspace.deleteConfirmDescription') }}
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
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ChevronsUpDown, Plus, Settings, MoreVertical, Star, Trash2, Loader2 } from 'lucide-vue-next'
import { useWorkspace } from '~/composables/useWorkspace'
import { useToast } from '~/components/ui/toast/use-toast'
import { Button } from '~/components/ui/button'
import { Badge } from '~/components/ui/badge'
import { Card } from '~/components/ui/card'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Textarea } from '~/components/ui/textarea'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '~/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '~/components/ui/dialog'

const { t } = useI18n()
const { toast } = useToast()

const {
  workspaces,
  currentWorkspace,
  currentWorkspaceId,
  loadWorkspaces,
  switchWorkspace,
  createWorkspace,
  deleteWorkspace,
  setDefaultWorkspace
} = useWorkspace()

const showCreateDialog = ref(false)
const showManageDialog = ref(false)
const creating = ref(false)
const deleteDialogOpen = ref(false)
const workspaceToDelete = ref<string | null>(null)

const newWorkspace = ref({
  name: '',
  description: '',
  icon: '📁',
  color: '#3B82F6'
})

onMounted(async () => {
  try {
    await loadWorkspaces()
  } catch (error) {
    console.error('Failed to load workspaces:', error)
    toast({
      title: t('workspace.loadError'),
      description: error instanceof Error ? error.message : undefined,
      variant: 'destructive'
    })
  }
})

async function handleSwitch (workspaceId: string) {
  try {
    await switchWorkspace(workspaceId)
    toast({
      title: t('workspace.switchSuccess'),
      description: t('workspace.switchSuccessDescription')
    })
  } catch (error) {
    console.error('Failed to switch workspace:', error)
    toast({
      title: t('workspace.switchError'),
      description: error instanceof Error ? error.message : undefined,
      variant: 'destructive'
    })
  }
}

async function handleCreate () {
  if (!newWorkspace.value.name.trim()) return

  creating.value = true
  try {
    await createWorkspace({
      name: newWorkspace.value.name.trim(),
      description: newWorkspace.value.description.trim() || undefined,
      icon: newWorkspace.value.icon || '📁',
      color: newWorkspace.value.color || '#3B82F6'
    })

    toast({
      title: t('workspace.createSuccess'),
      description: t('workspace.createSuccessDescription')
    })

    // 重置表单
    newWorkspace.value = {
      name: '',
      description: '',
      icon: '📁',
      color: '#3B82F6'
    }

    showCreateDialog.value = false
  } catch (error) {
    console.error('Failed to create workspace:', error)
    toast({
      title: t('workspace.createError'),
      description: error instanceof Error ? error.message : undefined,
      variant: 'destructive'
    })
  } finally {
    creating.value = false
  }
}

async function handleSetDefault (workspaceId: string) {
  try {
    await setDefaultWorkspace(workspaceId)
    toast({
      title: t('workspace.setDefaultSuccess'),
      description: t('workspace.setDefaultSuccessDescription')
    })
  } catch (error) {
    console.error('Failed to set default workspace:', error)
    toast({
      title: t('workspace.setDefaultError'),
      description: error instanceof Error ? error.message : undefined,
      variant: 'destructive'
    })
  }
}

function handleDelete (workspaceId: string) {
  workspaceToDelete.value = workspaceId
  deleteDialogOpen.value = true
}

async function confirmDelete () {
  if (!workspaceToDelete.value) return

  try {
    await deleteWorkspace(workspaceToDelete.value)
    toast({
      title: t('workspace.deleteSuccess'),
      description: t('workspace.deleteSuccessDescription')
    })
  } catch (error) {
    console.error('Failed to delete workspace:', error)
    toast({
      title: t('workspace.deleteError'),
      description: error instanceof Error ? error.message : undefined,
      variant: 'destructive'
    })
  } finally {
    deleteDialogOpen.value = false
    workspaceToDelete.value = null
  }
}
</script>
