import { requireAuthContext } from '~/server/utils/auth'
import { processDueInvestments } from '~/server/utils/maturity'
import type { InvestmentStatus } from '~/types/database'

const VALID_STATUSES: InvestmentStatus[] = ['active', 'matured', 'claimed']

export default defineEventHandler(async (event) => {
  const { userId, client } = await requireAuthContext(event)
  const query = getQuery(event)
  const statusFilter = typeof query.status === 'string' ? query.status : ''

  // Client check: promote any active contracts whose maturity_date <= today
  await processDueInvestments(client, { userId })

  let req = client
    .from('investments')
    .select('*')
    .eq('user_id', userId)
    .order('maturity_date', { ascending: true })
    .order('created_at', { ascending: false })

  if (VALID_STATUSES.includes(statusFilter as InvestmentStatus)) {
    req = req.eq('status', statusFilter as InvestmentStatus)
  }

  const { data, error } = await req
  if (error) {
    throw createError({ statusCode: 500, statusMessage: error.message })
  }

  return data ?? []
})
