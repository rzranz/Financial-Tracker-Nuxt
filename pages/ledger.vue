<script setup lang="ts">
import { ArrowDownLeft, ArrowUpRight, Plus, Search, Trash2 } from 'lucide-vue-next'
import type { TransactionType } from '~/types/database'
import { formatDateID, formatIDR } from '~/utils/finance'
import { getTransactionPresentation } from '~/utils/presenters'

const { summary, transactions, loading, initialized, refreshAll, deleteTransaction } = useFinVault()

const showTxModal = ref(false)
const activeType = ref<'all' | TransactionType>('all')
const searchQuery = ref('')
const deletingId = ref<string | null>(null)

onMounted(() => {
  if (!initialized.value) {
    refreshAll()
  }
})

const filteredTransactions = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  return transactions.value.filter((tx) => {
    const matchType = activeType.value === 'all' || tx.type === activeType.value
    const matchSearch =
      !q ||
      tx.category.toLowerCase().includes(q) ||
      (tx.note && tx.note.toLowerCase().includes(q))
    return matchType && matchSearch
  })
})

const filterTabs: { key: 'all' | TransactionType; label: string }[] = [
  { key: 'all', label: 'Semua' },
  { key: 'income', label: 'Income' },
  { key: 'expense', label: 'Expense' },
  { key: 'investment_out', label: 'Investment Out' },
  { key: 'investment_in', label: 'Investment In' }
]

async function handleDelete(id: string) {
  if (deletingId.value) return
  deletingId.value = id
  try {
    await deleteTransaction(id)
  } finally {
    deletingId.value = null
  }
}
</script>

