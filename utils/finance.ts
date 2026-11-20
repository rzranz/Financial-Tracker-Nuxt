import Decimal from 'decimal.js'
import type {
  FinancialSummary,
  InvestmentRecord,
  TransactionRecord
} from '~/types/database'

// Configure Decimal for deterministic financial precision (no floating-point drift)
Decimal.set({
  precision: 28,
  rounding: Decimal.ROUND_HALF_UP
})

export function toDecimal(value: string | number | Decimal | null | undefined): Decimal {
  if (value === null || value === undefined || value === '') {
    return new Decimal(0)
  }
  return new Decimal(value)
}

/**
 * Computes PostgreSQL-equivalent expected_profit_amount:
 * ROUND(principal_amount * (expected_return_pct / 100.0), 2)
 */
export function computeExpectedProfit(
  principalAmount: string | number,
  expectedReturnPct: string | number
): string {
  const principal = toDecimal(principalAmount)
  const pct = toDecimal(expectedReturnPct)
  return principal
    .times(pct.div(100))
    .toDecimalPlaces(2, Decimal.ROUND_HALF_UP)
    .toFixed(2)
}

/**
 * Computes annualized APR equivalent for reference: (returnPct / durationDays) * 365
 */
export function computeAnnualizedYieldPct(
  expectedReturnPct: string | number,
  durationDays: number
): string {
  if (!durationDays || durationDays <= 0) return '0.00'
  return toDecimal(expectedReturnPct)
    .div(durationDays)
    .times(365)
    .toDecimalPlaces(2, Decimal.ROUND_HALF_UP)
    .toFixed(2)
}

/**
 * Computes FinVault PRD Section 1.5 Financial Mathematical Model:
 * 1. Cl = sum(T_income) + sum(T_investment_in) - sum(T_expense) - sum(T_investment_out)
 * 2. Pl = sum(I_active.principal) + sum(I_matured.principal)
 * 3. Rp = sum(I_active.principal * (I_active.return_pct / 100))
 * 4. Np = Cl + Pl + Rp
 */
export function computeFinancialSummary(
  transactions: Pick<TransactionRecord, 'type' | 'amount'>[],
  investments: Pick<
    InvestmentRecord,
    'status' | 'principal_amount' | 'expected_return_pct' | 'expected_profit_amount'
  >[],
  unreadNotifications = 0
): FinancialSummary {
  let totalIncome = new Decimal(0)
  let totalExpense = new Decimal(0)
  let totalInvestmentIn = new Decimal(0)
  let totalInvestmentOut = new Decimal(0)

  for (const tx of transactions) {
    const amt = toDecimal(tx.amount)
    switch (tx.type) {
      case 'income':
        totalIncome = totalIncome.plus(amt)
        break
      case 'expense':
        totalExpense = totalExpense.plus(amt)
        break
      case 'investment_in':
        totalInvestmentIn = totalInvestmentIn.plus(amt)
        break
      case 'investment_out':
        totalInvestmentOut = totalInvestmentOut.plus(amt)
        break
    }
  }

  const liquidCash = totalIncome
    .plus(totalInvestmentIn)
    .minus(totalExpense)
    .minus(totalInvestmentOut)
    .toDecimalPlaces(2, Decimal.ROUND_HALF_UP)

  let lockedPrincipal = new Decimal(0)
  let projectedProfit = new Decimal(0)
  let maturedProfit = new Decimal(0)
  let activeCount = 0
  let maturedCount = 0
  let claimedCount = 0

  for (const inv of investments) {
    const principal = toDecimal(inv.principal_amount)
    const profit =
      inv.expected_profit_amount !== undefined && inv.expected_profit_amount !== null
        ? toDecimal(inv.expected_profit_amount)
        : toDecimal(computeExpectedProfit(inv.principal_amount, inv.expected_return_pct))

    if (inv.status === 'active') {
      activeCount += 1
      lockedPrincipal = lockedPrincipal.plus(principal)
      projectedProfit = projectedProfit.plus(profit)
    } else if (inv.status === 'matured') {
      maturedCount += 1
      lockedPrincipal = lockedPrincipal.plus(principal)
      maturedProfit = maturedProfit.plus(profit)
    } else if (inv.status === 'claimed') {
      claimedCount += 1
    }
  }

  const projectedNetWorth = liquidCash
    .plus(lockedPrincipal)
    .plus(projectedProfit)
    .toDecimalPlaces(2, Decimal.ROUND_HALF_UP)

  return {
    liquidCash: liquidCash.toFixed(2),
    lockedPrincipal: lockedPrincipal.toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toFixed(2),
    projectedProfit: projectedProfit.toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toFixed(2),
    maturedProfit: maturedProfit.toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toFixed(2),
    projectedNetWorth: projectedNetWorth.toFixed(2),
    totalIncome: totalIncome.toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toFixed(2),
    totalExpense: totalExpense.toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toFixed(2),
    totalInvestmentIn: totalInvestmentIn.toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toFixed(2),
    totalInvestmentOut: totalInvestmentOut.toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toFixed(2),
    activeCount,
    maturedCount,
    claimedCount,
    unreadNotifications
  }
}

/**
 * Formats a decimal string or number as Indonesian Rupiah (IDR) without float conversion drift.
 */
export function formatIDR(value: string | number | null | undefined, withDecimals = false): string {
  const dec = toDecimal(value).toDecimalPlaces(withDecimals ? 2 : 0, Decimal.ROUND_HALF_UP)
  const isNeg = dec.isNegative()
  const absStr = dec.abs().toFixed(withDecimals ? 2 : 0)
  const [intPart, decPart] = absStr.split('.')
  const grouped = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  const formatted = withDecimals && decPart ? `${grouped},${decPart}` : grouped
  return `${isNeg ? '-' : ''}Rp ${formatted}`
}

/**
 * Formats ISO date string (YYYY-MM-DD or TIMESTAMPTZ) into readable ID locale date.
 */
export function formatDateID(dateStr: string): string {
  if (!dateStr) return '-'
  const parsed = new Date(dateStr.length === 10 ? `${dateStr}T00:00:00Z` : dateStr)
  if (Number.isNaN(parsed.getTime())) return dateStr
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: dateStr.length === 10 ? 'UTC' : undefined
  }).format(parsed)
}

/**
 * Computes UTC YYYY-MM-DD maturity date from startDate + durationDays.
 */
export function addDaysUTC(startDate: string, durationDays: number): string {
  const base = new Date(`${startDate}T00:00:00Z`)
  base.setUTCDate(base.getUTCDate() + durationDays)
  return base.toISOString().slice(0, 10)
}

/**
 * Returns today's UTC YYYY-MM-DD date string.
 */
export function todayUTC(): string {
  return new Date().toISOString().slice(0, 10)
}

/**
 * Returns days remaining until maturity_date (negative if past due).
 */
export function daysUntilMaturity(maturityDate: string, referenceDate = todayUTC()): number {
  const m = new Date(`${maturityDate.slice(0, 10)}T00:00:00Z`).getTime()
  const r = new Date(`${referenceDate.slice(0, 10)}T00:00:00Z`).getTime()
  return Math.round((m - r) / (1000 * 60 * 60 * 24))
}
