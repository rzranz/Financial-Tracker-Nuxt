import { requireAuthContext } from '~/server/utils/auth'
import { processDueInvestments } from '~/server/utils/maturity'
import { computeFinancialSummary } from '~/utils/finance'

export default defineEventHandler(async (event) => {
  const { userId, client } = await requireAuthContext(event)

  // Client check per State Machine 4.2: ensure due active contracts transition on load
  await processDueInvestments(client, { userId })

  const [txRes, invRes, notifRes] = await Promise.all([
    client.from('transactions').select('type, amount').eq('user_id', userId),
    client
      .from('investments')
      .select('status, principal_amount, expected_return_pct, expected_profit_amount')
      .eq('user_id', userId),
    client
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false)
  ])

  if (txRes.error) {
    throw createError({ statusCode: 500, statusMessage: txRes.error.message })
  }
  if (invRes.error) {
    throw createError({ statusCode: 500, statusMessage: invRes.error.message })
  }
  if (notifRes.error) {
    throw createError({ statusCode: 500, statusMessage: notifRes.error.message })
  }

  return computeFinancialSummary(
    txRes.data ?? [],
    invRes.data ?? [],
    notifRes.count ?? 0
  )
})
