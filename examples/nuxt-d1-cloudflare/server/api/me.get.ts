import { getAuth } from '~/server/lib/auth'

export default defineEventHandler(async (event) => {
  const auth = getAuth(event)
  const session = await auth.api.getSession({
    headers: event.headers,
  })

  if (!session) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  return { user: session.user }
})
