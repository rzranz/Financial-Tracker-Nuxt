import { describe, expect, it } from 'vitest'
import {
  addDaysUTC,
  computeAnnualizedYieldPct,
  computeExpectedProfit,
  computeFinancialSummary,
  daysUntilMaturity,
  formatIDR
} from '~/utils/finance'
import {
  claimInvestmentSchema,
  createInvestmentSchema,
  createTransactionSchema
} from '~/server/utils/validation'
import { extractApiErrorMessage } from '~/utils/errors'
import { getInvestmentStatusPresentation, getTransactionPresentation } from '~/utils/presenters'

describe('FinVault Financial Mathematical Model (PRD 1.5)', () => {
  it('eliminates floating point drift in decimal additions and subtractions', () => {
    const summary = computeFinancialSummary(
      [
        { type: 'income', amount: '1000000.10' },
        { type: 'income', amount: '2000000.20' },
        { type: 'expense', amount: '500000.05' },
        { type: 'investment_out', amount: '1500000.00' },
        { type: 'investment_in', amount: '500000.25' }
      ],
      []
    )

    // 1000000.10 + 2000000.20 + 500000.25 - 500000.05 - 1500000.00 = 1500000.50
    expect(summary.liquidCash).toBe('1500000.50')
    expect(summary.projectedNetWorth).toBe('1500000.50')
  })

  it('correctly separates Liquid Cash, Locked Principal, Projected Profit, and Net Worth', () => {
    const summary = computeFinancialSummary(
      [
        { type: 'income', amount: '25000000.00' },
        { type: 'expense', amount: '3500000.00' },
        { type: 'investment_out', amount: '15000000.00' }
      ],
      [
        {
          status: 'active',
          principal_amount: '10000000.00',
          expected_return_pct: '5.50',
          expected_profit_amount: '550000.00'
        },
        {
          status: 'matured',
          principal_amount: '5000000.00',
          expected_return_pct: '2.00',
          expected_profit_amount: '100000.00'
        },
        {
          status: 'claimed',
          principal_amount: '2000000.00',
          expected_return_pct: '3.00',
          expected_profit_amount: '60000.00'
        }
      ],
      2
    )

    expect(summary.liquidCash).toBe('6500000.00')
    expect(summary.lockedPrincipal).toBe('15000000.00')
    expect(summary.projectedProfit).toBe('550000.00')
    expect(summary.maturedProfit).toBe('100000.00')
    expect(summary.projectedNetWorth).toBe('22050000.00')
    expect(summary.activeCount).toBe(1)
    expect(summary.maturedCount).toBe(1)
    expect(summary.claimedCount).toBe(1)
    expect(summary.unreadNotifications).toBe(2)
  })

  it('matches PostgreSQL ROUND(principal * (pct / 100), 2) formula', () => {
    expect(computeExpectedProfit('1234567.89', '4.37')).toBe('53950.62')
    expect(computeExpectedProfit('10000000.00', '0.00')).toBe('0.00')
    expect(computeAnnualizedYieldPct('1.50', 90)).toBe('6.08')
  })

  it('computes UTC maturity dates and formatting accurately', () => {
    expect(addDaysUTC('2026-01-01', 30)).toBe('2026-01-31')
    expect(daysUntilMaturity('2026-01-31', '2026-01-01')).toBe(30)
    expect(daysUntilMaturity('2026-01-01', '2026-01-05')).toBe(-4)
    expect(formatIDR('15000000.50', true)).toBe('Rp 15.000.000,50')
    expect(formatIDR('-250000', false)).toBe('-Rp 250.000')
  })
})

describe('FinVault Input Validation Schemas', () => {
  it('validates transaction inputs and rejects invalid precision or negative values', () => {
    expect(
      createTransactionSchema.safeParse({
        type: 'income',
        category: 'Gaji',
        amount: '15000000.50'
      }).success
    ).toBe(true)

    expect(
      createTransactionSchema.safeParse({
        type: 'expense',
        category: 'Makan',
        amount: '1000.123'
      }).success
    ).toBe(false)

    expect(
      createTransactionSchema.safeParse({
        type: 'expense',
        category: 'Makan',
        amount: '0'
      }).success
    ).toBe(false)
  })

  it('validates investment and claim payloads', () => {
    expect(
      createInvestmentSchema.safeParse({
        title: 'Deposito 90D',
        principal_amount: '5000000',
        expected_return_pct: '2.25',
        duration_days: 90,
        deduct_from_cash: true
      }).success
    ).toBe(true)

    expect(
      claimInvestmentSchema.safeParse({
        investmentId: 'not-a-uuid'
      }).success
    ).toBe(false)
  })
})

describe('Shared Presenters & Error Extraction', () => {
  it('maps transaction types and investment statuses uniformly', () => {
    expect(getTransactionPresentation('income')).toMatchObject({ sign: '+', isInflow: true })
    expect(getTransactionPresentation('investment_in')).toMatchObject({ sign: '+', isInflow: true })
    expect(getTransactionPresentation('investment_out')).toMatchObject({ sign: '-', isInflow: false })
    expect(getTransactionPresentation('expense')).toMatchObject({ sign: '-', isInflow: false })

    expect(getInvestmentStatusPresentation('active').label).toBe('Aktif')
    expect(getInvestmentStatusPresentation('matured').label).toBe('Siap Cair')
    expect(getInvestmentStatusPresentation('claimed').label).toBe('Claimed')
  })

  it('extracts error messages cleanly with fallback', () => {
    expect(extractApiErrorMessage({ data: { statusMessage: 'Conflict' } }, 'Fallback')).toBe('Conflict')
    expect(extractApiErrorMessage({ statusMessage: 'Server Error' }, 'Fallback')).toBe('Server Error')
    expect(extractApiErrorMessage(null, 'Fallback')).toBe('Fallback')
  })
})
