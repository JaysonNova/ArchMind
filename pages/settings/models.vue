<template>
  <div class="min-h-screen bg-background">
    <div class="max-w-4xl mx-auto px-6 py-8">
      <!-- Header with back link -->
      <div class="mb-8">
        <NuxtLink
          to="/settings/profile"
          class="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ChevronLeft class="w-4 h-4 mr-1" />
          {{ $t('common.back') }}
        </NuxtLink>
        <h1 class="text-2xl font-bold">{{ $t('profile.tabs.models') }}</h1>
        <p class="text-muted-foreground mt-1">配置第三方 AI 模型的 API Key，用于对话和内容生成</p>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="flex items-center justify-center py-12">
        <Loader2 class="w-8 h-8 animate-spin text-muted-foreground" />
      </div>

      <!-- Content -->
      <div v-else class="space-y-6">
        <!-- Configured Providers -->
        <Card v-if="configuredProviders.length > 0">
          <CardHeader>
            <CardTitle class="text-lg">已配置的模型</CardTitle>
            <CardDescription>以下是您已配置的 AI 模型提供商</CardDescription>
          </CardHeader>
          <CardContent>
            <div class="space-y-4">
              <div
                v-for="provider in configuredProviders"
                :key="provider.id"
                class="flex items-center justify-between p-4 rounded-lg border bg-card"
              >
                <div class="flex items-center gap-4">
                  <div class="flex flex-col">
                    <span class="font-medium">{{ provider.name }}</span>
                    <span class="text-sm text-muted-foreground">{{ provider.description }}</span>
                  </div>
                </div>
                <div class="flex items-center gap-2">
                  <Switch
                    :checked="isEnabled(provider.id)"
                    @update:checked="handleToggle(provider.id, $event)"
                  />
                  <Button variant="ghost" size="sm" @click="openEditDialog(provider)">
                    <Settings class="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    class="text-destructive hover:text-destructive"
                    @click="handleDelete(provider.id)"
                  >
                    <Trash2 class="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <!-- Available Providers -->
        <Card>
          <CardHeader>
            <CardTitle class="text-lg">添加新的模型</CardTitle>
            <CardDescription>选择一个 AI 模型提供商进行配置</CardDescription>
          </CardHeader>
          <CardContent>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                v-for="provider in unconfiguredProviders"
                :key="provider.id"
                class="flex items-start gap-4 p-4 rounded-lg border bg-card hover:bg-accent transition-colors text-left"
                @click="openConfigDialog(provider)"
              >
                <div class="flex-1">
                  <div class="flex items-center gap-2">
                    <span class="font-medium">{{ provider.name }}</span>
                    <Badge v-if="provider.authType === 'base_url'" variant="secondary">本地</Badge>
                  </div>
                  <p class="text-sm text-muted-foreground mt-1 line-clamp-2">{{ provider.description }}</p>
                  <div class="flex items-center gap-2 mt-2">
                    <ExternalLink class="w-3 h-3 text-muted-foreground" />
                    <span class="text-xs text-muted-foreground">{{ provider.website }}</span>
                  </div>
                </div>
                <Plus class="w-5 h-5 text-muted-foreground" />
              </button>
            </div>
          </CardContent>
        </Card>

        <!-- Help Section -->
        <Card>
          <CardHeader>
            <CardTitle class="text-lg flex items-center gap-2">
              <HelpCircle class="w-5 h-5" />
              帮助说明
            </CardTitle>
          </CardHeader>
          <CardContent class="space-y-4 text-sm text-muted-foreground">
            <p>
              <strong>API Key 安全：</strong>您的 API Key 会使用 AES-256 加密后存储在本地数据库中，不会传输到任何第三方服务。
            </p>
            <p>
              <strong>第三方中转站：</strong>如果您使用的是第三方 API 中转站（如 OpenRouter、各种代理服务），点击"使用中转站"按钮，输入中转站提供的 API 地址即可。
            </p>
            <p>
              <strong>使用方式：</strong>配置完成后，您可以在对话和 PRD 生成时选择使用已启用的模型。
            </p>
            <p>
              <strong>Ollama 本地模型：</strong>如果您安装了 Ollama，可以配置本地地址 (默认 http://localhost:11434) 使用完全离线的本地模型。
            </p>
          </CardContent>
        </Card>
      </div>
    </div>

    <!-- Config Dialog -->
    <Dialog v-model:open="dialogOpen">
      <DialogContent class="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{{ editingProvider?.name }}</DialogTitle>
          <DialogDescription>{{ editingProvider?.description }}</DialogDescription>
        </DialogHeader>

        <form @submit.prevent="handleSave" class="space-y-4" autocomplete="off">
          <!-- API Key Field -->
          <div v-if="needsApiKey" class="space-y-2">
            <Label for="apiKey">API Key</Label>
            <div class="relative">
              <Input
                id="apiKey"
                ref="apiKeyInput"
                v-model="form.apiKey"
                type="text"
                :placeholder="editingProvider?.apiKeyPlaceholder"
                autocomplete="off"
                autocorrect="off"
                autocapitalize="off"
                spellcheck="false"
                data-lpignore="true"
                data-form-type="other"
                data-1p-ignore
                :style="!showApiKey ? { WebkitTextSecurity: 'disc' } : {}"
                class="pr-10"
              />
              <button
                type="button"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                @click="toggleApiKeyVisibility"
              >
                <Eye v-if="!showApiKey" class="w-4 h-4" />
                <EyeOff v-else class="w-4 h-4" />
              </button>
            </div>
            <p class="text-xs text-muted-foreground">
              获取 API Key:
              <a
                :href="editingProvider?.website"
                target="_blank"
                rel="noopener noreferrer"
                class="text-primary hover:underline"
              >
                {{ editingProvider?.website }}
              </a>
            </p>
          </div>

          <!-- Base URL Field - 显示给支持自定义 URL 的提供商 -->
          <div v-if="showBaseUrlField" class="space-y-2">
            <div class="flex items-center justify-between">
              <Label for="baseUrl">API 地址</Label>
              <Button
                v-if="!showCustomUrl && editingProvider?.supportsCustomUrl"
                type="button"
                variant="ghost"
                size="sm"
                class="h-6 text-xs"
                @click="showCustomUrl = true"
              >
                使用中转站
              </Button>
            </div>
            <Input
              id="baseUrl"
              v-model="form.baseUrl"
              :placeholder="editingProvider?.baseUrlPlaceholder || '输入 API 地址'"
              autocomplete="off"
              autocorrect="off"
              autocapitalize="off"
              spellcheck="false"
              data-lpignore="true"
              data-form-type="other"
              data-1p-ignore
            />
            <p class="text-xs text-muted-foreground">
              <template v-if="editingProvider?.supportsCustomUrl">
                使用官方 API 请留空或输入默认地址。如使用第三方中转站，请填写中转站提供的 API 地址。
              </template>
              <template v-else>
                本地模型的服务地址
              </template>
            </p>
          </div>

          <!-- Available Models -->
          <div v-if="editingProvider?.models.length" class="space-y-2">
            <Label>可用模型</Label>
            <div class="flex flex-wrap gap-2">
              <Badge
                v-for="model in editingProvider.models"
                :key="model.id"
                variant="outline"
                class="cursor-default"
              >
                {{ model.name }}
              </Badge>
            </div>
          </div>

          <DialogFooter class="gap-2">
            <Button type="button" variant="outline" @click="dialogOpen = false">
              取消
            </Button>
            <Button
              type="button"
              variant="secondary"
              :disabled="validating !== null || !canValidate"
              @click="handleValidate"
            >
              <Loader2 v-if="validating === editingProvider?.id" class="w-4 h-4 mr-2 animate-spin" />
              {{ validating ? '验证中...' : '验证连接' }}
            </Button>
            <Button type="submit" :disabled="validating !== null">
              <Loader2 v-if="saving" class="w-4 h-4 mr-2 animate-spin" />
              保存
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive } from 'vue'
import {
  Loader2,
  Settings,
  Trash2,
  Plus,
  ExternalLink,
  HelpCircle,
  Eye,
  EyeOff,
  ChevronLeft
} from 'lucide-vue-next'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'
import { Badge } from '~/components/ui/badge'
import { Switch } from '~/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '~/components/ui/dialog'
import { useToast } from '~/components/ui/toast/use-toast'
import { useApiConfigs } from '~/composables/useApiConfigs'
import type { AIProviderConfig, AIProviderType } from '~/types/settings'

