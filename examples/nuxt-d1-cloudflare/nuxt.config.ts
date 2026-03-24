export default defineNuxtConfig({
  compatibilityDate: '2025-03-24',

  nitro: {
    preset: 'cloudflare-pages',
  },

  runtimeConfig: {
    betterAuthSecret: process.env.BETTER_AUTH_SECRET || '',
    betterAuthUrl: process.env.BETTER_AUTH_URL || 'http://localhost:3000',
  },
})
