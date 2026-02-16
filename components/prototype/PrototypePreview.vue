<template>
  <div class="relative w-full h-full bg-white dark:bg-gray-900">
    <!-- 设备切换按钮 -->
    <div class="absolute top-2 right-2 z-10 flex gap-1 bg-background/80 backdrop-blur-sm rounded-lg p-1 border border-border">
      <Button
        v-for="device in devices"
        :key="device.name"
        variant="ghost"
        size="icon"
        class="h-7 w-7"
        :class="{ 'bg-accent': activeDevice === device.name }"
        :title="device.label"
        @click="activeDevice = device.name"
      >
        <Monitor v-if="device.name === 'desktop'" class="w-3.5 h-3.5" />
        <Tablet v-else-if="device.name === 'tablet'" class="w-3.5 h-3.5" />
        <Smartphone v-else class="w-3.5 h-3.5" />
      </Button>
    </div>

    <!-- iframe 容器 -->
    <div class="w-full h-full flex items-start justify-center overflow-auto p-4 bg-muted/30">
      <div
        v-if="!html"
        class="flex items-center justify-center h-full text-muted-foreground"
      >
        <div class="text-center">
          <Layout class="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p class="text-sm">{{ $t('prototype.emptyPreview') }}</p>
        </div>
      </div>
      <iframe
        v-else
        ref="iframeRef"
        :srcdoc="html"
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
        :style="iframeStyle"
        class="border border-border rounded-lg shadow-sm bg-white transition-all duration-300"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { Monitor, Smartphone, Tablet, Layout } from 'lucide-vue-next'
import { Button } from '~/components/ui/button'

const { t } = useI18n()

const props = defineProps<{
  html: string
}>()

const iframeRef = ref<HTMLIFrameElement>()
const activeDevice = ref('desktop')

const devices = computed(() => [
  { name: 'desktop', label: t('prototype.deviceDesktop'), width: '100%', height: '100%' },
  { name: 'tablet', label: t('prototype.deviceTablet'), width: '768px', height: '1024px' },
  { name: 'mobile', label: t('prototype.deviceMobile'), width: '375px', height: '812px' }
])

const iframeStyle = computed(() => {
  const device = devices.value.find(d => d.name === activeDevice.value)
  return {
    width: device?.width || '100%',
    height: device?.height || '100%',
    maxWidth: '100%',
    maxHeight: '100%'
  }
})
</script>
