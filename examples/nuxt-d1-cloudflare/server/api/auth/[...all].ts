import { getAuth } from '~/server/lib/auth'

export default defineEventHandler((event) => {
  const auth = getAuth(event)
  return auth.handler(toWebRequest(event))
})
