// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },

  app: {
    head: {
      title: 'ArchMind AI',
      meta: [
        { name: 'description', content: 'Transform ideas into deliverables with RAG-based AI reasoning' }
      ],
      link: [
        { rel: 'icon', type: 'image/png', href: '/logo.png' }
      ]
    }
  },

  modules: [
    '@nuxtjs/tailwindcss',
    '@nuxtjs/color-mode',
    '@pinia/nuxt',
    '@vueuse/nuxt',
    '@nuxtjs/i18n'
  ],

  i18n: {
    locales: [
      {
        code: 'en',
        name: 'English',
        file: 'en.json'
      },
      {
        code: 'zh-CN',
        name: '简体中文',
        file: 'zh-CN.json'
      }
    ],
    defaultLocale: 'zh-CN',
    strategy: 'no_prefix',
    langDir: 'lang',
    detectBrowserLanguage: {
      useCookie: true,
      cookieKey: 'i18n_locale',
      redirectOn: 'root',
      alwaysRedirect: false
    },
    compilation: {
      strictMessage: false,
      escapeHtml: false
    }
  },

  components: [
    {
      path: '~/components',
      pathPrefix: false,
      // Ignore index.ts files in ui components to prevent naming conflicts
      ignore: ['**/ui/**/index.ts']
    }
  ],

  css: ['~/assets/css/main.css'],

  colorMode: {
    classSuffix: ''
  },

  typescript: {
    strict: true,
    typeCheck: false
  },

  postcss: {
    plugins: {
      tailwindcss: {},
      autoprefixer: {}
    }
  },

  runtimeConfig: {
    // Private keys (server-side only)
    anthropicApiKey: process.env.ANTHROPIC_API_KEY,
    openaiApiKey: process.env.OPENAI_API_KEY,
    googleApiKey: process.env.GOOGLE_API_KEY,
    glmApiKey: process.env.GLM_API_KEY,
    dashscopeApiKey: process.env.DASHSCOPE_API_KEY,
    baiduApiKey: process.env.BAIDU_API_KEY,
    deepseekApiKey: process.env.DEEPSEEK_API_KEY,
    ollamaBaseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
    databasePath: process.env.DATABASE_PATH || './data/database.db',

    // Public keys (exposed to client)
    public: {
      appUrl: process.env.APP_URL || 'http://localhost:3000'
    }
  },

  nitro: {
    preset: 'node-server'
  },

  compatibilityDate: '2024-01-01'
})
