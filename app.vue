<template>
  <div>
    <NuxtLayout>
      <NuxtPage :transition="pageTransition" />
    </NuxtLayout>
  </div>
</template>

<script setup lang="ts">
// 全局页面过渡配置
const pageTransition = {
  name: 'page',
  mode: 'out-in' as const,
  appear: true
}
</script>

<style>
/* 全局页面过渡动画 */
.page-enter-active,
.page-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.page-enter-from {
  opacity: 0;
  transform: translateY(10px);
}

.page-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

/* 布局切换时的背景过渡 */
html {
  transition: background-color 0.3s ease;
}
</style>
