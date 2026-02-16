<template>
  <div class="auth-layout" :class="{ 'leaving': isLeaving }">
    <!-- Navigation Bar -->
    <nav class="auth-nav">
      <div class="nav-container">
        <!-- Logo -->
        <NuxtLink to="/" class="nav-logo">
          <img src="/logo.png" alt="ArchMind" class="logo-img" />
          <span class="logo-text">ArchMind</span>
        </NuxtLink>

        <!-- Actions -->
        <div class="nav-actions">
          <!-- Language Switcher -->
          <DropdownMenu>
            <DropdownMenuTrigger as-child>
              <Button variant="ghost" size="sm" class="nav-btn">
                <Globe class="w-4 h-4" />
                <span class="hidden sm:inline">{{ locale === 'zh-CN' ? '中文' : 'EN' }}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem @click="changeLocale('zh-CN')">
                简体中文
              </DropdownMenuItem>
              <DropdownMenuItem @click="changeLocale('en')">
                English
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <!-- Theme Toggle -->
          <Button variant="ghost" size="icon" class="nav-btn" @click="toggleTheme">
            <Sun class="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon class="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          </Button>
        </div>
      </div>
    </nav>

    <!-- Background -->
    <div class="hyperspeed-wrapper">
      <ClientOnly>
        <!-- Hyperspeed - Sci-fi road background effect -->
        <Hyperspeed :effect-options="hyperspeedOptions" />
      </ClientOnly>
    </div>

    <!-- Page content with transition -->
    <NuxtPage :transition="pageTransition" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Globe, Sun, Moon } from 'lucide-vue-next'
import { Button } from '~/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '~/components/ui/dropdown-menu'
import Hyperspeed from '~/components/ui/bits/Hyperspeed/Hyperspeed.vue'

const route = useRoute()
const router = useRouter()
// @ts-expect-error - setLocale is provided by @nuxtjs/i18n at runtime but not typed
const { locale, setLocale } = useI18n()
const colorMode = useColorMode()
const isLeaving = ref(false)

// Theme toggle
function toggleTheme() {
  colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark'
}

// Locale change
function changeLocale(newLocale: string) {
  setLocale(newLocale)
}

// 监听路由变化，当离开 auth 页面时添加 leaving 类
router.beforeEach((to, from, next) => {
  // 如果从 auth 页面离开到非 auth 页面
  const authPages = ['/login', '/register']
  if (authPages.includes(from.path) && !authPages.includes(to.path)) {
    isLeaving.value = true
  }
  next()
})

router.afterEach((to) => {
  // 重置状态
  const authPages = ['/login', '/register']
  if (authPages.includes(to.path)) {
    isLeaving.value = false
  }
})

// Hyperspeed options - dynamic based on theme
const hyperspeedOptions = computed(() => {
  const isDark = colorMode.value === 'dark'

  return {
    distortion: 'turbulentDistortion',
    length: 400,
    roadWidth: 10,
    islandWidth: 2,
    lanesPerRoad: 4,
    fov: 90,
    fovSpeedUp: 150,
    speedUp: 2,
    carLightsFade: 0.4,
    totalSideLightSticks: 20,
    lightPairsPerRoadWay: 40,
    shoulderLinesWidthPercentage: 0.05,
    brokenLinesWidthPercentage: 0.1,
    brokenLinesLengthPercentage: 0.5,
    lightStickWidth: [0.12, 0.5] as [number, number],
    lightStickHeight: [1.3, 1.7] as [number, number],
    movingAwaySpeed: [60, 80] as [number, number],
    movingCloserSpeed: [-120, -160] as [number, number],
    carLightsLength: [12, 80] as [number, number],
    carLightsRadius: [0.05, 0.14] as [number, number],
    carWidthPercentage: [0.3, 0.5] as [number, number],
    carShiftX: [-0.8, 0.8] as [number, number],
    carFloorSeparation: [0, 5] as [number, number],
    colors: isDark
      ? {
          // Dark mode - dark road with colorful lights
          roadColor: 0x080808,
          islandColor: 0x0a0a0a,
          background: 0x000000,
          shoulderLines: 0x6366f1,
          brokenLines: 0x6366f1,
          leftCars: [0xd856bf, 0x6750a2, 0xc247ac],
          rightCars: [0x03b3c3, 0x0e5ea5, 0x324555],
          sticks: 0x8b5cf6
        }
      : {
          // Light mode - white road with softer colors
          roadColor: 0xf0f0f0,
          islandColor: 0xe8e8e8,
          background: 0xffffff,
          shoulderLines: 0x6366f1,
          brokenLines: 0x6366f1,
          leftCars: [0xd856bf, 0x6750a2, 0xc247ac],
          rightCars: [0x03b3c3, 0x0e5ea5, 0x324555],
          sticks: 0x8b5cf6
        }
  }
})

const pageTransition = {
  name: 'auth-page',
  mode: 'out-in' as const
}
</script>

<style scoped>
.auth-layout {
  min-height: 100vh;
  position: relative;
  overflow: hidden;
  background: hsl(var(--background));
}

/* 离开 auth 页面时的过渡效果 */
.auth-layout.leaving {
  animation: auth-leave 0.4s ease forwards;
}

@keyframes auth-leave {
  0% {
    opacity: 1;
  }
  100% {
    opacity: 0;
  }
}

.auth-layout.leaving .hyperspeed-wrapper {
  animation: hyperspeed-fade 0.4s ease forwards;
}

@keyframes hyperspeed-fade {
  0% {
    opacity: 1;
    transform: scale(1);
  }
  100% {
    opacity: 0;
    transform: scale(1.05);
  }
}

.hyperspeed-wrapper {
  position: fixed;
  inset: 0;
  z-index: 0;
  opacity: 0.7;
  transition: opacity 0.3s ease;
}

/* Dark mode */
.dark .hyperspeed-wrapper {
  opacity: 0.8;
}

/* Light mode - more subtle */
:root:not(.dark) .hyperspeed-wrapper {
  opacity: 0.5;
}

/* Navigation */
.auth-nav {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 50;
  border-bottom: 1px solid hsl(var(--border) / 0.5);
  background: hsl(var(--background) / 0.8);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}

.nav-container {
  max-width: 7xl;
  margin: 0 auto;
  padding: 0 1.5rem;
  height: 4rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.nav-logo {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  text-decoration: none;
  color: hsl(var(--foreground));
}

.logo-img {
  width: 2rem;
  height: 2rem;
  border-radius: 0.5rem;
  object-fit: contain;
}

.logo-text {
  font-weight: 600;
  font-size: 1.125rem;
  letter-spacing: -0.025em;
}

.nav-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.nav-btn {
  color: hsl(var(--muted-foreground));
}

.nav-btn:hover {
  color: hsl(var(--foreground));
  background: hsl(var(--accent));
}

/* Page transition */
.auth-page-enter-active,
.auth-page-leave-active {
  transition: opacity 0.2s ease;
}

.auth-page-enter-from,
.auth-page-leave-to {
  opacity: 0;
}
</style>
