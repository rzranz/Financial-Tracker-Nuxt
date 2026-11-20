import type { InvestmentStatus, TransactionType } from '~/types/database'

export interface TransactionPresentation {
  label: string
  shortLabel: string
  badgeClass: string
  amountClass: string
  sign: '+' | '-'
  isInflow: boolean
}

export function getTransactionPresentation(type: TransactionType): TransactionPresentation {
  switch (type) {
    case 'income':
      return {
        label: 'Income',
        shortLabel: 'In',
        badgeClass: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
        amountClass: 'text-emerald-400',
        sign: '+',
        isInflow: true
      }
    case 'investment_in':
      return {
        label: 'Investment In',
        shortLabel: 'Settlement',
        badgeClass: 'border-sky-500/30 bg-sky-500/10 text-sky-300',
        amountClass: 'text-emerald-400',
        sign: '+',
        isInflow: true
      }
    case 'investment_out':
      return {
        label: 'Investment Out',
        shortLabel: 'Placement',
        badgeClass: 'border-amber-500/30 bg-amber-500/10 text-amber-300',
        amountClass: 'text-rose-400',
        sign: '-',
        isInflow: false
      }
    case 'expense':
      return {
        label: 'Expense',
        shortLabel: 'Out',
        badgeClass: 'border-rose-500/30 bg-rose-500/10 text-rose-300',
        amountClass: 'text-rose-400',
        sign: '-',
        isInflow: false
      }
  }
}

export interface InvestmentStatusPresentation {
  label: string
  badgeClass: string
  barClass: string
}

export function getInvestmentStatusPresentation(
  status: InvestmentStatus
): InvestmentStatusPresentation {
  switch (status) {
    case 'matured':
      return {
        label: 'Siap Cair',
        badgeClass: 'border-amber-500/40 bg-amber-500/15 text-amber-300',
        barClass: 'bg-amber-400'
      }
    case 'claimed':
      return {
        label: 'Claimed',
        badgeClass: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
        barClass: 'bg-emerald-500'
      }
    case 'active':
      return {
        label: 'Aktif',
        badgeClass: 'border-sky-500/30 bg-sky-500/10 text-sky-300',
        barClass: 'bg-sky-400'
      }
  }
}
