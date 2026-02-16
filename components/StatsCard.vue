<template>
  <Card class="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden relative">
    <CardContent class="p-6">
      <div class="flex items-center justify-between">
        <div class="flex-1">
          <p class="text-sm font-medium text-muted-foreground mb-2">
            {{ title }}
          </p>
          <p class="text-4xl font-bold text-primary">
            {{ formattedValue }}
          </p>
        </div>
        <div class="relative">
          <div class="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
            <component :is="icon" class="w-8 h-8 text-primary" />
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
</template>

<script setup lang="ts">
import type { Component } from 'vue'

const props = defineProps<{
  title: string;
  value: number | string;
  icon: Component;
}>()

const formattedValue = computed(() => {
  if (typeof props.value === 'number') {
    return props.value.toLocaleString()
  }
  return props.value
})
</script>
