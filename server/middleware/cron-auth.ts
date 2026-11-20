import { timingSafeEqual } from 'node:crypto'

export default defineEventHandler((event) => {
  const path = event.path || ''
  if (!path.startsWith('/api/cron/')) {
    return
  }

  const config = useRuntimeConfig(event)
  const expectedSecret = config.cronSecret

  if (!expectedSecret) {
    throw createError({
      statusCode: 500,
      statusMessage: 'CRON_SECRET is not configured on the server'
    })
  }

  const authHeader = getHeader(event, 'authorization') || ''
  const expectedHeader = `Bearer ${expectedSecret}`

  const authBuf = Buffer.from(authHeader, 'utf8')
  const expectedBuf = Buffer.from(expectedHeader, 'utf8')

  if (authBuf.length !== expectedBuf.length || !timingSafeEqual(authBuf, expectedBuf)) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized cron trigger: invalid Bearer signature'
    })
  }
})
