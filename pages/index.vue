<template>
  <div class="landing-page min-h-screen bg-background text-foreground overflow-x-hidden">
    <!-- Navigation -->
    <nav class="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div class="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <!-- Logo -->
        <NuxtLink to="/" class="flex items-center gap-3 group">
          <img src="/logo.png" alt="ArchMind" class="w-8 h-8 rounded-lg" />
          <span class="font-semibold text-lg tracking-tight">ArchMind</span>
        </NuxtLink>

        <!-- Nav Links -->
        <div class="hidden md:flex items-center gap-8">
          <a href="#features" class="text-sm text-muted-foreground hover:text-foreground transition-colors">
            {{ t('landing.features.title') }}
          </a>
          <a href="#workflow" class="text-sm text-muted-foreground hover:text-foreground transition-colors">
            {{ t('landing.workflow.title') }}
          </a>
          <a href="#models" class="text-sm text-muted-foreground hover:text-foreground transition-colors">
            {{ t('landing.models.title') }}
          </a>
        </div>

        <!-- Actions -->
        <div class="flex items-center gap-4">
          <!-- Language Switcher -->
          <DropdownMenu>
            <DropdownMenuTrigger as-child>
              <Button variant="ghost" size="sm" class="gap-2">
                <Globe class="w-4 h-4" />
                <span class="hidden sm:inline">{{ locale === 'zh-CN' ? '中文' : 'EN' }}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem @click="switchLocale('zh-CN')">
                简体中文
              </DropdownMenuItem>
              <DropdownMenuItem @click="switchLocale('en')">
                English
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <!-- Theme Toggle -->
          <Button variant="ghost" size="icon" @click="toggleTheme">
            <Sun class="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon class="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          </Button>

          <!-- CTA -->
          <Button as-child class="hidden sm:flex">
            <NuxtLink to="/app">
              {{ t('landing.hero.cta.start') }}
            </NuxtLink>
          </Button>
        </div>
      </div>
    </nav>

    <!-- Hero Section -->
    <section class="relative pt-32 pb-24 md:pt-44 md:pb-40 overflow-hidden min-h-screen flex items-center">
      <!-- ColorBends Background -->
      <div class="absolute inset-0 z-0 h-screen">
        <ColorBends/>
      </div>

      <!-- Content wrapper with higher z-index -->
      <div class="relative z-10 w-full">
        <div class="max-w-7xl mx-auto px-6">
        <div class="max-w-3xl mx-auto text-center">
          <!-- Brand Name - Large & Prominent -->
          <AnimatedContent
            :distance="30"
            :duration="0.8"
            :delay="0"
          >
            <div class="flex items-center justify-center gap-4 mb-8">
              <img src="/logo.png" alt="ArchMind" class="w-16 h-16 md:w-20 md:h-20 rounded-2xl shadow-xl" />
              <h1 class="text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight">
                <span class="bg-gradient-to-r from-foreground via-foreground/90 to-foreground/80 bg-clip-text text-transparent">
                  ArchMind
                </span>
              </h1>
            </div>
          </AnimatedContent>

          <!-- Tagline -->
          <AnimatedContent
            :distance="30"
            :duration="0.8"
            :delay="0.15"
            class="mb-10"
          >
            <p class="text-xl sm:text-2xl md:text-3xl font-medium text-black/85 dark:text-white/85 leading-relaxed">
              {{ t('app.tagline') }}
            </p>
          </AnimatedContent>

          <!-- Key Value Proposition -->
          <AnimatedContent
            :distance="30"
            :duration="0.8"
            :delay="0.3"
            class="mb-12"
          >
            <p class="text-base md:text-lg text-black/60 dark:text-white/60 max-w-xl mx-auto leading-relaxed">
              {{ t('landing.hero.description') }}
            </p>
          </AnimatedContent>

          <!-- CTA with MagnetButton -->
          <AnimatedContent
            :distance="30"
            :duration="0.8"
            :delay="0.45"
            class="mb-16"
          >
            <MagnetButton :magnet-strength="0.4" :scale-strength="0.08">
              <Button
                as-child
                size="lg"
                class="group relative min-w-[180px] h-12 px-10 bg-foreground text-background font-medium rounded-full overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-foreground/25"
              >
                <NuxtLink to="/app" class="flex items-center justify-center gap-2">
                  <span class="relative z-10 text-base">{{ t('landing.hero.cta.start') }}</span>
                  <ArrowRight class="w-5 h-5 relative z-10 transition-transform duration-300 group-hover:translate-x-1" />
                  <!-- Animated border gradient -->
                  <div class="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                    <div class="absolute inset-[-2px] rounded-full bg-gradient-to-r from-transparent via-white/40 to-transparent animate-spin-slow" style="animation-duration: 3s;" />
                  </div>
                </NuxtLink>
              </Button>
            </MagnetButton>
          </AnimatedContent>

          <!-- Stats with CountUp -->
          <AnimatedContent
            :distance="30"
            :duration="0.8"
            :delay="0.6"
            class="flex flex-wrap items-center justify-center gap-8 md:gap-16"
          >
            <div class="flex flex-col items-center gap-1">
              <span class="text-3xl md:text-4xl font-bold">
                <CountUp :end-value="8" suffix="+" :duration="1500" />
              </span>
              <span class="text-sm text-muted-foreground">{{ t('landing.models.subtitle') }}</span>
            </div>
            <div class="w-px h-10 bg-border hidden sm:block"></div>
            <div class="flex flex-col items-center gap-1">
              <span class="text-3xl md:text-4xl font-bold">
                <CountUp :end-value="95" suffix="%" :duration="1800" />
              </span>
              <span class="text-sm text-muted-foreground">{{ t('landing.hero.stats.ragRetrieval') }}</span>
            </div>
            <div class="w-px h-10 bg-border hidden sm:block"></div>
            <div class="flex flex-col items-center gap-1">
              <span class="text-3xl md:text-4xl font-bold">
                <CountUp :end-value="10" prefix="<" suffix="s" :duration="1600" />
              </span>
              <span class="text-sm text-muted-foreground">{{ t('landing.hero.stats.streamingOutput') }}</span>
            </div>
          </AnimatedContent>
        </div>

        <!-- Hero Image / Preview with AnimatedContent -->
        <AnimatedContent
          :distance="60"
          :duration="0.8"
          :delay="0.6"
          class="mt-20 relative"
        >
          <div class="relative rounded-xl border border-border overflow-hidden shadow-2xl">
            <!-- Browser Chrome -->
            <div class="h-10 bg-muted/50 border-b border-border flex items-center px-4 gap-2">
              <div class="flex gap-1.5">
                <div class="w-3 h-3 rounded-full bg-red-500/80"></div>
                <div class="w-3 h-3 rounded-full bg-yellow-500/80"></div>
                <div class="w-3 h-3 rounded-full bg-green-500/80"></div>
              </div>
              <div class="flex-1 flex justify-center">
                <div class="px-4 py-1 rounded-md bg-background/50 text-xs text-muted-foreground">
                  archmind.ai
                </div>
              </div>
            </div>
            <!-- Preview Content - Light mode image -->
            <div class="bg-muted/30 dark:hidden">
              <img
                src="/landing-preview.png"
                alt="ArchMind AI Interface"
                class="w-full h-auto"
              />
            </div>
            <!-- Preview Content - Dark mode image -->
            <div class="bg-muted/30 hidden dark:block">
              <img
                src="/landing-preview-dark.png"
                alt="ArchMind AI Interface"
                class="w-full h-auto"
              />
            </div>
          </div>

          <!-- Decorative Elements -->
          <div class="absolute -left-8 top-1/4 w-32 h-32 bg-foreground/5 rounded-full blur-3xl"></div>
          <div class="absolute -right-8 bottom-1/4 w-40 h-40 bg-foreground/5 rounded-full blur-3xl"></div>
        </AnimatedContent>
        </div>
      </div>
    </section>

    <!-- Features Section -->
    <section id="features" class="py-24 md:py-32 border-t border-border">
      <div class="max-w-7xl mx-auto px-6">
        <AnimatedContent
          :distance="40"
          :duration="0.7"
          :delay="0"
          class="text-center mb-16"
        >
          <h2 class="text-3xl md:text-4xl font-bold tracking-tight mb-4">
            {{ t('landing.features.title') }}
          </h2>
          <p class="text-lg text-muted-foreground max-w-2xl mx-auto">
            {{ t('landing.features.subtitle') }}
          </p>
        </AnimatedContent>

        <div class="grid md:grid-cols-2 gap-6">
          <!-- RAG Feature -->
          <AnimatedContent :distance="40" :duration="0.6" :delay="0.1">
            <div class="group relative p-8 rounded-2xl border border-border bg-card/50 hover:bg-card transition-colors duration-300 h-full">
              <div class="absolute inset-0 rounded-2xl bg-gradient-to-br from-foreground/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div class="relative">
                <div class="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mb-6">
                  <Database class="w-6 h-6" />
                </div>
                <h3 class="text-xl font-semibold mb-3">{{ t('landing.features.rag.title') }}</h3>
                <p class="text-muted-foreground leading-relaxed">
                  {{ t('landing.features.rag.description') }}
                </p>
              </div>
            </div>
          </AnimatedContent>

          <!-- Multi-Model Feature -->
          <AnimatedContent :distance="40" :duration="0.6" :delay="0.2">
            <div class="group relative p-8 rounded-2xl border border-border bg-card/50 hover:bg-card transition-colors duration-300 h-full">
              <div class="absolute inset-0 rounded-2xl bg-gradient-to-br from-foreground/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div class="relative">
                <div class="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mb-6">
                  <Brain class="w-6 h-6" />
                </div>
                <h3 class="text-xl font-semibold mb-3">{{ t('landing.features.multiModel.title') }}</h3>
                <p class="text-muted-foreground leading-relaxed">
                  {{ t('landing.features.multiModel.description') }}
                </p>
              </div>
            </div>
          </AnimatedContent>

          <!-- PRD Generation Feature -->
          <AnimatedContent :distance="40" :duration="0.6" :delay="0.3">
            <div class="group relative p-8 rounded-2xl border border-border bg-card/50 hover:bg-card transition-colors duration-300 h-full">
              <div class="absolute inset-0 rounded-2xl bg-gradient-to-br from-foreground/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div class="relative">
                <div class="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mb-6">
                  <FileText class="w-6 h-6" />
                </div>
                <h3 class="text-xl font-semibold mb-3">{{ t('landing.features.prd.title') }}</h3>
                <p class="text-muted-foreground leading-relaxed">
                  {{ t('landing.features.prd.description') }}
                </p>
              </div>
            </div>
          </AnimatedContent>

          <!-- Prototype Feature -->
          <AnimatedContent :distance="40" :duration="0.6" :delay="0.4">
            <div class="group relative p-8 rounded-2xl border border-border bg-card/50 hover:bg-card transition-colors duration-300 h-full">
              <div class="absolute inset-0 rounded-2xl bg-gradient-to-br from-foreground/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div class="relative">
                <div class="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mb-6">
                  <Layout class="w-6 h-6" />
                </div>
                <h3 class="text-xl font-semibold mb-3">{{ t('landing.features.prototype.title') }}</h3>
                <p class="text-muted-foreground leading-relaxed">
                  {{ t('landing.features.prototype.description') }}
                </p>
              </div>
            </div>
          </AnimatedContent>
        </div>
      </div>
    </section>

    <!-- Workflow Section -->
    <section id="workflow" class="py-24 md:py-32 border-t border-border bg-muted/30">
      <div class="max-w-7xl mx-auto px-6">
        <AnimatedContent
          :distance="40"
          :duration="0.7"
          :delay="0"
          class="text-center mb-16"
        >
          <h2 class="text-3xl md:text-4xl font-bold tracking-tight mb-4">
            {{ t('landing.workflow.title') }}
          </h2>
          <p class="text-lg text-muted-foreground max-w-2xl mx-auto">
            {{ t('landing.workflow.subtitle') }}
          </p>
        </AnimatedContent>

        <div class="relative">
          <!-- Connection Line -->
          <div class="absolute top-1/2 left-0 right-0 h-px bg-border hidden lg:block -translate-y-1/2"></div>

          <div class="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <!-- Step 1 -->
            <AnimatedContent :distance="50" :duration="0.6" :delay="0.1">
              <div class="relative group flex flex-col items-center text-center">
                <div class="w-16 h-16 rounded-2xl bg-background border-2 border-border flex items-center justify-center mb-6 relative z-10 group-hover:border-foreground/30 transition-colors">
                  <Upload class="w-7 h-7" />
                  <span class="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-foreground text-background text-xs font-bold flex items-center justify-center">1</span>
                </div>
                <h3 class="text-lg font-semibold mb-2">{{ t('landing.workflow.step1.title') }}</h3>
                <p class="text-sm text-muted-foreground">{{ t('landing.workflow.step1.description') }}</p>
              </div>
            </AnimatedContent>

            <!-- Step 2 -->
            <AnimatedContent :distance="50" :duration="0.6" :delay="0.2">
              <div class="relative group flex flex-col items-center text-center">
                <div class="w-16 h-16 rounded-2xl bg-background border-2 border-border flex items-center justify-center mb-6 relative z-10 group-hover:border-foreground/30 transition-colors">
                  <Search class="w-7 h-7" />
                  <span class="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-foreground text-background text-xs font-bold flex items-center justify-center">2</span>
                </div>
                <h3 class="text-lg font-semibold mb-2">{{ t('landing.workflow.step2.title') }}</h3>
                <p class="text-sm text-muted-foreground">{{ t('landing.workflow.step2.description') }}</p>
              </div>
            </AnimatedContent>

            <!-- Step 3 -->
            <AnimatedContent :distance="50" :duration="0.6" :delay="0.3">
              <div class="relative group flex flex-col items-center text-center">
                <div class="w-16 h-16 rounded-2xl bg-background border-2 border-border flex items-center justify-center mb-6 relative z-10 group-hover:border-foreground/30 transition-colors">
                  <Sparkles class="w-7 h-7" />
                  <span class="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-foreground text-background text-xs font-bold flex items-center justify-center">3</span>
                </div>
                <h3 class="text-lg font-semibold mb-2">{{ t('landing.workflow.step3.title') }}</h3>
                <p class="text-sm text-muted-foreground">{{ t('landing.workflow.step3.description') }}</p>
              </div>
            </AnimatedContent>

            <!-- Step 4 -->
            <AnimatedContent :distance="50" :duration="0.6" :delay="0.4">
              <div class="relative group flex flex-col items-center text-center">
                <div class="w-16 h-16 rounded-2xl bg-background border-2 border-border flex items-center justify-center mb-6 relative z-10 group-hover:border-foreground/30 transition-colors">
                  <Download class="w-7 h-7" />
                  <span class="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-foreground text-background text-xs font-bold flex items-center justify-center">4</span>
                </div>
                <h3 class="text-lg font-semibold mb-2">{{ t('landing.workflow.step4.title') }}</h3>
                <p class="text-sm text-muted-foreground">{{ t('landing.workflow.step4.description') }}</p>
              </div>
            </AnimatedContent>
          </div>
        </div>
      </div>
    </section>

    <!-- Models Section -->
    <section id="models" class="py-24 md:py-32 border-t border-border">
      <div class="max-w-7xl mx-auto px-6">
        <AnimatedContent
          :distance="40"
          :duration="0.7"
          :delay="0"
          class="text-center mb-16"
        >
          <h2 class="text-3xl md:text-4xl font-bold tracking-tight mb-4">
            {{ t('landing.models.title') }}
          </h2>
          <p class="text-lg text-muted-foreground max-w-2xl mx-auto">
            {{ t('landing.models.subtitle') }}
          </p>
        </AnimatedContent>

        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <AnimatedContent
            v-for="(model, index) in aiModels"
            :key="model.name"
            :distance="30"
            :duration="0.5"
            :delay="0.05 * index"
          >
            <div class="group p-6 rounded-xl border border-border bg-card/50 hover:bg-card hover:border-foreground/20 transition-all duration-300 h-full">
              <div class="flex flex-col items-center text-center">
                <div class="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Icon :icon="model.icon" class="w-6 h-6" />
                </div>
                <span class="font-medium text-sm">{{ model.name }}</span>
                <span class="text-xs text-muted-foreground mt-1">{{ model.provider }}</span>
              </div>
            </div>
          </AnimatedContent>
        </div>
      </div>
    </section>

    <!-- CTA Section -->
    <section class="py-24 md:py-32 border-t border-border bg-muted/30">
      <AnimatedContent
        :distance="40"
        :duration="0.7"
        :delay="0"
        class="max-w-4xl mx-auto px-6 text-center"
      >
        <h2 class="text-3xl md:text-4xl font-bold tracking-tight mb-4">
          {{ t('landing.cta.title') }}
        </h2>
        <p class="text-lg text-muted-foreground mb-10 max-w-2xl mx-auto">
          {{ t('landing.cta.description') }}
        </p>
        <Button as-child size="lg" class="min-w-[200px]">
          <NuxtLink to="/app">
            {{ t('landing.hero.cta.start') }}
            <ArrowRight class="ml-2 w-4 h-4" />
          </NuxtLink>
        </Button>
      </AnimatedContent>
    </section>

    <!-- Footer -->
    <footer class="border-t border-border py-16">
      <div class="max-w-7xl mx-auto px-6">
        <div class="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
          <!-- Brand -->
          <div class="col-span-2 md:col-span-1">
            <div class="flex items-center gap-3 mb-4">
              <img src="/logo.png" alt="ArchMind" class="w-8 h-8 rounded-lg" />
              <span class="font-semibold text-lg">ArchMind</span>
            </div>
            <p class="text-sm text-muted-foreground">
              {{ t('landing.footer.brandDescription') }}
            </p>
          </div>

          <!-- Product -->
          <div>
            <h4 class="font-semibold mb-4">{{ t('landing.footer.product') }}</h4>
            <ul class="space-y-3 text-sm text-muted-foreground">
              <li><a href="#features" class="hover:text-foreground transition-colors">{{ t('landing.footer.links.features') }}</a></li>
              <li><a href="#" class="hover:text-foreground transition-colors">{{ t('landing.footer.links.pricing') }}</a></li>
              <li><a href="#" class="hover:text-foreground transition-colors">{{ t('landing.footer.links.docs') }}</a></li>
            </ul>
          </div>

          <!-- Company -->
          <div>
            <h4 class="font-semibold mb-4">{{ t('landing.footer.company') }}</h4>
            <ul class="space-y-3 text-sm text-muted-foreground">
              <li><a href="#" class="hover:text-foreground transition-colors">{{ t('landing.footer.links.about') }}</a></li>
              <li><a href="#" class="hover:text-foreground transition-colors">{{ t('landing.footer.links.blog') }}</a></li>
              <li><a href="#" class="hover:text-foreground transition-colors">{{ t('landing.footer.links.community') }}</a></li>
            </ul>
          </div>

          <!-- Resources -->
          <div>
            <h4 class="font-semibold mb-4">{{ t('landing.footer.resources') }}</h4>
            <ul class="space-y-3 text-sm text-muted-foreground">
              <li><a href="#" class="hover:text-foreground transition-colors">{{ t('landing.footer.links.api') }}</a></li>
              <li><a href="#" class="hover:text-foreground transition-colors">GitHub</a></li>
              <li><a href="#" class="hover:text-foreground transition-colors">Discord</a></li>
            </ul>
          </div>

          <!-- Legal -->
          <div>
            <h4 class="font-semibold mb-4">{{ t('landing.footer.legal') }}</h4>
            <ul class="space-y-3 text-sm text-muted-foreground">
              <li><a href="#" class="hover:text-foreground transition-colors">{{ t('landing.footer.links.privacy') }}</a></li>
              <li><a href="#" class="hover:text-foreground transition-colors">{{ t('landing.footer.links.terms') }}</a></li>
            </ul>
          </div>
        </div>

        <!-- Copyright -->
        <div class="pt-8 border-t border-border">
          <p class="text-sm text-muted-foreground text-center">
            {{ t('landing.footer.copyright') }}
          </p>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref, h, computed } from 'vue'
