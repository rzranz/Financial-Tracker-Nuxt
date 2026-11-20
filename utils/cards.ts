import Decimal from 'decimal.js'
import type { FinancialSummary, TransactionRecord } from '~/types/database'
import { toDecimal } from '~/utils/finance'
import type { ProfileLikeUser } from '~/utils/profile'

export type WalletCardId = string

export type CardThemeKey = 'violet' | 'sapphire' | 'teal' | 'navy' | 'emerald' | 'crimson' | 'amber'

export interface WalletCardConfig {
  id: WalletCardId
  name: string
  shortLabel: string
  subtitle: string
  maskedNumber: string
  gradientClass: string
  shadowColor: string
  keywords: string[]
  isCustom?: boolean
  theme?: CardThemeKey
}

export const CARD_THEMES: {
  key: CardThemeKey
  label: string
  gradientClass: string
  shadowColor: string
  swatchClass: string
}[] = [
  {
    key: 'sapphire',
    label: 'Sapphire Blue',
    gradientClass: 'from-[#005BAA] via-[#0070CE] to-[#003D7A]',
    shadowColor: 'rgba(0, 112, 206, 0.5)',
    swatchClass: 'bg-blue-600'
  },
  {
    key: 'teal',
    label: 'Ocean Teal',
    gradientClass: 'from-[#005E6A] via-[#0E7490] to-[#C2410C]',
    shadowColor: 'rgba(14, 116, 144, 0.5)',
    swatchClass: 'bg-cyan-600'
  },
  {
    key: 'navy',
    label: 'Navy Gold',
    gradientClass: 'from-[#0F2942] via-[#1E3A5F] to-[#926B1C]',
    shadowColor: 'rgba(30, 58, 95, 0.55)',
    swatchClass: 'bg-slate-800'
  },
  {
    key: 'emerald',
    label: 'Emerald Pay',
    gradientClass: 'from-[#059669] via-[#10B981] to-[#0F766E]',
    shadowColor: 'rgba(16, 185, 129, 0.5)',
    swatchClass: 'bg-emerald-500'
  },
  {
    key: 'violet',
    label: 'Royal Violet',
    gradientClass: 'from-[#7C3AED] via-[#8B5CF6] to-[#6D28D9]',
    shadowColor: 'rgba(124, 58, 237, 0.55)',
    swatchClass: 'bg-violet-500'
  },
  {
    key: 'crimson',
    label: 'Crimson Rose',
    gradientClass: 'from-[#9F1239] via-[#E11D48] to-[#881337]',
    shadowColor: 'rgba(225, 29, 72, 0.45)',
    swatchClass: 'bg-rose-600'
  },
  {
    key: 'amber',
    label: 'Amber Orange',
    gradientClass: 'from-[#D97706] via-[#F59E0B] to-[#B45309]',
    shadowColor: 'rgba(245, 158, 11, 0.45)',
    swatchClass: 'bg-amber-500'
  }
]

export const DEFAULT_WALLET_CARDS: WalletCardConfig[] = [
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
    keywords: ['[mandiri]', 'mandiri', 'livin']
  },
  {
    id: 'ewallet',
    name: 'E-Wallet',
    shortLabel: 'E-Wallet',
    subtitle: 'GoPay / OVO / Dana / ShopeePay',
    maskedNumber: '•••• •••• •••• 9012',
    gradientClass: 'from-[#059669] via-[#10B981] to-[#0F766E]',
    shadowColor: 'rgba(16, 185, 129, 0.5)',
    keywords: [
      '[e-wallet]',
      '[ewallet]',
      'e-wallet',
      'ewallet',
      'gopay',
      'ovo',
      'dana',
      'shopeepay',
      'qris'
    ]
  }
]

// Backwards-compatible alias
export const WALLET_CARDS = DEFAULT_WALLET_CARDS

export interface StoredCustomCard {
  id: string
  name: string
  shortLabel: string
  subtitle?: string
  last4?: string
  theme: CardThemeKey
}

export function getCardTheme(theme: CardThemeKey = 'sapphire') {
  return CARD_THEMES.find((t) => t.key === theme) ?? CARD_THEMES[0]
}

