import { requireAuthContext } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const { userId, client } = await requireAuthContext(event)

  const { error } = await client
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', userId)
    .eq('is_read', false)

  if (error) {
    throw createError({ statusCode: 500, statusMessage: error.message })
  }

  return { ok: true }
})
