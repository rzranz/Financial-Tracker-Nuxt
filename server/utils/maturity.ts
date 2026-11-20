import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, InvestmentRecord } from '~/types/database'
import { formatIDR, todayUTC } from '~/utils/finance'

export interface MaturitySyncResult {
  maturedCount: number
  notificationsCreated: number
  maturedIds: string[]
}

/**
 * Transitions due active investments (maturity_date <= todayUTC) to 'matured'
 * and emits internal notifications for contracts that have not generated a reminder yet.
 * Works safely with either a user RLS-scoped client or the Cron service-role client.
 */
export async function processDueInvestments(
  supabase: SupabaseClient<Database>,
  options?: { userId?: string; referenceDate?: string }
): Promise<MaturitySyncResult> {
  const referenceDate = options?.referenceDate ?? todayUTC()

  let query = supabase
    .from('investments')
    .select('*')
    .eq('status', 'active')
    .lte('maturity_date', referenceDate)

  if (options?.userId) {
    query = query.eq('user_id', options.userId)
  }

  const { data: dueInvestments, error: fetchError } = await query

  if (fetchError) {
    throw createError({
      statusCode: 500,
      statusMessage: `Failed to scan due investments: ${fetchError.message}`
    })
  }

  const rows = (dueInvestments ?? []) as InvestmentRecord[]
  if (rows.length === 0) {
    return { maturedCount: 0, notificationsCreated: 0, maturedIds: [] }
  }

  const maturedIds: string[] = []
  let notificationsCreated = 0

  for (const inv of rows) {
    // Conditional atomic transition from 'active' -> 'matured' prevents duplicate notifications
    const { data: updated, error: updateError } = await supabase
      .from('investments')
      .update({
        status: 'matured',
        reminder_generated: true
      })
      .eq('id', inv.id)
      .eq('status', 'active')
      .select('*')
      .maybeSingle()

    if (updateError || !updated) {
      continue
    }

    maturedIds.push(inv.id)

    if (!inv.reminder_generated) {
      const principalFormatted = formatIDR(inv.principal_amount)
      const profitFormatted = formatIDR(inv.expected_profit_amount)
      const { error: notifError } = await supabase.from('notifications').insert({
        user_id: inv.user_id,
        investment_id: inv.id,
        title: `Kontrak Jatuh Tempo: ${inv.title}`,
        message: `Pokok ${principalFormatted} + estimasi imbal hasil ${profitFormatted} telah jatuh tempo pada ${inv.maturity_date}. Siap dicairkan ke Kas Likuid.`,
        is_read: false
      })

      if (!notifError) {
        notificationsCreated += 1
      }
    }
  }

  return {
    maturedCount: maturedIds.length,
    notificationsCreated,
    maturedIds
  }
}
