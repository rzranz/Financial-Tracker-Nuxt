import Decimal from 'decimal.js'
import { requireAuthContext } from '~/server/utils/auth'
import { createInvestmentSchema } from '~/server/utils/validation'
import { addDaysUTC, computeFinancialSummary, todayUTC } from '~/utils/finance'

export default defineEventHandler(async (event) => {
  const { userId, client } = await requireAuthContext(event)
  const body = await readBody(event)

  const parsed = createInvestmentSchema.safeParse(body)
  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: parsed.error.issues[0]?.message || 'Data kontrak investasi tidak valid'
    })
  }

  const principal = new Decimal(parsed.data.principal_amount)
    .toDecimalPlaces(2, Decimal.ROUND_HALF_UP)
  const returnPct = new Decimal(parsed.data.expected_return_pct)
    .toDecimalPlaces(2, Decimal.ROUND_HALF_UP)

  if (parsed.data.deduct_from_cash) {
    const { data: txRows, error: txFetchError } = await client
      .from('transactions')
      .select('type, amount')
      .eq('user_id', userId)

    if (txFetchError) {
      throw createError({ statusCode: 500, statusMessage: txFetchError.message })
    }

    const summary = computeFinancialSummary(txRows ?? [], [])
    const currentLiquid = new Decimal(summary.liquidCash)
    if (currentLiquid.lt(principal)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Saldo Kas Likuid tidak mencukupi untuk pemotongan modal kontrak ini'
      })
    }
  }

  const startDate = parsed.data.start_date ?? todayUTC()
  const maturityDate = addDaysUTC(startDate, parsed.data.duration_days)
  const initialStatus = maturityDate <= todayUTC() ? 'matured' : 'active'

  const { data: investment, error: insertError } = await client
    .from('investments')
    .insert({
      user_id: userId,
      title: parsed.data.title,
      principal_amount: principal.toFixed(2),
      expected_return_pct: returnPct.toFixed(2),
      duration_days: parsed.data.duration_days,
      start_date: startDate,
      maturity_date: maturityDate,
      status: initialStatus,
      reminder_generated: initialStatus === 'matured'
    })
    .select('*')
    .single()

  if (insertError || !investment) {
    throw createError({
      statusCode: 500,
      statusMessage: insertError?.message || 'Gagal menyimpan kontrak investasi'
    })
  }

  let cashTransaction = null
  if (parsed.data.deduct_from_cash) {
    const { data: txData, error: txInsertError } = await client
      .from('transactions')
      .insert({
        user_id: userId,
        type: 'investment_out',
        category: 'Investment Placement',
        amount: principal.toFixed(2),
        note: `Penempatan kontrak: ${parsed.data.title}`,
        transaction_date: new Date().toISOString()
      })
      .select('*')
      .single()

    if (txInsertError) {
      // Compensating rollback to keep ledger and investment contracts atomic
      await client.from('investments').delete().eq('id', investment.id).eq('user_id', userId)
      throw createError({
        statusCode: 500,
        statusMessage: `Gagal memotong Kas Likuid: ${txInsertError.message}`
      })
    }
    cashTransaction = txData
  }

  if (initialStatus === 'matured') {
    await client.from('notifications').insert({
      user_id: userId,
      investment_id: investment.id,
      title: `Kontrak Jatuh Tempo: ${investment.title}`,
      message: `Kontrak telah mencapai tanggal jatuh tempo (${maturityDate}) dan siap dicairkan.`,
      is_read: false
    })
  }

  return {
    investment,
    cashTransaction
  }
})
