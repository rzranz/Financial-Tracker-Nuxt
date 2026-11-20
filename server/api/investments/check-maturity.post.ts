import { requireAuthContext } from '~/server/utils/auth'
import { processDueInvestments } from '~/server/utils/maturity'

export default defineEventHandler(async (event) => {
  const { userId, client } = await requireAuthContext(event)
  return await processDueInvestments(client, { userId })
})