export function buildCustomWalletCard(input: {
  id?: string
  name: string
  shortLabel?: string
  subtitle?: string
  last4?: string
  theme?: CardThemeKey
}): WalletCardConfig {
  const cleanName = input.name.trim()
  const cleanShort = (input.shortLabel?.trim() || cleanName.split(/\s+/)[0] || cleanName).slice(0, 14)
  const slugBase = cleanShort.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'card'
  const last4Digits = (input.last4 || '').replace(/\D/g, '').slice(-4).padStart(4, '0')
  const theme = getCardTheme(input.theme ?? 'sapphire')
  const id = input.id || `custom-${slugBase}-${last4Digits}`

  const keywords = Array.from(
    new Set([
      `[${cleanShort.toLowerCase()}]`,
      cleanShort.toLowerCase(),
      cleanName.toLowerCase()
    ])
  ).filter(Boolean)

  return {
    id,
    name: cleanName,
    shortLabel: cleanShort,
    subtitle: input.subtitle?.trim() || `Saldo ${cleanName}`,
    maskedNumber: `•••• •••• •••• ${last4Digits}`,
    gradientClass: theme.gradientClass,
    shadowColor: theme.shadowColor,
    keywords,
    isCustom: true,
    theme: theme.key
  }
}

export function getCustomCardsFromUser(user: ProfileLikeUser | null | undefined): WalletCardConfig[] {
  const raw = (user?.user_metadata as Record<string, unknown> | undefined)?.wallet_cards
  if (!Array.isArray(raw)) return []

  const results: WalletCardConfig[] = []
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue
    const rec = item as Partial<StoredCustomCard>
    if (typeof rec.name !== 'string' || !rec.name.trim()) continue
    results.push(
      buildCustomWalletCard({
        id: typeof rec.id === 'string' ? rec.id : undefined,
        name: rec.name,
        shortLabel: typeof rec.shortLabel === 'string' ? rec.shortLabel : undefined,
        subtitle: typeof rec.subtitle === 'string' ? rec.subtitle : undefined,
        last4: typeof rec.last4 === 'string' ? rec.last4 : undefined,
        theme: CARD_THEMES.some((t) => t.key === rec.theme) ? rec.theme : 'sapphire'
      })
    )
  }
  return results
}

export function mergeWalletCards(customCards: WalletCardConfig[]): WalletCardConfig[] {
  return [...DEFAULT_WALLET_CARDS, ...customCards]
}

export function getWalletCard(
  id: WalletCardId,
  cards: WalletCardConfig[] = DEFAULT_WALLET_CARDS
): WalletCardConfig {
  return cards.find((c) => c.id === id) ?? cards[0] ?? DEFAULT_WALLET_CARDS[0]
}

export function matchesWalletCard(
  tx: Pick<TransactionRecord, 'category' | 'note'>,
  cardId: WalletCardId,
  cards: WalletCardConfig[] = DEFAULT_WALLET_CARDS
): boolean {
  if (cardId === 'all') return true
  const config = getWalletCard(cardId, cards)
  if (config.id === 'all') return true
  const haystack = `${tx.category} ${tx.note || ''}`.toLowerCase()
  return config.keywords.some((kw) => haystack.includes(kw))
}

export function formatNoteWithWallet(
  note: string,
  walletId: WalletCardId,
  cards: WalletCardConfig[] = DEFAULT_WALLET_CARDS
): string | null {
  const cleanNote = note.trim()
  if (walletId === 'all') return cleanNote || null
  const label = getWalletCard(walletId, cards).shortLabel
  const tag = `[${label}]`
  if (cleanNote.toLowerCase().includes(tag.toLowerCase())) return cleanNote
  return cleanNote ? `${tag} ${cleanNote}` : tag
}

export function computeCardMetrics(
  cardId: WalletCardId,
  transactions: Pick<TransactionRecord, 'type' | 'category' | 'note' | 'amount'>[],
  summary: FinancialSummary,
  cards: WalletCardConfig[] = DEFAULT_WALLET_CARDS
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
    if (!matchesWalletCard(tx, cardId, cards)) continue
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