import {
  ArrowRight,
  Sparkles,
  Database,
  Brain,
  FileText,
  Layout,
  Upload,
  Search,
  Download,
  Globe,
  Sun,
  Moon
} from 'lucide-vue-next'
import { Icon } from '@iconify/vue'
import { Button } from '~/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '~/components/ui/dropdown-menu'
import ColorBends from '~/components/ui/bits/ColorBends.vue'
import CountUp from '~/components/ui/bits/CountUp.vue'
import AnimatedContent from '~/components/ui/bits/AnimatedContent.vue'
import MagnetButton from '~/components/ui/bits/MagnetButton.vue'

// @ts-expect-error - setLocale is provided by @nuxtjs/i18n at runtime but not typed
const { t, locale, setLocale } = useI18n()
const colorMode = useColorMode()

// Theme toggle
function toggleTheme() {
  colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark'
}

// Language switch
function switchLocale(newLocale: string) {
  setLocale(newLocale)
}

// AI Models data with brand icons from Iconify
const aiModels = [
  { name: 'Claude', provider: 'Anthropic', icon: 'simple-icons:claude' },
  { name: 'GPT-4', provider: 'OpenAI', icon: 'simple-icons:openai' },
  { name: 'Gemini', provider: 'Google', icon: 'simple-icons:googlegemini' },
  { name: 'Qwen', provider: 'Alibaba', icon: 'simple-icons:alibabacloud' },
  { name: 'Wenxin', provider: 'Baidu', icon: 'simple-icons:baidu' },
  { name: 'DeepSeek', provider: 'DeepSeek', icon: 'ri:deepseek-fill' },
  { name: 'GLM', provider: 'Zhipu', icon: 'fluent:brain-circuit-24-filled' },
  { name: 'Ollama', provider: 'Local', icon: 'simple-icons:ollama' }
]

// Set page meta - no layout, no auth required
definePageMeta({
  layout: false
})

// Make this the default page at /
// When user visits /, they see the landing page
// When logged in user goes to /app, they see dashboard

// SEO with i18n support
const seoTitle = computed(() => 'ArchMind AI - ' + t('app.tagline'))
const seoDescription = computed(() => t('landing.hero.description'))

useHead({
  title: seoTitle,
  meta: [
    { name: 'description', content: seoDescription }
  ]
})
</script>

<style scoped>
.landing-page {
  /* Smooth scrolling */
  scroll-behavior: smooth;
}

/* Custom scrollbar */
.landing-page::-webkit-scrollbar {
  width: 8px;
}

.landing-page::-webkit-scrollbar-track {
  background: transparent;
}

.landing-page::-webkit-scrollbar-thumb {
  background: hsl(var(--border));
  border-radius: 4px;
}

.landing-page::-webkit-scrollbar-thumb:hover {
  background: hsl(var(--muted-foreground) / 0.5);
}
</style>
