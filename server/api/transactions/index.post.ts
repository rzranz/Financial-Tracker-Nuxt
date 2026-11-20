import Decimal from 'decimal.js'
import { requireAuthContext } from '~/server/utils/auth'
import { createTransactionSchema } from '~/server/utils/validation'

export default defineEventHandler(async (event) => {
  const { userId, client } = await requireAuthContext(event)
  const body = await readBody(event)

  const parsed = createTransactionSchema.safeParse(body)
  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: parsed.error.issues[0]?.message || 'Data transaksi tidak valid'
    })
  }

  const normalizedAmount = new Decimal(parsed.data.amount)
    .toDecimalPlaces(2, Decimal.ROUND_HALF_UP)
    .toFixed(2)

  const txDate = parsed.data.transaction_date
    ? parsed.data.transaction_date.length === 10
      ? `${parsed.data.transaction_date}T00:00:00.000Z`
      : parsed.data.transaction_date
    : new Date().toISOString()

  const { data, error } = await client
    .from('transactions')
    .insert({
      user_id: userId,
      type: parsed.data.type,
      category: parsed.data.category,
      amount: normalizedAmount,
      note: parsed.data.note || null,
      transaction_date: txDate
    })
    .select('*')
    .single()

  if (error) {
    throw createError({ statusCode: 500, statusMessage: error.message })
  }

  return data
})