definePageMeta({
  middleware: 'auth'
})

const { toast } = useToast()
const {
  providers,
  configs,
  loading,
  validating,
  isConfigured,
  isEnabled,
  saveConfig,
  validateConfig,
  deleteConfig,
  toggleEnabled,
  initialize
} = useApiConfigs()

// Dialog state
const dialogOpen = ref(false)
const editingProvider = ref<AIProviderConfig | null>(null)
const showApiKey = ref(false)  // false = 遮罩显示，true = 明文显示
const showCustomUrl = ref(false)  // 是否显示自定义 URL 输入框
const saving = ref(false)
const apiKeyInput = ref<HTMLInputElement | null>(null)

// 切换 API Key 显示/隐藏
function toggleApiKeyVisibility () {
  showApiKey.value = !showApiKey.value
}

// Form state
const form = reactive({
  apiKey: '',
  baseUrl: ''
})

// Computed
const configuredProviders = computed(() => {
  return providers.value.filter(p => isConfigured(p.id))
})

const unconfiguredProviders = computed(() => {
  return providers.value.filter(p => !isConfigured(p.id))
})

const needsApiKey = computed(() => {
  if (!editingProvider.value) return false
  const authType = editingProvider.value.authType
  return authType === 'api_key' || authType === 'both'
})

