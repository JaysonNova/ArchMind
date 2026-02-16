<script setup lang="ts">
import { Handle, Position } from '@vue-flow/core'
import type { NodeProps } from '@vue-flow/core'

interface EntityNodeData {
  label: string
  description: string
}

defineProps<NodeProps<EntityNodeData>>()
</script>

<template>
  <div class="px-4 py-3 rounded-lg border-2 border-purple-300 bg-purple-50 dark:bg-purple-950/50 dark:border-purple-700 shadow-sm min-w-[140px] max-w-[200px]">
    <Handle type="target" :position="Position.Top" class="!bg-purple-500 !w-2 !h-2" />
    <div class="flex items-center gap-2 mb-1">
      <div class="w-2 h-2 rounded-full bg-purple-500 flex-shrink-0" />
      <span class="text-sm font-medium text-purple-900 dark:text-purple-100 truncate">
        {{ data.label }}
      </span>
    </div>
    <p v-if="data.description" class="text-xs text-purple-600/70 dark:text-purple-300/70 line-clamp-2">
      {{ data.description }}
    </p>
    <Handle type="source" :position="Position.Bottom" class="!bg-purple-500 !w-2 !h-2" />
  </div>
</template>
