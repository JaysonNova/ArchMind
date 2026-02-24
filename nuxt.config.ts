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
      },
      {
        code: 'zh',
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
      alwaysRedirect: true
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

    // Email configuration (server-side only)
    emailHost: process.env.EMAIL_HOST || 'smtp.qq.com',
    emailPort: parseInt(process.env.EMAIL_PORT || '465'),
    emailSecure: process.env.EMAIL_SECURE !== 'false',
    emailUser: process.env.EMAIL_USER,
    emailPass: process.env.EMAIL_PASS,
    emailFrom: process.env.EMAIL_FROM || process.env.EMAIL_USER,

    // Public keys (exposed to client)
    public: {
      appUrl: process.env.APP_URL || 'http://localhost:3000',
      baseUrl: process.env.BASE_URL || process.env.APP_URL || 'http://localhost:3000'
    }
  },

  nitro: {
    preset: process.env.VERCEL ? 'vercel' : 'node-server'
  },

  compatibilityDate: '2024-01-01'
})
