<template>
  <Select :model-value="currentLocale" @update:model-value="handleLocaleChange">
    <SelectTrigger class="w-[140px]">
      <SelectValue>
        <div class="flex items-center gap-2">
          <Languages class="w-4 h-4" />
          <span>{{ localeLabel }}</span>
        </div>
      </SelectValue>
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="zh-CN">
        <div class="flex items-center gap-2">
          <span>🇨🇳</span>
          <span>简体中文</span>
        </div>
      </SelectItem>
      <SelectItem value="en">
        <div class="flex items-center gap-2">
          <span>🇺🇸</span>
          <span>English</span>
        </div>
      </SelectItem>
    </SelectContent>
  </Select>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Languages } from 'lucide-vue-next'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '~/components/ui/select'
import type { AcceptableValue } from 'reka-ui'

// @ts-expect-error - setLocale is provided by @nuxtjs/i18n at runtime but not typed
const { locale, setLocale } = useI18n()

const currentLocale = computed(() => locale.value)

const localeLabel = computed(() => {
  return locale.value === 'zh-CN' ? '简体中文' : 'English'
})

async function handleLocaleChange(value: AcceptableValue) {
  const newLocale = String(value)
  if (newLocale && newLocale !== locale.value) {
    await setLocale(newLocale)
  }
}
</script>
