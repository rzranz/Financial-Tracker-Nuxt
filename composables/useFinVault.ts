import type {
  FinancialSummary,
  InvestmentRecord,
  NotificationRecord,
  TransactionRecord
} from '~/types/database'
import { extractApiErrorMessage } from '~/utils/errors'

const createEmptySummary = (): FinancialSummary => ({
  liquidCash: '0.00',
  lockedPrincipal: '0.00',
  projectedProfit: '0.00',
  maturedProfit: '0.00',
  projectedNetWorth: '0.00',
  totalIncome: '0.00',
  totalExpense: '0.00',
  totalInvestmentIn: '0.00',
  totalInvestmentOut: '0.00',
  activeCount: 0,
  maturedCount: 0,
  claimedCount: 0,
  unreadNotifications: 0
})

export function useFinVault() {
  const summary = useState<FinancialSummary>('finvault-summary', createEmptySummary)
  const transactions = useState<TransactionRecord[]>('finvault-transactions', () => [])
  const investments = useState<InvestmentRecord[]>('finvault-investments', () => [])
  const notifications = useState<NotificationRecord[]>('finvault-notifications', () => [])
  const loading = useState<boolean>('finvault-loading', () => false)
  const initialized = useState<boolean>('finvault-initialized', () => false)
  const schemaMissing = useState<boolean>('finvault-schema-missing', () => false)
  const { pushToast } = useToast()

  function resetState() {
    summary.value = createEmptySummary()
    transactions.value = []
    investments.value = []
    notifications.value = []
    initialized.value = false
    schemaMissing.value = false
  }

  async function refreshAll() {
    loading.value = true
    schemaMissing.value = false
    try {
      const [sumData, txData, invData, notifData] = await Promise.all([
        $fetch<FinancialSummary>('/api/summary'),
        $fetch<TransactionRecord[]>('/api/transactions'),
        $fetch<InvestmentRecord[]>('/api/investments'),
        $fetch<NotificationRecord[]>('/api/notifications')
      ])
      summary.value = sumData
      transactions.value = txData
      investments.value = invData
      notifications.value = notifData
      initialized.value = true
    } catch (err: unknown) {
      const message = extractApiErrorMessage(err, 'Gagal memuat data keuangan')
      if (message.includes('schema cache') || message.includes('does not exist')) {
        schemaMissing.value = true
        initialized.value = true
        return
      }
      pushToast({
        title: 'Sinkronisasi Gagal',
        description: message,
        variant: 'error'
      })
    } finally {
      loading.value = false
    }
  }

  async function createTransaction(payload: {
    type: 'income' | 'expense'
    category: string
    amount: string
    note?: string | null
    transaction_date?: string
  }) {
    const created = await $fetch<TransactionRecord>('/api/transactions', {
      method: 'POST',
      body: payload
    })
    await refreshAll()
    pushToast({
      title: payload.type === 'income' ? 'Kas Masuk Tercatat' : 'Pengeluaran Tercatat',
      description: `${payload.category} berhasil masuk ke ledger.`,
      variant: 'success'
    })
    return created
  }

  async function deleteTransaction(id: string) {
    await $fetch(`/api/transactions/${id}`, { method: 'DELETE' })
    await refreshAll()
    pushToast({
      title: 'Transaksi Dihapus',
      description: 'Mutasi kas dan saldo likuid telah diperbarui.',
      variant: 'info'
    })
  }

  async function createInvestment(payload: {
    title: string
    principal_amount: string
    expected_return_pct: string
    duration_days: number
    start_date?: string
    deduct_from_cash: boolean
  }) {
    const res = await $fetch<{ investment: InvestmentRecord }>('/api/investments', {
      method: 'POST',
      body: payload
    })
    await refreshAll()
    pushToast({
      title: 'Kontrak Investasi Aktif',
      description: `${payload.title} berhasil dibuat${payload.deduct_from_cash ? ' dan modal dipotong dari Kas Likuid.' : '.'}`,
      variant: 'success'
    })
    return res
  }

  async function claimInvestment(investmentId: string) {
    const res = await $fetch<{
      investment: InvestmentRecord
      payout: { principal: string; profit: string; total: string }
    }>('/api/investments/claim', {
      method: 'POST',
      body: { investmentId }
    })
    await refreshAll()
    pushToast({
      title: 'Pencairan Berhasil',
      description: `Modal + Imbal Hasil dari ${res.investment.title} masuk ke Kas Likuid.`,
      variant: 'success'
    })
    return res
  }

  async function syncMaturity() {
    const res = await $fetch<{ maturedCount: number; notificationsCreated: number }>(
      '/api/investments/check-maturity',
      { method: 'POST' }
    )
    await refreshAll()
    pushToast({
      title: 'Pengecekan Jatuh Tempo Selesai',
      description:
        res.maturedCount > 0
          ? `${res.maturedCount} kontrak baru mencapai jatuh tempo.`
          : 'Semua kontrak aktif masih dalam masa tenor.',
      variant: 'info'
    })
    return res
  }

  async function markNotificationRead(id: string) {
    await $fetch(`/api/notifications/${id}/read`, { method: 'PATCH' })
    notifications.value = notifications.value.map((n) =>
      n.id === id ? { ...n, is_read: true } : n
    )
    summary.value = {
      ...summary.value,
      unreadNotifications: notifications.value.filter((n) => !n.is_read).length
    }
  }

  async function markAllNotificationsRead() {
    await $fetch('/api/notifications/read-all', { method: 'POST' })
    notifications.value = notifications.value.map((n) => ({ ...n, is_read: true }))
    summary.value = { ...summary.value, unreadNotifications: 0 }
    pushToast({
      title: 'Semua Notifikasi Dibaca',
      variant: 'info'
    })
  }

  return {
    summary,
    transactions,
    investments,
    notifications,
    loading,
    initialized,
    schemaMissing,
    resetState,
    refreshAll,
    createTransaction,
    deleteTransaction,
    createInvestment,
    claimInvestment,
    syncMaturity,
    markNotificationRead,
    markAllNotificationsRead
  }
}
