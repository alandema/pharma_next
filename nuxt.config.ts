import { fileURLToPath } from 'url'

export default defineNuxtConfig({
  modules: ['@nuxt/content'],

  alias: {
    '~prisma/client': fileURLToPath(new URL('./generated/prisma', import.meta.url))
  },

  ssr: false,
  
  // Enable source maps for debugging
  sourcemap: {
    server: true,
    client: true
  },

  vite: {
    build: {
      sourcemap: true
    }
  }
})