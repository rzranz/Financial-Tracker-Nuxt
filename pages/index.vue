<script setup lang="ts">
import {
  AlertTriangle,
  ArrowDownLeft,
  ArrowRight,
  ArrowUpRight,
  Database,
  Landmark,
  Plus,
  RefreshCw,
  TrendingUp
} from 'lucide-vue-next'
import type { InvestmentRecord } from '~/types/database'
import { daysUntilMaturity, formatDateID, formatIDR } from '~/utils/finance'
import { getInvestmentStatusPresentation, getTransactionPresentation } from '~/utils/presenters'
import { getUserDisplayName } from '~/utils/profile'

const user = useSupabaseUser()
const {
  summary,
  transactions,
  investments,
  loading,
  initialized,
  schemaMissing,
  refreshAll,
  syncMaturity
} = useFinVault()

const showTxModal = ref(false)
const txModalType = ref<'income' | 'expense'>('income')
const showInvModal = ref(false)
const claimingContract = ref<InvestmentRecord | null>(null)
const syncing = ref(false)

onMounted(() => {
  if (!initialized.value) {
    refreshAll()
  }
})

const displayName = computed(() => getUserDisplayName(user.value))

const maturedContracts = computed(() =>
  investments.value.filter((inv) => inv.status === 'matured')
)

const activeAndMatured = computed(() =>
  investments.value.filter((inv) => inv.status === 'active' || inv.status === 'matured').slice(0, 4)
)

const recentTransactions = computed(() => transactions.value.slice(0, 6))

