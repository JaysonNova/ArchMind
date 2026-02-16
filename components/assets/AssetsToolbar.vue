<script setup lang="ts">
import { LayoutGrid, List, Upload, Sparkles } from 'lucide-vue-next'
import { Button } from '~/components/ui/button'

defineProps<{
  viewMode: 'grid' | 'list'
}>()

const emit = defineEmits<{
  upload: []
  generate: []
  toggleView: [mode: 'grid' | 'list']
}>()
</script>

<template>
  <div class="border-b bg-background px-6 py-3 flex items-center justify-between">
    <div class="flex items-center gap-2">
      <Button size="sm" @click="emit('upload')">
        <Upload class="w-4 h-4 mr-2" />
        {{ $t('assets.upload') }}
      </Button>
      <Button size="sm" variant="outline" @click="emit('generate')">
        <Sparkles class="w-4 h-4 mr-2" />
        {{ $t('assets.aiGenerate') }}
      </Button>
    </div>

    <div class="flex items-center gap-1">
      <Button
        size="icon"
        variant="ghost"
        :class="{ 'bg-accent': viewMode === 'grid' }"
        @click="emit('toggleView', 'grid')"
      >
        <LayoutGrid class="w-4 h-4" />
      </Button>
      <Button
        size="icon"
        variant="ghost"
        :class="{ 'bg-accent': viewMode === 'list' }"
        @click="emit('toggleView', 'list')"
      >
        <List class="w-4 h-4" />
      </Button>
    </div>
  </div>
</template>
