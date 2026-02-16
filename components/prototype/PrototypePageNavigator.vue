<template>
  <div class="flex-shrink-0 border-b border-border px-4 py-2 flex items-center gap-2 overflow-x-auto bg-muted/20">
    <Button
      v-for="page in pages"
      :key="page.pageSlug"
      :variant="activePage === page.pageSlug ? 'default' : 'ghost'"
      size="sm"
      class="h-7 text-xs shrink-0"
      @click="$emit('select', page.pageSlug)"
    >
      {{ page.pageName }}
    </Button>
    <Button
      variant="ghost"
      size="icon"
      class="h-7 w-7 shrink-0"
      @click="$emit('addPage')"
    >
      <Plus class="w-3.5 h-3.5" />
    </Button>
  </div>
</template>

<script setup lang="ts">
import { Plus } from 'lucide-vue-next'
import { Button } from '~/components/ui/button'
import type { PrototypePage } from '~/types/prototype'

defineProps<{
  pages: PrototypePage[]
  activePage: string
}>()

defineEmits<{
  select: [slug: string]
  addPage: []
}>()
</script>
