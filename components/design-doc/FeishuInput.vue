<template>
  <div class="space-y-4">
    <div class="space-y-2">
      <Label for="feishu-url">{{ $t('designDoc.feishuUrl') }}</Label>
      <div class="flex gap-2">
        <div class="relative flex-1">
          <LinkIcon class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            id="feishu-url"
            v-model="url"
            :placeholder="$t('designDoc.feishuUrlPlaceholder')"
            class="pl-9"
            :disabled="disabled"
            @keydown.enter="handleValidate"
          />
        </div>
        <Button
          variant="outline"
          :disabled="!url.trim() || validating || disabled"
          @click="handleValidate"
        >
          <Loader2 v-if="validating" class="w-4 h-4 animate-spin mr-1" />
          <CheckCircle2 v-else-if="validated" class="w-4 h-4 mr-1 text-green-500" />
          <Search v-else class="w-4 h-4 mr-1" />
          {{ validating ? $t('designDoc.validating') : validated ? $t('designDoc.validated') : $t('designDoc.validate') }}
        </Button>
      </div>
    </div>

    <!-- Validation Result -->
    <div v-if="validated && docTitle" class="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800">
      <FileText class="w-4 h-4 text-green-600 shrink-0" />
      <span class="text-sm text-green-700 dark:text-green-400 truncate">{{ docTitle }}</span>
    </div>

    <div v-if="errorMsg" class="flex items-center gap-2 p-3 bg-destructive/10 rounded-lg border border-destructive/20">
      <AlertCircle class="w-4 h-4 text-destructive shrink-0" />
      <span class="text-sm text-destructive">{{ errorMsg }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { Link as LinkIcon, Search, Loader2, CheckCircle2, FileText, AlertCircle } from 'lucide-vue-next'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Button } from '~/components/ui/button'

interface Props {
  modelValue?: string
  disabled?: boolean
}

interface Emits {
  (e: 'update:modelValue', value: string): void
  (e: 'validated', data: { title: string; valid: boolean }): void
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  disabled: false
})
const emit = defineEmits<Emits>()

const url = ref(props.modelValue)
const validating = ref(false)
const validated = ref(false)
const docTitle = ref('')
const errorMsg = ref('')

watch(() => props.modelValue, (val) => {
  url.value = val
})

watch(url, (val) => {
  emit('update:modelValue', val)
  if (validated.value) {
    validated.value = false
    docTitle.value = ''
    errorMsg.value = ''
  }
})

async function handleValidate() {
  if (!url.value.trim() || validating.value) return

  validating.value = true
  errorMsg.value = ''
  validated.value = false

  try {
    const response = await $fetch<{
      success: boolean
      valid: boolean
      message?: string
      data?: { title: string }
    }>('/api/v1/feishu/validate', {
      method: 'POST',
      body: { url: url.value }
    })

    if (response.valid && response.data) {
      validated.value = true
      docTitle.value = response.data.title
      emit('validated', { title: response.data.title, valid: true })
    } else {
      errorMsg.value = response.message || '链接无效'
      emit('validated', { title: '', valid: false })
    }
  } catch (err: any) {
    errorMsg.value = err.data?.message || err.message || '验证失败'
    emit('validated', { title: '', valid: false })
  } finally {
    validating.value = false
  }
}
</script>
