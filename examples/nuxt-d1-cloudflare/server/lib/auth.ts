import { betterAuth } from 'better-auth'
import type { H3Event } from 'h3'

export function getAuth(event: H3Event) {
  const { cloudflare } = event.context
  const config = useRuntimeConfig(event)

  return betterAuth({
    database: cloudflare.env.DB,
    secret: config.betterAuthSecret,
    baseURL: config.betterAuthUrl,
    emailAndPassword: {
      enabled: true,
    },
  })
}
