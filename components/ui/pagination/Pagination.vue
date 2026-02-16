<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { computed } from 'vue'
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-vue-next'
import { cn } from '~/lib/utils'
import { Button } from '~/components/ui/button'

interface Props {
  class?: HTMLAttributes['class']
  currentPage: number
  totalPages: number
  onPageChange?: (page: number) => void
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'update:currentPage', page: number): void
}>()

const canGoPrevious = computed(() => props.currentPage > 1)
const canGoNext = computed(() => props.currentPage < props.totalPages)

function goToPage(page: number) {
  if (page >= 1 && page <= props.totalPages) {
    emit('update:currentPage', page)
    props.onPageChange?.(page)
  }
}

function goPrevious() {
  if (canGoPrevious.value) {
    goToPage(props.currentPage - 1)
  }
}

function goNext() {
  if (canGoNext.value) {
    goToPage(props.currentPage + 1)
  }
}

// 计算显示的页码
const visiblePages = computed(() => {
  const pages: (number | 'ellipsis')[] = []
  const total = props.totalPages
  const current = props.currentPage

  if (total <= 7) {
    // 如果总页数 <= 7，显示所有页码
    for (let i = 1; i <= total; i++) {
      pages.push(i)
    }
  } else {
    // 总是显示第一页
    pages.push(1)

    if (current > 3) {
      pages.push('ellipsis')
    }

    // 显示当前页附近的页码
    const start = Math.max(2, current - 1)
    const end = Math.min(total - 1, current + 1)

    for (let i = start; i <= end; i++) {
      pages.push(i)
    }

    if (current < total - 2) {
      pages.push('ellipsis')
    }

    // 总是显示最后一页
    pages.push(total)
  }

  return pages
})
</script>

<template>
  <nav
    v-if="totalPages > 1"
    :class="cn('mx-auto flex w-full justify-center', props.class)"
    role="navigation"
    aria-label="pagination"
  >
    <ul class="flex flex-row items-center gap-1">
      <!-- First Page -->
      <li>
        <Button
          variant="ghost"
          size="icon"
          class="h-8 w-8"
          :disabled="!canGoPrevious"
          @click="goToPage(1)"
        >
          <span class="sr-only">Go to first page</span>
          <ChevronsLeft class="h-4 w-4" />
        </Button>
      </li>

      <!-- Previous -->
      <li>
        <Button
          variant="ghost"
          size="icon"
          class="h-8 w-8"
          :disabled="!canGoPrevious"
          @click="goPrevious"
        >
          <span class="sr-only">Go to previous page</span>
          <ChevronLeft class="h-4 w-4" />
        </Button>
      </li>

      <!-- Page Numbers -->
      <template v-for="(page, index) in visiblePages" :key="index">
        <li v-if="page === 'ellipsis'">
          <span class="flex h-8 w-8 items-center justify-center text-sm text-muted-foreground">
            ...
          </span>
        </li>
        <li v-else>
          <Button
            :variant="page === currentPage ? 'default' : 'ghost'"
            size="icon"
            class="h-8 w-8"
            @click="goToPage(page)"
          >
            <span class="sr-only">Go to page {{ page }}</span>
            {{ page }}
          </Button>
        </li>
      </template>

      <!-- Next -->
      <li>
        <Button
          variant="ghost"
          size="icon"
          class="h-8 w-8"
          :disabled="!canGoNext"
          @click="goNext"
        >
          <span class="sr-only">Go to next page</span>
          <ChevronRight class="h-4 w-4" />
        </Button>
      </li>

      <!-- Last Page -->
      <li>
        <Button
          variant="ghost"
          size="icon"
          class="h-8 w-8"
          :disabled="!canGoNext"
          @click="goToPage(totalPages)"
        >
          <span class="sr-only">Go to last page</span>
          <ChevronsRight class="h-4 w-4" />
        </Button>
      </li>
    </ul>
  </nav>
</template>
