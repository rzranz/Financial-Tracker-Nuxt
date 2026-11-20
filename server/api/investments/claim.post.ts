import Decimal from 'decimal.js'
import { requireAuthContext } from '~/server/utils/auth'
import { claimInvestmentSchema } from '~/server/utils/validation'
import { computeExpectedProfit } from '~/utils/finance'

export default defineEventHandler(async (event) => {
  const { userId, client } = await requireAuthContext(event)
  const body = await readBody(event)

  const parsed = claimInvestmentSchema.safeParse(body)
  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: parsed.error.issues[0]?.message || 'Payload claim tidak valid'
    })
  }

  const { investmentId } = parsed.data

  // Step 1: Verify investment state before claiming (PRD Section 4.5 Double Claiming mitigation)
  const { data: existing, error: fetchError } = await client
    .from('investments')
    .select('*')
    .eq('id', investmentId)
    .eq('user_id', userId)
    .maybeSingle()

  if (fetchError) {
    throw createError({ statusCode: 500, statusMessage: fetchError.message })
  }

  if (!existing) {
    throw createError({ statusCode: 404, statusMessage: 'Kontrak investasi tidak ditemukan' })
  }

  if (existing.status === 'claimed') {
    throw createError({
      statusCode: 409,
      statusMessage: 'Kontrak investasi ini sudah pernah dicairkan (claimed)'
    })
  }

  if (existing.status !== 'matured') {
    throw createError({
      statusCode: 400,
      statusMessage: 'Kontrak investasi belum jatuh tempo (status masih active)'
    })
  }

  // Step 2: Atomic conditional update ensuring status != 'claimed'
  const { data: claimedInv, error: updateError } = await client
    .from('investments')
    .update({ status: 'claimed' })
    .eq('id', investmentId)
    .eq('user_id', userId)
    .neq('status', 'claimed')
    .eq('status', 'matured')
    .select('*')
    .maybeSingle()

  if (updateError) {
    throw createError({ statusCode: 500, statusMessage: updateError.message })
  }

  if (!claimedInv) {
    throw createError({
      statusCode: 409,
      statusMessage: 'Kontrak gagal diklaim karena status berubah secara bersamaan'
    })
  }

  // Step 3: Compute total settlement = principal + expected_profit_amount with exact Decimal math
  const principal = new Decimal(claimedInv.principal_amount)
  const profit =
    claimedInv.expected_profit_amount !== null && claimedInv.expected_profit_amount !== undefined
      ? new Decimal(claimedInv.expected_profit_amount)
      : new Decimal(computeExpectedProfit(claimedInv.principal_amount, claimedInv.expected_return_pct))

  const totalPayout = principal
    .plus(profit)
    .toDecimalPlaces(2, Decimal.ROUND_HALF_UP)
    .toFixed(2)

  // Step 4: Credit Liquid Cash via investment_in transaction
  const { data: settlementTx, error: txError } = await client
    .from('transactions')
    .insert({
      user_id: userId,
      type: 'investment_in',
      category: 'Investment Settlement',
      amount: totalPayout,
      note: `Pencairan ${claimedInv.title} (Pokok + Imbal Hasil)`,
      transaction_date: new Date().toISOString()
    })
    .select('*')
    .single()

  if (txError || !settlementTx) {
    // Compensating rollback if cash ledger insertion fails
    await client
      .from('investments')
      .update({ status: 'matured' })
      .eq('id', investmentId)
      .eq('user_id', userId)
      .eq('status', 'claimed')

    throw createError({
      statusCode: 500,
      statusMessage: `Gagal mencatat mutasi pencairan kas: ${txError?.message || 'Unknown error'}`
    })
  }

  // Mark related notifications as read
  await client
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', userId)
    .eq('investment_id', investmentId)

  return {
    investment: claimedInv,
    transaction: settlementTx,
    payout: {
      principal: principal.toFixed(2),
      profit: profit.toFixed(2),
      total: totalPayout
    }
  }
})
