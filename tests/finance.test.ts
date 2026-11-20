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
import {
  buildCustomWalletCard,
  computeCardMetrics,
  formatNoteWithWallet,
  getCustomCardsFromUser,
  matchesWalletCard,
  mergeWalletCards
} from '~/utils/cards'
import { extractApiErrorMessage } from '~/utils/errors'
import { getInvestmentStatusPresentation, getTransactionPresentation } from '~/utils/presenters'
import { getUserDisplayName, getUserInitials, getUserProfileMeta } from '~/utils/profile'

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

  it('derives display name, initials, and safe avatar theme from user metadata', () => {
    const userWithMeta = {
      email: 'rzranz07@gmail.com',
      user_metadata: {
        full_name: 'Rizki Ananda',
        username: 'rzranz',
        avatar_theme: 'amber'
      }
    }
    expect(getUserDisplayName(userWithMeta)).toBe('Rizki Ananda')
    expect(getUserInitials(userWithMeta)).toBe('RA')
    expect(getUserProfileMeta(userWithMeta).avatar_theme).toBe('amber')

    const fallbackUser = { email: 'finvault@example.com', user_metadata: { avatar_theme: 'unknown' } }
    expect(getUserDisplayName(fallbackUser)).toBe('Finvault')
    expect(getUserInitials(fallbackUser)).toBe('FI')
    expect(getUserProfileMeta(fallbackUser).avatar_theme).toBe('violet')
  })

  it('tags and computes wallet card metrics for BCA, BNI, and E-Wallet accurately', () => {
    expect(formatNoteWithWallet('Gaji bulanan', 'bca')).toBe('[BCA] Gaji bulanan')
    expect(formatNoteWithWallet('', 'ewallet')).toBe('[E-Wallet]')
    expect(formatNoteWithWallet('Tanpa tag', 'all')).toBe('Tanpa tag')

    const txs = [
      { type: 'income' as const, category: 'Gaji', note: '[BCA] Gaji', amount: '10000000.00' },
      { type: 'expense' as const, category: 'Belanja', note: '[BCA] Listrik', amount: '750000.00' },
      { type: 'expense' as const, category: 'Kopi', note: 'QRIS GoPay', amount: '45000.00' }
    ]

    expect(matchesWalletCard(txs[0], 'bca')).toBe(true)
    expect(matchesWalletCard(txs[2], 'ewallet')).toBe(true)

    const summary = computeFinancialSummary(txs, [])
    const bcaMetrics = computeCardMetrics('bca', txs, summary)
    expect(bcaMetrics.balance).toBe('9250000.00')
    expect(bcaMetrics.inflow).toBe('10000000.00')
    expect(bcaMetrics.outflow).toBe('750000.00')
    expect(bcaMetrics.txCount).toBe(2)

    const ewalletMetrics = computeCardMetrics('ewallet', txs, summary)
    expect(ewalletMetrics.balance).toBe('-45000.00')
    expect(ewalletMetrics.outflow).toBe('45000.00')
  })

  it('builds and merges custom wallet cards and calculates their metrics', () => {
    const customCard = buildCustomWalletCard({
      id: 'custom-seabank-1024',
      name: 'SeaBank',
      shortLabel: 'SeaBank',
      last4: '1024',
      theme: 'amber'
    })
    const merged = mergeWalletCards([customCard])
    expect(merged.some((c) => c.id === 'custom-seabank-1024')).toBe(true)

    const parsedFromUser = getCustomCardsFromUser({
      user_metadata: {
        wallet_cards: [{ id: 'custom-bri-4910', name: 'BRI BritAma', shortLabel: 'BRI', last4: '4910', theme: 'sapphire' }]
      }
    })
    expect(parsedFromUser).toHaveLength(1)
    expect(parsedFromUser[0].shortLabel).toBe('BRI')

    const customTxs = [
      { type: 'income' as const, category: 'Transfer', note: '[SeaBank] Bonus', amount: '2500000.00' },
      { type: 'expense' as const, category: 'Makan', note: '[SeaBank] Lunch', amount: '55000.00' }
    ]
    const metrics = computeCardMetrics('custom-seabank-1024', customTxs, computeFinancialSummary(customTxs, []), merged)
    expect(metrics.balance).toBe('2445000.00')
    expect(metrics.outflow).toBe('55000.00')
    expect(metrics.txCount).toBe(2)
  })
})
