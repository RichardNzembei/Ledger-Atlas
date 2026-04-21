export default defineNuxtConfig({
  compatibilityDate: '2026-01-01',

  srcDir: 'app',

  modules: [
    '@pinia/nuxt',
    '@nuxt/ui',
    '@vueuse/nuxt',
    '@vee-validate/nuxt',
    '@nuxtjs/i18n',
  ],

  runtimeConfig: {
    public: {
      apiBase: process.env['NUXT_PUBLIC_API_BASE'] ?? 'http://localhost:4000',
      appName: process.env['NUXT_PUBLIC_APP_NAME'] ?? 'Inventory Platform',
    },
  },

  typescript: {
    strict: true,
    typeCheck: false,
  },

  experimental: {
    typedPages: true,
    appManifest: false,
  },

  ui: {
    global: true,
    icons: ['lucide', 'heroicons'],
  },

  i18n: {
    defaultLocale: 'en',
    locales: [
      { code: 'en', name: 'English', file: 'en.json' },
      { code: 'sw', name: 'Kiswahili', file: 'sw.json' },
    ],
    langDir: 'locales',
    strategy: 'prefix_except_default',
  },

  colorMode: {
    preference: 'system',
    fallback: 'light',
    classSuffix: '',
  },
});