function openTransactionModal(initialType: 'income' | 'expense') {
  txModalType.value = initialType
  showTxModal.value = true
}

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
  <div class="space-y-5 sm:space-y-6">
    <!-- Pinterest-Style Greeting Header -->
    <header class="flex flex-col justify-between gap-3 md:flex-row md:items-end">
      <div>
        <h1 class="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
          Halo {{ displayName }}!
        </h1>
        <p class="mt-0.5 text-xs text-slate-400 sm:text-sm">
          Pantau kas riil &amp; kontrak investasimu tanpa bias akuntansi.
        </p>
      </div>

      <div class="hidden items-center gap-2.5 md:flex">
        <button
          type="button"
          :disabled="syncing || loading"
          class="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-vault-card px-4 py-2 text-xs font-semibold text-slate-200 transition hover:border-white/25 hover:text-white active:scale-[0.98] disabled:opacity-50"
          @click="handleSyncMaturity"
        >
          <RefreshCw class="h-3.5 w-3.5" :class="{ 'animate-spin': syncing }" />
          Cek Jatuh Tempo
        </button>
        <button
          type="button"
          class="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-xs font-semibold text-amber-300 transition hover:bg-amber-500/20 active:scale-[0.98]"
          @click="showInvModal = true"
        >
          <Landmark class="h-3.5 w-3.5" />
          Kontrak Baru
        </button>
      </div>
    </header>

    <!-- Missing Schema Setup Notice (Shown cleanly if SQL DDL has not been executed yet) -->
    <div
      v-if="schemaMissing"
      class="flex flex-col justify-between gap-3 rounded-[24px] border border-amber-500/35 bg-amber-500/10 p-4 sm:flex-row sm:items-center"
    >
      <div class="flex items-start gap-3">
        <Database class="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />
        <div class="text-xs">
          <p class="font-bold text-amber-200">Tabel Database Supabase Belum Dijalankan</p>
          <p class="mt-0.5 leading-relaxed text-amber-200/80">
            Jalankan isi <span class="font-mono text-white">supabase/migrations/001_finvault_schema.sql</span>
            di Supabase SQL Editor agar ledger &amp; kontrak investasi aktif.
          </p>
        </div>
      </div>
      <button
        type="button"
        :disabled="loading"
        class="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-full bg-amber-400 px-4 py-2 text-xs font-bold text-slate-950 transition hover:bg-amber-300 active:scale-95"
        @click="refreshAll"
      >
        <RefreshCw class="h-3.5 w-3.5" :class="{ 'animate-spin': loading }" />
        Cek Ulang DB
      </button>
    </div>

    <!-- Matured Alert Banner -->
    <div
      v-if="maturedContracts.length > 0"
      class="flex flex-col justify-between gap-3 rounded-[24px] border border-amber-500/40 bg-amber-500/10 p-4 sm:flex-row sm:items-center"
    >
      <div class="flex min-w-0 items-start gap-3">
        <div class="relative mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center">
          <span
            aria-hidden="true"
            class="vault-ping-ring absolute inset-0 rounded-full bg-amber-400/60"
          />
          <AlertTriangle class="relative h-5 w-5 text-amber-400" />
        </div>
        <div class="min-w-0">
          <p class="text-sm font-semibold text-amber-200">
            {{ maturedContracts.length }} Kontrak Investasi Telah Jatuh Tempo
          </p>
          <p class="mt-0.5 text-xs text-amber-300/80">
            Konfirmasi pencairan agar pokok + profit masuk ke Kas Likuid.
          </p>
        </div>
      </div>
      <button
        type="button"
        class="group inline-flex w-full shrink-0 items-center justify-center gap-1.5 rounded-full bg-amber-400 px-4 py-2.5 text-xs font-bold text-slate-950 transition hover:bg-amber-300 active:scale-[0.98] sm:w-auto sm:max-w-[240px]"
        @click="claimingContract = maturedContracts[0]"
      >
        <span class="truncate">Cairkan {{ maturedContracts[0].title }}</span>
        <ArrowRight class="h-3.5 w-3.5 shrink-0 transition-transform duration-300 group-hover:translate-x-1" />
      </button>
    </div>

    <!-- Stacked Card Deck + Balance Metrics -->
    <BalanceHeroCard
      :summary="summary"
      :loading="loading && !initialized"
      @add-cash="openTransactionModal('income')"
      @open-investments="navigateTo('/investments')"
    />

    <!-- Pinterest-Style 4 Circular Quick Action Tray -->
    <section
      aria-label="Aksi cepat"
      class="vault-bezel grid grid-cols-4 gap-2 rounded-[26px] p-3.5 sm:p-4"
    >
      <button
        type="button"
        class="group flex flex-col items-center gap-2 rounded-2xl py-1 text-center transition active:scale-95"
        @click="openTransactionModal('income')"
      >
        <span
          class="flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-[#1A1D27] text-emerald-400 transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:-translate-y-0.5 group-hover:border-emerald-400/40 group-hover:bg-emerald-500/15"
        >
          <ArrowDownLeft class="h-5 w-5" />
        </span>
        <span class="text-[11px] font-medium text-slate-300 group-hover:text-white">Masuk</span>
      </button>

      <button
        type="button"
        class="group flex flex-col items-center gap-2 rounded-2xl py-1 text-center transition active:scale-95"
        @click="openTransactionModal('expense')"
      >
        <span
          class="flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-[#1A1D27] text-rose-400 transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:-translate-y-0.5 group-hover:border-rose-400/40 group-hover:bg-rose-500/15"
        >
          <ArrowUpRight class="h-5 w-5" />
        </span>
        <span class="text-[11px] font-medium text-slate-300 group-hover:text-white">Keluar</span>
      </button>

      <button
        type="button"
        class="group flex flex-col items-center gap-2 rounded-2xl py-1 text-center transition active:scale-95"
        @click="showInvModal = true"
      >
        <span
          class="flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-[#1A1D27] text-amber-400 transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:-translate-y-0.5 group-hover:border-amber-400/40 group-hover:bg-amber-500/15"
        >
          <Landmark class="h-5 w-5" />
        </span>
        <span class="text-[11px] font-medium text-slate-300 group-hover:text-white">Kontrak</span>
      </button>

      <button
        type="button"
        :disabled="syncing || loading"
        class="group flex flex-col items-center gap-2 rounded-2xl py-1 text-center transition active:scale-95 disabled:opacity-50"
        @click="handleSyncMaturity"
      >
        <span
          class="flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-[#1A1D27] text-violet-300 transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:-translate-y-0.5 group-hover:border-violet-400/40 group-hover:bg-violet-500/15"
        >
          <RefreshCw class="h-5 w-5" :class="{ 'animate-spin': syncing }" />
        </span>
        <span class="text-[11px] font-medium text-slate-300 group-hover:text-white">Sync</span>
      </button>
    </section>

    <!-- Bento Grid: Recent Transactions (Pinterest Recessed Sheet) + Contracts -->
    <div class="grid grid-cols-1 gap-5 lg:grid-cols-12">
      <!-- Recessed Cash Ledger Sheet -->
      <div class="lg:col-span-5">
        <div class="vault-bezel rounded-[28px] p-5">
          <!-- Top Center Pill Handle Notch -->
          <div class="mb-3 flex justify-center" aria-hidden="true">
            <span class="h-1 w-10 rounded-full bg-white/15" />
          </div>

          <div class="flex items-center justify-between gap-2">
            <div>
              <h2 class="text-sm font-bold text-white">Mutasi Terakhir</h2>
              <p class="mt-0.5 text-xs text-slate-400">Riwayat arus kas riil</p>
            </div>
            <NuxtLink
              to="/ledger"
              class="group inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-slate-300 hover:text-white"
            >
              Lihat Semua
              <ArrowRight class="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5" />
            </NuxtLink>
          </div>

          <div v-if="loading && !initialized" class="mt-4 space-y-3">
            <div v-for="i in 4" :key="i" class="h-14 animate-pulse rounded-2xl bg-slate-900" />
          </div>

          <div
            v-else-if="recentTransactions.length === 0"
            class="mt-5 rounded-2xl border border-dashed border-white/10 bg-vault-bg/60 p-7 text-center"
          >
            <p class="text-sm font-medium text-slate-300">Ledger kas masih kosong</p>
            <p class="mt-1 text-xs text-slate-500">
              Tap tombol <span class="text-white">+ Catat Kas</span> untuk mencatat saldo awal.
            </p>
            <button
              type="button"
              class="mt-4 inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-xs font-bold text-slate-950 transition hover:bg-slate-200 active:scale-95"
              @click="openTransactionModal('income')"
            >
              <Plus class="h-3.5 w-3.5" />
              Catat Transaksi
            </button>
          </div>

          <ul v-else class="mt-4 space-y-1.5">
            <li
              v-for="tx in recentTransactions"
              :key="tx.id"
              class="group flex items-center justify-between gap-3 rounded-2xl p-2 transition-colors hover:bg-white/[0.04]"
            >
              <div class="flex min-w-0 items-center gap-3">
                <div
                  class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/[0.08] bg-[#181B25] transition-transform duration-300 group-hover:scale-105"
                >
                  <ArrowDownLeft
                    v-if="getTransactionPresentation(tx.type).isInflow"
                    class="h-4 w-4 text-emerald-400"
                  />
                  <ArrowUpRight v-else class="h-4 w-4 text-rose-400" />
                </div>
                <div class="min-w-0">
                  <p class="truncate text-sm font-semibold text-slate-100">{{ tx.category }}</p>
                  <p class="truncate text-[11px] text-slate-400">
                    {{ formatDateID(tx.transaction_date) }}
                    <span v-if="tx.note"> · {{ tx.note }}</span>
                  </p>
                </div>
              </div>

              <span
                class="shrink-0 font-mono text-xs font-bold tabular-nums sm:text-sm"
                :class="getTransactionPresentation(tx.type).amountClass"
              >
                {{ getTransactionPresentation(tx.type).sign }}{{ formatIDR(tx.amount) }}
              </span>
            </li>
          </ul>
        </div>
      </div>

      <!-- Active & Matured Contracts + Cashflow Chart -->
      <div class="space-y-5 lg:col-span-7">
        <div class="vault-bezel rounded-[28px] p-5">
          <div class="flex items-center justify-between gap-2">
            <div>
              <h2 class="text-sm font-bold text-white">Kontrak Investasi Berjalan</h2>
              <p class="mt-0.5 text-xs text-slate-400">
                Tenor, proyeksi profit DB, dan pencairan jatuh tempo
              </p>
            </div>
            <NuxtLink
              to="/investments"
              class="group inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-amber-300 hover:text-amber-200"
            >
              Kelola Semua
              <ArrowRight class="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5" />
            </NuxtLink>
          </div>

          <div v-if="loading && !initialized" class="mt-4 space-y-3">
            <div v-for="i in 3" :key="i" class="h-20 animate-pulse rounded-2xl bg-slate-900" />
          </div>

          <div
            v-else-if="activeAndMatured.length === 0"
            class="mt-5 rounded-2xl border border-dashed border-white/10 bg-vault-bg/60 p-7 text-center"
          >
            <TrendingUp class="mx-auto h-7 w-7 text-slate-500" />
            <p class="mt-2 text-sm font-medium text-slate-300">Belum ada kontrak investasi aktif</p>
            <p class="mt-1 text-xs text-slate-500">
              Simulasikan kontrak deposito, SBN, atau fixed-yield pertama Anda.
            </p>
            <button
              type="button"
              class="mt-4 inline-flex items-center gap-1.5 rounded-full bg-amber-400 px-4 py-2 text-xs font-bold text-slate-950 transition hover:bg-amber-300 active:scale-95"
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
              class="vault-card-interactive rounded-2xl border border-white/[0.07] bg-vault-bg/80 p-4"
            >
              <div class="flex flex-col justify-between gap-2 sm:flex-row sm:items-start">
                <div class="min-w-0">
                  <div class="flex flex-wrap items-center gap-2">
                    <span
                      v-if="inv.status === 'matured'"
                      class="relative inline-flex h-2 w-2 shrink-0"
                      aria-hidden="true"
                    >
                      <span class="vault-ping-ring absolute inset-0 rounded-full bg-amber-400" />
                      <span class="relative inline-flex h-2 w-2 rounded-full bg-amber-400" />
                    </span>
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
                  class="w-full rounded-full bg-emerald-500 px-3.5 py-1.5 text-xs font-bold text-slate-950 transition hover:bg-emerald-400 active:scale-[0.98] sm:w-auto"
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
    </div>

    <TransactionModal
      :open="showTxModal"
      :initial-type="txModalType"
      @close="showTxModal = false"
    />
    <InvestmentModal :open="showInvModal" @close="showInvModal = false" />
    <ClaimContractModal :investment="claimingContract" @close="claimingContract = null" />
  </div>
</template>
