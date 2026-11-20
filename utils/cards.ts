import Decimal from 'decimal.js'
import type { FinancialSummary, TransactionRecord } from '~/types/database'
import { toDecimal } from '~/utils/finance'

export type WalletCardId = 'all' | 'bca' | 'bni' | 'mandiri' | 'ewallet'

export interface WalletCardConfig {
  id: WalletCardId
  name: string
  shortLabel: string
  subtitle: string
  maskedNumber: string
  gradientClass: string
  shadowColor: string
  keywords: string[]
}

export const WALLET_CARDS: WalletCardConfig[] = [
  {
    id: 'all',
    name: 'FinVault Total',
    shortLabel: 'Semua',
    subtitle: 'Real Spendable Balance',
    maskedNumber: '•••• •••• •••• 0001',
    gradientClass: 'from-[#7C3AED] via-[#8B5CF6] to-[#6D28D9]',
    shadowColor: 'rgba(124, 58, 237, 0.55)',
    keywords: []
  },
  {
    id: 'bca',
    name: 'BCA Debit',
    shortLabel: 'BCA',
    subtitle: 'Saldo Rekening BCA',
    maskedNumber: '•••• •••• •••• 4364',
    gradientClass: 'from-[#005BAA] via-[#0070CE] to-[#003D7A]',
    shadowColor: 'rgba(0, 112, 206, 0.5)',
    keywords: ['[bca]', 'bca']
  },
  {
    id: 'bni',
    name: 'BNI Taplus',
    shortLabel: 'BNI',
    subtitle: 'Saldo Rekening BNI',
    maskedNumber: '•••• •••• •••• 7216',
    gradientClass: 'from-[#005E6A] via-[#0E7490] to-[#C2410C]',
    shadowColor: 'rgba(14, 116, 144, 0.5)',
    keywords: ['[bni]', 'bni']
  },
  {
    id: 'mandiri',
    name: "Mandiri Livin'",
    shortLabel: 'Mandiri',
    subtitle: 'Saldo Rekening Mandiri',
    maskedNumber: '•••• •••• •••• 8840',
    gradientClass: 'from-[#0F2942] via-[#1E3A5F] to-[#926B1C]',
    shadowColor: 'rgba(30, 58, 95, 0.55)',
    keywords: ['[mandiri]', 'mandiri', "livin"]
  },
  {
    id: 'ewallet',
    name: 'E-Wallet',
    shortLabel: 'E-Wallet',
    subtitle: 'GoPay / OVO / Dana / ShopeePay',
    maskedNumber: '•••• •••• •••• 9012',
    gradientClass: 'from-[#059669] via-[#10B981] to-[#0F766E]',
    shadowColor: 'rgba(16, 185, 129, 0.5)',
    keywords: ['[e-wallet]', '[ewallet]', 'e-wallet', 'ewallet', 'gopay', 'ovo', 'dana', 'shopeepay', 'qris']
  }
]

export function getWalletCard(id: WalletCardId): WalletCardConfig {
  return WALLET_CARDS.find((c) => c.id === id) ?? WALLET_CARDS[0]
}

export function matchesWalletCard(
  tx: Pick<TransactionRecord, 'category' | 'note'>,
  cardId: WalletCardId
): boolean {
  if (cardId === 'all') return true
  const config = getWalletCard(cardId)
  const haystack = `${tx.category} ${tx.note || ''}`.toLowerCase()
  return config.keywords.some((kw) => haystack.includes(kw))
}

export function formatNoteWithWallet(note: string, walletId: WalletCardId): string | null {
  const cleanNote = note.trim()
  if (walletId === 'all') return cleanNote || null
  const label = getWalletCard(walletId).shortLabel
  const tag = `[${label}]`
  if (cleanNote.toLowerCase().includes(tag.toLowerCase())) return cleanNote
  return cleanNote ? `${tag} ${cleanNote}` : tag
}

export function computeCardMetrics(
  cardId: WalletCardId,
  transactions: Pick<TransactionRecord, 'type' | 'category' | 'note' | 'amount'>[],
  summary: FinancialSummary
) {
  if (cardId === 'all') {
    return {
      balance: summary.liquidCash,
      inflow: toDecimal(summary.totalIncome).plus(toDecimal(summary.totalInvestmentIn)).toFixed(2),
      outflow: toDecimal(summary.totalExpense).plus(toDecimal(summary.totalInvestmentOut)).toFixed(2),
      txCount: transactions.length
    }
  }

  let inflow = new Decimal(0)
  let outflow = new Decimal(0)
  let txCount = 0

  for (const tx of transactions) {
    if (!matchesWalletCard(tx, cardId)) continue
    txCount += 1
    const amt = toDecimal(tx.amount)
    if (tx.type === 'income' || tx.type === 'investment_in') {
      inflow = inflow.plus(amt)
    } else {
      outflow = outflow.plus(amt)
    }
  }

  const balance = inflow.minus(outflow).toDecimalPlaces(2, Decimal.ROUND_HALF_UP)

  return {
    balance: balance.toFixed(2),
    inflow: inflow.toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toFixed(2),
    outflow: outflow.toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toFixed(2),
    txCount
  }
}
