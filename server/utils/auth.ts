import type { H3Event } from 'h3'
import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'
import type { Database } from '~/types/database'

export async function requireAuthContext(event: H3Event) {
  let user: Awaited<ReturnType<typeof serverSupabaseUser>> = null
  try {
    user = await serverSupabaseUser(event)
  } catch {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized: invalid or expired session'
    })
  }

  const userId = user?.id ?? (user as { sub?: string } | null)?.sub
  if (!user || !userId) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized: authentication required'
    })
  }

  const client = await serverSupabaseClient<Database>(event)
  return { userId, user, client }
}
