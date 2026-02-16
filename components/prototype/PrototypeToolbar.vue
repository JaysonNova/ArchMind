<template>
  <div class="flex-shrink-0 px-4 py-2 border-b border-border flex items-center justify-between bg-muted/20">
    <div class="flex items-center gap-2">
      <!-- 从 PRD 生成按钮 -->
      <Button
        v-if="hasPrd"
        variant="outline"
        size="sm"
        class="h-7 text-xs gap-1.5"
        :disabled="isGenerating"
        @click="$emit('generateFromPrd')"
      >
        <Wand2 class="w-3 h-3" />
        {{ isGenerating ? $t('prototype.generating') : $t('prototype.generateFromPrd') }}
      </Button>

      <Separator v-if="hasPrd && hasPrototype" orientation="vertical" class="h-5" />

      <!-- 视图切换 -->
      <div v-if="hasPrototype" class="flex gap-0.5 bg-muted rounded-md p-0.5">
        <Button
          variant="ghost"
          size="icon"
          class="h-6 w-6"
          :class="{ 'bg-background shadow-sm': activeView === 'preview' }"
          :title="$t('prototype.viewPreview')"
          @click="$emit('toggleView', 'preview')"
        >
          <Eye class="w-3 h-3" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          class="h-6 w-6"
          :class="{ 'bg-background shadow-sm': activeView === 'code' }"
          :title="$t('prototype.viewCode')"
          @click="$emit('toggleView', 'code')"
        >
          <Code class="w-3 h-3" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          class="h-6 w-6"
          :class="{ 'bg-background shadow-sm': activeView === 'split' }"
          :title="$t('prototype.viewSplit')"
          @click="$emit('toggleView', 'split')"
        >
          <Columns2 class="w-3 h-3" />
        </Button>
      </div>
    </div>

    <div class="flex items-center gap-2">
      <!-- 保存按钮 -->
      <Button
        v-if="hasPrototype"
        variant="ghost"
        size="sm"
        class="h-7 text-xs gap-1.5"
        @click="$emit('save')"
      >
        <Save class="w-3 h-3" />
        {{ $t('common.save') }}
      </Button>

      <!-- 全屏编辑按钮 -->
      <Button
        v-if="hasPrototype"
        variant="ghost"
        size="sm"
        class="h-7 text-xs gap-1.5"
        @click="$emit('openFullscreen')"
      >
        <Maximize2 class="w-3 h-3" />
        {{ $t('prototype.fullscreen') }}
      </Button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Eye, Code, Columns2, Wand2, Save, Maximize2 } from 'lucide-vue-next'
import { Button } from '~/components/ui/button'
import { Separator } from '~/components/ui/separator'

defineProps<{
  hasPrototype: boolean
  hasPrd: boolean
  isGenerating: boolean
  activeView: 'preview' | 'code' | 'split'
}>()

defineEmits<{
  generateFromPrd: []
  toggleView: [view: 'preview' | 'code' | 'split']
  openFullscreen: []
  save: []
}>()
</script>
