export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: false },

  modules: [
    '@nuxtjs/tailwindcss',
    '@nuxtjs/supabase'
  ],

  css: ['~/assets/css/main.css'],

  app: {
    head: {
      title: 'FinVault — Real-Time Cash & Investment Ledger',
      htmlAttrs: {
        lang: 'id',
        class: 'dark'
      },
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        {
          name: 'description',
          content:
            'Personal finance engine berbasis real-time cash ledger dan contract-based investment tracking dengan presisi NUMERIC(15,2).'
        },
        { name: 'theme-color', content: '#070B14' }
      ],
      link: [
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&display=swap'
        }
      ]
    }
  },

  runtimeConfig: {
    cronSecret: process.env.CRON_SECRET || '',
    public: {
      appName: 'FinVault'
    }
  },

  supabase: {
    url: process.env.SUPABASE_URL,
    key: process.env.SUPABASE_KEY,
    serviceKey: process.env.SUPABASE_SERVICE_KEY,
    redirectOptions: {
      login: '/login',
      callback: '/confirm',
      include: undefined,
      exclude: ['/login', '/register', '/confirm'],
      cookieRedirect: false
    }
  },

  typescript: {
    strict: true
  }
})
