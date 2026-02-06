import { fileURLToPath } from 'url'

export default defineNuxtConfig({
  alias: {
    '~prisma/client': fileURLToPath(new URL('./generated/prisma', import.meta.url))
  },
  
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