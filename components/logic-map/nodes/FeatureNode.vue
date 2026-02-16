<script setup lang="ts">
import { Handle, Position } from '@vue-flow/core'
import type { NodeProps } from '@vue-flow/core'

interface FeatureNodeData {
  label: string
  description: string
}

defineProps<NodeProps<FeatureNodeData>>()
</script>

<template>
  <div class="px-4 py-3 rounded-lg border-2 border-blue-300 bg-blue-50 dark:bg-blue-950/50 dark:border-blue-700 shadow-sm min-w-[140px] max-w-[200px]">
    <Handle type="target" :position="Position.Top" class="!bg-blue-500 !w-2 !h-2" />
    <div class="flex items-center gap-2 mb-1">
      <div class="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
      <span class="text-sm font-medium text-blue-900 dark:text-blue-100 truncate">
        {{ data.label }}
      </span>
    </div>
    <p v-if="data.description" class="text-xs text-blue-600/70 dark:text-blue-300/70 line-clamp-2">
      {{ data.description }}
    </p>
    <Handle type="source" :position="Position.Bottom" class="!bg-blue-500 !w-2 !h-2" />
  </div>
</template>
