import { betterAuth } from 'better-auth'
import type { H3Event } from 'h3'

export function getAuth(event: H3Event) {
  const { cloudflare } = event.context
  const config = useRuntimeConfig(event)

  if (!config.betterAuthSecret) {
    throw new Error('BETTER_AUTH_SECRET is not set. Configure it as an environment variable.')
  }

  return betterAuth({
    database: cloudflare.env.DB,
    secret: config.betterAuthSecret,
    baseURL: config.betterAuthUrl,
    emailAndPassword: {
      enabled: true,
    },
  })
}
