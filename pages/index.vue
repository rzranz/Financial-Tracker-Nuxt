<script setup lang="ts">
import {
  AlertTriangle,
  ArrowDownLeft,
  ArrowRight,
  ArrowUpRight,
  Landmark,
  Plus,
  RefreshCw,
  TrendingUp
} from 'lucide-vue-next'
import type { InvestmentRecord } from '~/types/database'
import { daysUntilMaturity, formatDateID, formatIDR } from '~/utils/finance'
import { getInvestmentStatusPresentation, getTransactionPresentation } from '~/utils/presenters'

const { summary, transactions, investments, loading, initialized, refreshAll, syncMaturity } =
  useFinVault()

const showTxModal = ref(false)
const showInvModal = ref(false)
const claimingContract = ref<InvestmentRecord | null>(null)
const syncing = ref(false)

onMounted(() => {
  if (!initialized.value) {
    refreshAll()
  }
})

const maturedContracts = computed(() =>
  investments.value.filter((inv) => inv.status === 'matured')
)

const activeAndMatured = computed(() =>
  investments.value.filter((inv) => inv.status === 'active' || inv.status === 'matured').slice(0, 4)
)

const recentTransactions = computed(() => transactions.value.slice(0, 6))

async function handleSyncMaturity() {
  syncing.value = true
  try {
    await syncMaturity()
  } finally {
    syncing.value = false
  }
}
</script>

