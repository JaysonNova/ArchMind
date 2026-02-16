<script setup lang="ts">
import { Handle, Position } from '@vue-flow/core'
import type { NodeProps } from '@vue-flow/core'

interface RoleNodeData {
  label: string
  description: string
}

defineProps<NodeProps<RoleNodeData>>()
</script>

<template>
  <div class="px-4 py-3 rounded-lg border-2 border-green-300 bg-green-50 dark:bg-green-950/50 dark:border-green-700 shadow-sm min-w-[140px] max-w-[200px]">
    <Handle type="target" :position="Position.Top" class="!bg-green-500 !w-2 !h-2" />
    <div class="flex items-center gap-2 mb-1">
      <div class="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
      <span class="text-sm font-medium text-green-900 dark:text-green-100 truncate">
        {{ data.label }}
      </span>
    </div>
    <p v-if="data.description" class="text-xs text-green-600/70 dark:text-green-300/70 line-clamp-2">
      {{ data.description }}
    </p>
    <Handle type="source" :position="Position.Bottom" class="!bg-green-500 !w-2 !h-2" />
  </div>
</template>