const needsBaseUrl = computed(() => {
  if (!editingProvider.value) return false
  const authType = editingProvider.value.authType
  return authType === 'base_url' || authType === 'both'
})

// 是否显示 Base URL 字段
const showBaseUrlField = computed(() => {
  if (!editingProvider.value) return false
  // Ollama 等需要 base_url 的始终显示
  if (editingProvider.value.authType === 'base_url') return true
  // 支持自定义 URL 的提供商，在用户点击"使用中转站"后显示
  if (editingProvider.value.supportsCustomUrl && showCustomUrl.value) return true
  // both 类型始终显示
  if (editingProvider.value.authType === 'both') return true
  return false
})

const canValidate = computed(() => {
  if (!editingProvider.value) return false
  if (needsApiKey.value && !form.apiKey) return false
  if (needsBaseUrl.value && !form.baseUrl) return false
  return true
})

// Methods
function openConfigDialog (provider: AIProviderConfig) {
  editingProvider.value = provider
  form.apiKey = ''
  form.baseUrl = provider.defaultBaseUrl || ''
  showApiKey.value = false  // 默认遮罩显示
  showCustomUrl.value = false  // 重置自定义 URL 显示状态
  dialogOpen.value = true
}

function openEditDialog (provider: AIProviderConfig) {
  editingProvider.value = provider
  // 对于已存在的配置，不显示 API Key（安全考虑）
  form.apiKey = ''
  // 从已保存的配置中获取 baseUrl
  const savedConfig = configs.value.find(c => c.provider === provider.id)
  form.baseUrl = savedConfig?.baseUrl || provider.defaultBaseUrl || ''
  showApiKey.value = false  // 默认遮罩显示
  showCustomUrl.value = !!savedConfig?.baseUrl  // 如果已配置自定义 URL，则显示
  dialogOpen.value = true
}

async function handleValidate () {
  if (!editingProvider.value || !canValidate.value) return

  const result = await validateConfig(
    editingProvider.value.id,
    form.apiKey || undefined,
    form.baseUrl || undefined
  )

  if (result.success) {
    toast({
      title: '验证成功',
      description: result.message || 'API 连接正常',
      variant: 'success'
    })
  } else {
    toast({
      title: '验证失败',
      description: result.message || 'API 连接失败',
      variant: 'destructive'
    })
  }
}

async function handleSave () {
  if (!editingProvider.value) return

  // 验证必填字段
  if (needsApiKey.value && !form.apiKey && !isConfigured(editingProvider.value.id)) {
    toast({
      title: '请输入 API Key',
      variant: 'destructive'
    })
    return
  }

  saving.value = true

  const result = await saveConfig({
    provider: editingProvider.value.id,
    apiKey: form.apiKey || undefined,
    baseUrl: form.baseUrl || undefined,
    enabled: true
  })

  saving.value = false

  if (result.success) {
    toast({
      title: '保存成功',
      description: result.message || 'API 配置已保存',
      variant: 'success'
    })
    dialogOpen.value = false
  } else {
    toast({
      title: '保存失败',
      description: result.message || '保存配置失败',
      variant: 'destructive'
    })
  }
}

async function handleToggle (providerId: AIProviderType, enabled: boolean) {
  const result = await toggleEnabled(providerId, enabled)
  if (result.success) {
    toast({
      title: enabled ? '已启用' : '已禁用',
      description: result.message,
      variant: 'success'
    })
  } else {
    toast({
      title: '操作失败',
      description: result.message,
      variant: 'destructive'
    })
  }
}

async function handleDelete (providerId: AIProviderType) {
  const provider = providers.value.find(p => p.id === providerId)
  if (!provider) return

  // 简单确认（可以用更好的确认对话框）
  if (!confirm(`确定要删除 ${provider.name} 的配置吗？`)) {
    return
  }

  const result = await deleteConfig(providerId)
  if (result.success) {
    toast({
      title: '删除成功',
      description: result.message || '配置已删除',
      variant: 'success'
    })
  } else {
    toast({
      title: '删除失败',
      description: result.message,
      variant: 'destructive'
    })
  }
}

// Initialize
onMounted(() => {
  initialize()
})
</script>