<template>
  <div class="space-y-6">
    <!-- Top Header -->
    <header class="flex flex-col justify-between gap-4 md:flex-row md:items-center">
      <div>
        <h1 class="text-xl font-bold tracking-tight text-white sm:text-2xl">
          Financial Command Center
        </h1>
        <p class="mt-1 text-xs text-slate-400 sm:text-sm">
          Pemisahan real-time antara Kas Likuid, Modal Terikat, dan Proyeksi Imbal Hasil.
        </p>
      </div>

      <div class="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center sm:gap-2.5">
        <button
          type="button"
          :disabled="syncing || loading"
          class="col-span-2 inline-flex items-center justify-center gap-1.5 rounded-xl border border-vault-border bg-vault-card px-3.5 py-2.5 text-xs font-semibold text-slate-300 transition hover:border-slate-600 hover:text-white disabled:opacity-50 sm:col-span-1"
          @click="handleSyncMaturity"
        >
          <RefreshCw class="h-3.5 w-3.5" :class="{ 'animate-spin': syncing }" />
          Cek Jatuh Tempo
        </button>
        <button
          type="button"
          class="inline-flex items-center justify-center gap-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3.5 py-2.5 text-xs font-semibold text-amber-300 transition hover:bg-amber-500/20"
          @click="showInvModal = true"
        >
          <Landmark class="h-3.5 w-3.5" />
          Kontrak Baru
        </button>
        <button
          type="button"
          class="inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-500 px-4 py-2.5 text-xs font-bold text-slate-950 transition hover:bg-emerald-400 active:scale-[0.98]"
          @click="showTxModal = true"
        >
          <Plus class="h-3.5 w-3.5" />
          Catat Kas
        </button>
      </div>
    </header>

    <!-- Matured Alert Banner -->
    <div
      v-if="maturedContracts.length > 0"
      class="flex flex-col justify-between gap-3 rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4 sm:flex-row sm:items-center"
    >
      <div class="flex min-w-0 items-start gap-3">
        <AlertTriangle class="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />
        <div class="min-w-0">
          <p class="text-sm font-semibold text-amber-200">
            {{ maturedContracts.length }} Kontrak Investasi Telah Jatuh Tempo
          </p>
          <p class="mt-0.5 text-xs text-amber-300/80">
            Dana belum masuk ke Kas Likuid sebelum Anda melakukan konfirmasi pencairan manual.
          </p>
        </div>
      </div>
      <button
        type="button"
        class="inline-flex w-full shrink-0 items-center justify-center gap-1.5 rounded-xl bg-amber-400 px-4 py-2.5 text-xs font-bold text-slate-950 transition hover:bg-amber-300 sm:w-auto sm:max-w-[240px]"
        @click="claimingContract = maturedContracts[0]"
      >
        <span class="truncate">Cairkan {{ maturedContracts[0].title }}</span>
        <ArrowRight class="h-3.5 w-3.5 shrink-0" />
      </button>
    </div>

    <!-- 4-Equation Balance Hero -->
    <BalanceHeroCard :summary="summary" :loading="loading && !initialized" />

    <!-- Dashboard Bento Grid -->
    <div class="grid grid-cols-1 gap-6 lg:grid-cols-12">
      <!-- Active & Matured Contracts -->
      <div class="space-y-4 lg:col-span-7">
        <div class="rounded-2xl border border-vault-border bg-vault-card p-5">
          <div class="flex items-center justify-between gap-2">
            <div>
              <h2 class="text-sm font-semibold text-white">Kontrak Investasi Berjalan</h2>
              <p class="mt-0.5 text-xs text-slate-400">
                Pantau tenor, proyeksi profit DB, dan pencairan jatuh tempo
              </p>
            </div>
            <NuxtLink
              to="/investments"
              class="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-emerald-400 hover:text-emerald-300"
            >
              Kelola Semua
              <ArrowRight class="h-3.5 w-3.5" />
            </NuxtLink>
          </div>

          <div v-if="loading && !initialized" class="mt-4 space-y-3">
            <div v-for="i in 3" :key="i" class="h-20 animate-pulse rounded-xl bg-slate-900" />
          </div>

          <div
            v-else-if="activeAndMatured.length === 0"
            class="mt-5 rounded-xl border border-dashed border-vault-border bg-vault-bg/60 p-8 text-center"
          >
            <TrendingUp class="mx-auto h-7 w-7 text-slate-500" />
            <p class="mt-2 text-sm font-medium text-slate-300">Belum ada kontrak investasi aktif</p>
            <p class="mt-1 text-xs text-slate-500">
              Simulasikan dan buat kontrak deposito, SBN, atau P2P fixed-yield pertama Anda.
            </p>
            <button
              type="button"
              class="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-amber-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-amber-400"
              @click="showInvModal = true"
            >
              <Plus class="h-3.5 w-3.5" />
              Buat Kontrak
            </button>
          </div>

          <div v-else class="mt-4 space-y-3">
            <div
              v-for="inv in activeAndMatured"
              :key="inv.id"
              class="rounded-xl border border-vault-border bg-vault-bg/70 p-4 transition hover:border-slate-700"
            >
              <div class="flex flex-col justify-between gap-2 sm:flex-row sm:items-start">
                <div class="min-w-0">
                  <div class="flex flex-wrap items-center gap-2">
                    <h3 class="truncate text-sm font-semibold text-white">{{ inv.title }}</h3>
                    <span
                      class="rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
                      :class="getInvestmentStatusPresentation(inv.status).badgeClass"
                    >
                      {{ getInvestmentStatusPresentation(inv.status).label }}
                    </span>
                  </div>
                  <p class="mt-1 text-xs text-slate-400">
                    Tenor {{ inv.duration_days }} hari · Jatuh tempo
                    <span class="font-mono text-slate-200">{{ formatDateID(inv.maturity_date) }}</span>
                  </p>
                </div>

                <div class="sm:text-right">
                  <p class="font-mono text-sm font-bold text-white tabular-nums">
                    {{ formatIDR(inv.principal_amount) }}
                  </p>
                  <p class="font-mono text-xs text-sky-300 tabular-nums">
                    +{{ formatIDR(inv.expected_profit_amount) }} ({{ inv.expected_return_pct }}%)
                  </p>
                </div>
              </div>

              <div class="mt-3 flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                <span class="text-[11px] text-slate-400">
                  <template v-if="inv.status === 'matured'">
                    Jatuh tempo tercapai — siap dicairkan ke Kas Likuid
                  </template>
                  <template v-else>
                    Sisa {{ Math.max(0, daysUntilMaturity(inv.maturity_date)) }} hari lagi
                  </template>
                </span>

                <button
                  v-if="inv.status === 'matured'"
                  type="button"
                  class="w-full rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-bold text-slate-950 transition hover:bg-emerald-400 sm:w-auto"
                  @click="claimingContract = inv"
                >
                  Cairkan / Claim
                </button>
              </div>
            </div>
          </div>
        </div>

        <CashflowChart :summary="summary" />
      </div>

      <!-- Recent Cash Ledger -->
      <div class="lg:col-span-5">
        <div class="rounded-2xl border border-vault-border bg-vault-card p-5">
          <div class="flex items-center justify-between gap-2">
            <div>
              <h2 class="text-sm font-semibold text-white">Mutasi Kas Terbaru</h2>
              <p class="mt-0.5 text-xs text-slate-400">Riwayat arus kas riil terakhir</p>
            </div>
            <NuxtLink
              to="/ledger"
              class="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-emerald-400 hover:text-emerald-300"
            >
              Lihat Ledger
              <ArrowRight class="h-3.5 w-3.5" />
            </NuxtLink>
          </div>

          <div v-if="loading && !initialized" class="mt-4 space-y-3">
            <div v-for="i in 5" :key="i" class="h-14 animate-pulse rounded-xl bg-slate-900" />
          </div>

          <div
            v-else-if="recentTransactions.length === 0"
            class="mt-5 rounded-xl border border-dashed border-vault-border bg-vault-bg/60 p-8 text-center"
          >
            <p class="text-sm font-medium text-slate-300">Ledger kas masih kosong</p>
            <p class="mt-1 text-xs text-slate-500">
              Catat pemasukan awal atau pengeluaran untuk mulai melacak Kas Likuid.
            </p>
            <button
              type="button"
              class="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-emerald-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-emerald-400"
              @click="showTxModal = true"
            >
              <Plus class="h-3.5 w-3.5" />
              Catat Transaksi
            </button>
          </div>

          <ul v-else class="mt-4 divide-y divide-vault-border">
            <li
              v-for="tx in recentTransactions"
              :key="tx.id"
              class="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
            >
              <div class="flex min-w-0 items-center gap-3">
                <div
                  class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border"
                  :class="getTransactionPresentation(tx.type).badgeClass"
                >
                  <ArrowDownLeft
                    v-if="getTransactionPresentation(tx.type).isInflow"
                    class="h-4 w-4"
                  />
                  <ArrowUpRight v-else class="h-4 w-4" />
                </div>
                <div class="min-w-0">
                  <p class="truncate text-sm font-medium text-slate-100">{{ tx.category }}</p>
                  <p class="truncate text-xs text-slate-400">
                    {{ tx.note || getTransactionPresentation(tx.type).label }} ·
                    {{ formatDateID(tx.transaction_date) }}
                  </p>
                </div>
              </div>

              <span
                class="shrink-0 font-mono text-xs font-semibold tabular-nums sm:text-sm"
                :class="getTransactionPresentation(tx.type).amountClass"
              >
                {{ getTransactionPresentation(tx.type).sign }}{{ formatIDR(tx.amount) }}
              </span>
            </li>
          </ul>
        </div>
      </div>
    </div>

    <TransactionModal :open="showTxModal" @close="showTxModal = false" />
    <InvestmentModal :open="showInvModal" @close="showInvModal = false" />
    <ClaimContractModal :investment="claimingContract" @close="claimingContract = null" />
  </div>
</template>
