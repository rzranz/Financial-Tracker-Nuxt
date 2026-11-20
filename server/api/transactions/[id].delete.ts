import { requireAuthContext } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const { userId, client } = await requireAuthContext(event)
  const id = getRouterParam(event, 'id')

  if (!id || !/^[0-9a-f-]{36}$/i.test(id)) {
    throw createError({ statusCode: 400, statusMessage: 'ID transaksi tidak valid' })
  }

  const { data, error } = await client
    .from('transactions')
    .delete()
    .eq('id', id)
    .eq('user_id', userId)
    .select('id')
    .maybeSingle()

  if (error) {
    throw createError({ statusCode: 500, statusMessage: error.message })
  }

  if (!data) {
    throw createError({ statusCode: 404, statusMessage: 'Transaksi tidak ditemukan' })
  }

  return { deleted: true, id: data.id }
})