<template>
  <div class="space-y-6">
    <header class="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
      <div>
        <h1 class="text-xl font-bold tracking-tight text-white sm:text-2xl">Cash Ledger</h1>
        <p class="mt-1 text-xs text-slate-400 sm:text-sm">
          Buku besar arus kas riil — seluruh mutasi langsung memperbarui Liquid Cash Balance.
        </p>
      </div>
      <button
        type="button"
        class="group inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-xs font-bold text-slate-950 transition duration-200 hover:bg-emerald-400 active:scale-[0.98] sm:w-auto"
        @click="showTxModal = true"
      >
        <span class="flex h-5 w-5 items-center justify-center rounded-full bg-slate-950/15 transition-transform duration-300 group-hover:rotate-90">
          <Plus class="h-3.5 w-3.5" />
        </span>
        Catat Mutasi Baru
      </button>
    </header>

    <!-- Summary Strip -->
    <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <div class="vault-card-interactive rounded-2xl border border-vault-border bg-vault-card p-4">
        <p class="text-xs text-slate-400">Kas Likuid Saat Ini</p>
        <p class="mt-1.5 break-words font-mono text-lg font-bold text-emerald-400 tabular-nums">
          {{ formatIDR(summary.liquidCash) }}
        </p>
      </div>
      <div class="vault-card-interactive rounded-2xl border border-vault-border bg-vault-card p-4">
        <p class="text-xs text-slate-400">Total Income</p>
        <p class="mt-1.5 break-words font-mono text-lg font-bold text-white tabular-nums">
          +{{ formatIDR(summary.totalIncome) }}
        </p>
      </div>
      <div class="vault-card-interactive rounded-2xl border border-vault-border bg-vault-card p-4">
        <p class="text-xs text-slate-400">Total Settlement In</p>
        <p class="mt-1.5 break-words font-mono text-lg font-bold text-sky-300 tabular-nums">
          +{{ formatIDR(summary.totalInvestmentIn) }}
        </p>
      </div>
      <div class="vault-card-interactive rounded-2xl border border-vault-border bg-vault-card p-4">
        <p class="text-xs text-slate-400">Total Expense</p>
        <p class="mt-1.5 break-words font-mono text-lg font-bold text-rose-400 tabular-nums">
          -{{ formatIDR(summary.totalExpense) }}
        </p>
      </div>
    </div>

    <!-- Filter (Sliding Morphing Pill) & Search -->
    <div class="flex flex-col justify-between gap-3 rounded-2xl border border-vault-border bg-vault-card p-4 md:flex-row md:items-center">
      <SegmentedTabs v-model="activeType" :items="filterTabs" />

      <div class="relative w-full md:w-64">
        <Search class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Cari kategori atau catatan..."
          class="w-full rounded-xl border border-vault-border bg-vault-bg py-2 pl-9 pr-3 text-xs text-white placeholder-slate-500 transition focus:border-emerald-500 focus:outline-none"
        />
      </div>
    </div>

    <!-- Ledger Responsive List (Cards on Mobile, Table on md+) -->
    <div class="overflow-hidden rounded-2xl border border-vault-border bg-vault-card">
      <div v-if="loading && !initialized" class="space-y-3 p-5">
        <div v-for="i in 6" :key="i" class="h-12 animate-pulse rounded-xl bg-slate-900" />
      </div>

      <div v-else-if="filteredTransactions.length === 0" class="p-12 text-center">
        <p class="text-sm font-medium text-slate-300">Tidak ada transaksi yang sesuai filter</p>
        <p class="mt-1 text-xs text-slate-500">
          Catat pemasukan atau pengeluaran baru untuk mengisi ledger kas Anda.
        </p>
      </div>

      <template v-else>
        <!-- Mobile Card List (< md) -->
        <ul class="divide-y divide-vault-border md:hidden">
          <li
            v-for="tx in filteredTransactions"
            :key="tx.id"
            class="space-y-2.5 p-4 transition-colors hover:bg-vault-elevated/30"
          >
            <div class="flex items-start justify-between gap-3">
              <div class="min-w-0">
                <div class="flex flex-wrap items-center gap-2">
                  <span
                    class="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold"
                    :class="getTransactionPresentation(tx.type).badgeClass"
                  >
                    <ArrowDownLeft
                      v-if="getTransactionPresentation(tx.type).isInflow"
                      class="h-3 w-3"
                    />
                    <ArrowUpRight v-else class="h-3 w-3" />
                    {{ getTransactionPresentation(tx.type).label }}
                  </span>
                  <span class="font-mono text-[11px] text-slate-400">
                    {{ formatDateID(tx.transaction_date) }}
                  </span>
                </div>
                <p class="mt-1.5 text-sm font-semibold text-white">{{ tx.category }}</p>
                <p v-if="tx.note" class="mt-0.5 text-xs text-slate-400">{{ tx.note }}</p>
              </div>

              <button
                type="button"
                :disabled="deletingId === tx.id"
                class="shrink-0 rounded-lg p-1.5 text-slate-400 transition hover:bg-rose-500/15 hover:text-rose-400 active:scale-95 disabled:opacity-40"
                aria-label="Hapus transaksi"
                @click="handleDelete(tx.id)"
              >
                <Trash2 class="h-4 w-4" />
              </button>
            </div>

            <div class="flex items-center justify-end border-t border-white/5 pt-2">
              <span
                class="font-mono text-sm font-bold tabular-nums"
                :class="getTransactionPresentation(tx.type).amountClass"
              >
                {{ getTransactionPresentation(tx.type).sign }}{{ formatIDR(tx.amount, true) }}
              </span>
            </div>
          </li>
        </ul>

        <!-- Desktop & Tablet Table (md+) -->
        <div class="hidden overflow-x-auto md:block">
          <table class="w-full text-left text-sm">
            <thead class="border-b border-vault-border bg-vault-surface text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              <tr>
                <th class="px-5 py-3.5">Tanggal</th>
                <th class="px-5 py-3.5">Tipe</th>
                <th class="px-5 py-3.5">Kategori &amp; Catatan</th>
                <th class="px-5 py-3.5 text-right">Nominal (IDR)</th>
                <th class="px-5 py-3.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-vault-border">
              <tr
                v-for="tx in filteredTransactions"
                :key="tx.id"
                class="transition-colors duration-200 hover:bg-vault-elevated/40"
              >
                <td class="whitespace-nowrap px-5 py-3.5 font-mono text-xs text-slate-300">
                  {{ formatDateID(tx.transaction_date) }}
                </td>
                <td class="whitespace-nowrap px-5 py-3.5">
                  <span
                    class="inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold"
                    :class="getTransactionPresentation(tx.type).badgeClass"
                  >
                    <ArrowDownLeft
                      v-if="getTransactionPresentation(tx.type).isInflow"
                      class="h-3 w-3"
                    />
                    <ArrowUpRight v-else class="h-3 w-3" />
                    {{ getTransactionPresentation(tx.type).label }}
                  </span>
                </td>
                <td class="px-5 py-3.5">
                  <p class="font-medium text-slate-100">{{ tx.category }}</p>
                  <p v-if="tx.note" class="mt-0.5 text-xs text-slate-400">{{ tx.note }}</p>
                </td>
                <td
                  class="whitespace-nowrap px-5 py-3.5 text-right font-mono font-semibold tabular-nums"
                  :class="getTransactionPresentation(tx.type).amountClass"
                >
                  {{ getTransactionPresentation(tx.type).sign }}{{ formatIDR(tx.amount, true) }}
                </td>
                <td class="whitespace-nowrap px-5 py-3.5 text-right">
                  <button
                    type="button"
                    :disabled="deletingId === tx.id"
                    class="rounded-lg p-1.5 text-slate-400 transition hover:bg-rose-500/15 hover:text-rose-400 active:scale-95 disabled:opacity-40"
                    title="Hapus transaksi"
                    aria-label="Hapus transaksi"
                    @click="handleDelete(tx.id)"
                  >
                    <Trash2 class="h-4 w-4" />
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </template>
    </div>

    <TransactionModal :open="showTxModal" @close="showTxModal = false" />
  </div>
</template>
