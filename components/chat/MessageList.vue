<template>
  <div class="relative flex-1 overflow-hidden">
    <div
      ref="container"
      class="h-full overflow-y-auto p-6"
      @scroll="handleScroll"
    >
      <!-- Messages -->
      <div class="flex flex-col gap-4">
        <MessageBubble
          v-for="message in messages"
          :key="message.id"
          :message="message"
          @retry="handleRetry"
          @back="handleBack"
        />
      </div>
    </div>

    <!-- Scroll to bottom button -->
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0 translate-y-2"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 translate-y-2"
    >
      <Button
        v-if="userScrolled"
        variant="outline"
        size="icon"
        class="absolute bottom-4 right-4 h-8 w-8 rounded-full shadow-md"
        @click="handleScrollToBottomClick"
      >
        <ArrowDown class="h-4 w-4" />
      </Button>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { watch, ref, nextTick, onMounted, computed } from 'vue'
import { ArrowDown } from 'lucide-vue-next'
import type { ConversationMessage } from '~/types/conversation'
import MessageBubble from './MessageBubble.vue'
import { Button } from '~/components/ui/button'

const props = defineProps<{
  messages: ConversationMessage[]
}>()

const emit = defineEmits<{
  retry: [message: ConversationMessage]
  back: [message: ConversationMessage]
}>()

const container = ref<HTMLDivElement>()

// 用户是否手动滚动（脱离底部）
const userScrolled = ref(false)

// 判断滚动条是否在底部附近（允许 30px 的误差）
function isNearBottom(): boolean {
  if (!container.value) return true
  const { scrollTop, scrollHeight, clientHeight } = container.value
  return scrollHeight - scrollTop - clientHeight < 30
}

// 滚动到底部
function scrollToBottom() {
  if (container.value) {
    container.value.scrollTop = container.value.scrollHeight
  }
}

// 用户手动滚动时的处理
let scrollByCode = false
function handleScroll() {
  if (scrollByCode) return
  userScrolled.value = !isNearBottom()
}

// 程序控制的滚动（不触发 userScrolled 标记）
function programmaticScrollToBottom() {
  if (!container.value) return
  scrollByCode = true
  container.value.scrollTop = container.value.scrollHeight
  // 在下一帧恢复标记，避免 scroll 事件误判
  requestAnimationFrame(() => {
    scrollByCode = false
  })
}

// 用户点击"滚动到底部"按钮
function handleScrollToBottomClick() {
  userScrolled.value = false
  programmaticScrollToBottom()
}

// 检测是否有正在流式生成的消息
const hasStreamingMessage = computed(() =>
  props.messages.some(m => m.isStreaming)
)

// 监听消息数量变化（新消息到来时自动滚动）
watch(
  () => props.messages.length,
  async () => {
    // 新消息到来时重置用户滚动状态，自动滚动到底部
    userScrolled.value = false
    await nextTick()
    programmaticScrollToBottom()
  }
)

// 监听最后一条消息的内容变化（流式生成时的增量内容更新）
watch(
  () => {
    const lastMsg = props.messages[props.messages.length - 1]
    return lastMsg?.content?.length ?? 0
  },
  async () => {
    if (userScrolled.value) return
    await nextTick()
    programmaticScrollToBottom()
  }
)

// 当流式生成结束时，如果用户没有手动滚动，则确保滚动到底部
watch(hasStreamingMessage, async (streaming, wasStreaming) => {
  if (wasStreaming && !streaming && !userScrolled.value) {
    await nextTick()
    programmaticScrollToBottom()
  }
})

// Initial scroll to bottom
onMounted(async () => {
  await nextTick()
  scrollToBottom()
})

// Handle retry event from MessageBubble
function handleRetry(message: ConversationMessage) {
  emit('retry', message)
}

// Handle back event from MessageBubble
function handleBack(message: ConversationMessage) {
  emit('back', message)
}
</script>

<style scoped>
/* 让原生滚动条变细，与 ScrollBar 组件风格一致 */
.overflow-y-auto::-webkit-scrollbar {
  width: 6px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  background: transparent;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background: hsl(var(--border));
  border-radius: 9999px;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background: hsl(var(--border) / 0.8);
}
</style>
