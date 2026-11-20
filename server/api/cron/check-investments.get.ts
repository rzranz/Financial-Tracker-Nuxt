import { serverSupabaseServiceRole } from '#supabase/server'
import { processDueInvestments } from '~/server/utils/maturity'
import type { Database } from '~/types/database'

export default defineEventHandler(async (event) => {
  // Authorization header is strictly validated in server/middleware/cron-auth.ts
  const serviceClient = serverSupabaseServiceRole<Database>(event)
  const result = await processDueInvestments(serviceClient)

  return {
    ok: true,
    executedAt: new Date().toISOString(),
    ...result
  }
})
