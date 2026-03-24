import { authClient } from '~/lib/auth-client'

export default defineNuxtRouteMiddleware(async (to) => {
  const { data: session } = await authClient.useSession(useFetch)

  if (!session.value && to.path === '/dashboard') {
    return navigateTo('/login')
  }

  if (session.value && (to.path === '/login' || to.path === '/signup')) {
    return navigateTo('/dashboard')
  }
})
