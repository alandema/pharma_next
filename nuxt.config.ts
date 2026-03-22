import { fileURLToPath } from 'url'

export default defineNuxtConfig({
  modules: ['@nuxt/content'],

  runtimeConfig: {
    activationTokenSecret: '',
    activationBaseUrl: '',
  },

  css: ['~/assets/css/main.css'],

  alias: {
    '~prisma/client': fileURLToPath(new URL('./generated/prisma', import.meta.url))
  },

  ssr: false,

  app: {
    head: {
      link: [
        { rel: 'icon', type: 'image/png', href: '/favicon.png' },
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Playfair+Display:wght@600;700&display=swap' }
      ]
    }
  },

  sourcemap: { server: true, client: true },

  vite: {
    build: { sourcemap: true }
  }
})