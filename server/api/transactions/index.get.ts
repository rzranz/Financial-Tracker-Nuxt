import { requireAuthContext } from '~/server/utils/auth'
import type { TransactionType } from '~/types/database'

const VALID_TYPES: TransactionType[] = ['income', 'expense', 'investment_out', 'investment_in']

export default defineEventHandler(async (event) => {
  const { userId, client } = await requireAuthContext(event)
  const query = getQuery(event)

  const typeFilter = typeof query.type === 'string' ? query.type : ''
  const search = typeof query.q === 'string' ? query.q.trim() : ''
  const limit = Math.min(Math.max(Number(query.limit) || 50, 1), 200)

  let req = client
    .from('transactions')
    .select('*')
    .eq('user_id', userId)
    .order('transaction_date', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(limit)

  if (VALID_TYPES.includes(typeFilter as TransactionType)) {
    req = req.eq('type', typeFilter as TransactionType)
  }

  if (search) {
    req = req.or(`category.ilike.%${search}%,note.ilike.%${search}%`)
  }

  const { data, error } = await req
  if (error) {
    throw createError({ statusCode: 500, statusMessage: error.message })
  }

  return data ?? []
})
