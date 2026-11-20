import { requireAuthContext } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const { userId, client } = await requireAuthContext(event)

  const { data, error } = await client
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) {
    throw createError({ statusCode: 500, statusMessage: error.message })
  }

  return data ?? []
})
