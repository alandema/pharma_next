import { fileURLToPath } from 'url'

const requireEnv = (name: string): string => {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }
  return value
}

export default defineNuxtConfig({
  modules: ['@nuxt/content'],

  runtimeConfig: {
    databaseUrl: requireEnv('DATABASE_URL'),
    jwtSecret: requireEnv('JWT_SECRET'),
    jwtExpires: requireEnv('JWT_EXPIRES'),
    sendgridApiKey: requireEnv('SENDGRID_API_KEY'),
    alwaysSendEmails: requireEnv('ALWAYS_SEND_EMAILS'),
    blobReadWriteToken: requireEnv('BLOB_READ_WRITE_TOKEN'),
    // safeidClientId: requireEnv('SAFEID_CLIENT_ID'),
    // safeidClientSecret: requireEnv('SAFEID_CLIENT_SECRET'),
    // safeidRedirectUri: requireEnv('SAFEID_REDIRECT_URI'),
    // activationTokenSecret: requireEnv('ACTIVATION_TOKEN_SECRET'),
    // activationBaseUrl: requireEnv('ACTIVATION_BASE_URL'),
    public: {
      nodeEnv: requireEnv('NODE_ENV')
    }
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