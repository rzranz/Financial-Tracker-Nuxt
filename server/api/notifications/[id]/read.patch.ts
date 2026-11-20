import { requireAuthContext } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const { userId, client } = await requireAuthContext(event)
  const id = getRouterParam(event, 'id')

  if (!id || !/^[0-9a-f-]{36}$/i.test(id)) {
    throw createError({ statusCode: 400, statusMessage: 'ID notifikasi tidak valid' })
  }

  const { data, error } = await client
    .from('notifications')
    .update({ is_read: true })
    .eq('id', id)
    .eq('user_id', userId)
    .select('*')
    .maybeSingle()

  if (error) {
    throw createError({ statusCode: 500, statusMessage: error.message })
  }

  if (!data) {
    throw createError({ statusCode: 404, statusMessage: 'Notifikasi tidak ditemukan' })
  }

  return data
})
