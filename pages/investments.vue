<script setup lang="ts">
import Decimal from 'decimal.js'
import { ArrowRight, CheckCircle2, Clock, Landmark, Plus, RefreshCw } from 'lucide-vue-next'
import type { InvestmentRecord, InvestmentStatus } from '~/types/database'
import { daysUntilMaturity, formatDateID, formatIDR, toDecimal } from '~/utils/finance'
import { getInvestmentStatusPresentation } from '~/utils/presenters'

const { summary, investments, loading, initialized, refreshAll, syncMaturity } = useFinVault()

const activeFilter = ref<'all' | InvestmentStatus>('all')
const claimingContract = ref<InvestmentRecord | null>(null)
const showMobileModal = ref(false)
const syncing = ref(false)

onMounted(() => {
  if (!initialized.value) {
    refreshAll()
  }
})

const filteredInvestments = computed(() => {
  if (activeFilter.value === 'all') return investments.value
  return investments.value.filter((i) => i.status === activeFilter.value)
})

const filterTabs: { key: 'all' | InvestmentStatus; label: string }[] = [
  { key: 'all', label: 'Semua Kontrak' },
  { key: 'active', label: 'Active' },
  { key: 'matured', label: 'Matured (Siap Cair)' },
  { key: 'claimed', label: 'Claimed' }
]

function progressPercent(inv: InvestmentRecord): number {
  if (inv.status !== 'active') return 100
  const remaining = daysUntilMaturity(inv.maturity_date)
  if (remaining <= 0) return 100
  const elapsed = Math.max(0, inv.duration_days - remaining)
  return Math.min(100, Math.max(4, Math.round((elapsed / inv.duration_days) * 100)))
}

function totalMaturityValue(inv: InvestmentRecord): string {
  return toDecimal(inv.principal_amount)
    .plus(toDecimal(inv.expected_profit_amount))
    .toDecimalPlaces(2, Decimal.ROUND_HALF_UP)
    .toFixed(2)
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
  <div class="space-y-6">
    <header class="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
      <div>
        <h1 class="text-xl font-bold tracking-tight text-white sm:text-2xl">
          Investment Contract Engine
        </h1>
        <p class="mt-1 text-xs text-slate-400 sm:text-sm">
          Kontrak fixed-yield dengan kalkulasi imbal hasil otomatis &amp; mekanisme klaim anti double-claim.
        </p>
      </div>

      <div class="grid grid-cols-2 gap-2 sm:flex sm:items-center sm:gap-2.5">
        <button
          type="button"
          :disabled="syncing || loading"
          class="inline-flex items-center justify-center gap-1.5 rounded-xl border border-vault-border bg-vault-card px-3.5 py-2.5 text-xs font-semibold text-slate-300 transition hover:border-slate-600 hover:text-white active:scale-[0.98] disabled:opacity-50"
          @click="handleSyncMaturity"
        >
          <RefreshCw class="h-3.5 w-3.5" :class="{ 'animate-spin': syncing }" />
          Sync Jatuh Tempo
        </button>
        <button
          type="button"
          class="group inline-flex items-center justify-center gap-1.5 rounded-xl bg-amber-500 px-4 py-2.5 text-xs font-bold text-slate-950 transition hover:bg-amber-400 active:scale-[0.98] lg:hidden"
          @click="showMobileModal = true"
        >
          <Plus class="h-4 w-4 transition-transform duration-300 group-hover:rotate-90" />
          Kontrak Baru
        </button>
      </div>
    </header>

    <!-- Investment KPIs -->
    <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
      <div class="vault-card-interactive rounded-2xl border border-vault-border bg-vault-card p-5">
        <p class="text-xs text-slate-400">Locked Principal (Active + Matured)</p>
        <p class="mt-2 break-words font-mono text-xl font-bold text-amber-300 tabular-nums sm:text-2xl">
          {{ formatIDR(summary.lockedPrincipal) }}
        </p>
      </div>
      <div class="vault-card-interactive rounded-2xl border border-vault-border bg-vault-card p-5">
        <p class="text-xs text-slate-400">Projected Profit (Active)</p>
        <p class="mt-2 break-words font-mono text-xl font-bold text-sky-300 tabular-nums sm:text-2xl">
          +{{ formatIDR(summary.projectedProfit) }}
        </p>
      </div>
      <div class="vault-card-interactive rounded-2xl border border-vault-border bg-vault-card p-5">
        <p class="text-xs text-slate-400">Profit Siap Dicairkan (Matured)</p>
        <p class="mt-2 break-words font-mono text-xl font-bold text-emerald-400 tabular-nums sm:text-2xl">
          +{{ formatIDR(summary.maturedProfit) }}
        </p>
      </div>
    </div>

    <div class="grid grid-cols-1 gap-6 lg:grid-cols-12">
      <!-- Contract List -->
      <div class="space-y-4 lg:col-span-7">
        <div class="rounded-2xl border border-vault-border bg-vault-card p-3">
          <SegmentedTabs v-model="activeFilter" :items="filterTabs" tone="amber" />
        </div>

        <div v-if="loading && !initialized" class="space-y-3">
          <div v-for="i in 4" :key="i" class="h-32 animate-pulse rounded-2xl bg-vault-card" />
        </div>

        <div
          v-else-if="filteredInvestments.length === 0"
          class="rounded-2xl border border-dashed border-vault-border bg-vault-card p-12 text-center"
        >
          <Landmark class="mx-auto h-8 w-8 text-slate-500" />
          <p class="mt-3 text-sm font-semibold text-slate-300">Belum ada kontrak pada status ini</p>
          <p class="mt-1 text-xs text-slate-500">
            Gunakan Simulator Kontrak untuk membuat penempatan investasi baru.
          </p>
          <button
            type="button"
            class="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-amber-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-amber-400 lg:hidden"
            @click="showMobileModal = true"
          >
            <Plus class="h-3.5 w-3.5" />
            Buka Simulator Kontrak
          </button>
        </div>

        <div v-else class="space-y-4">
          <article
            v-for="inv in filteredInvestments"
            :key="inv.id"
            class="vault-card-interactive rounded-2xl border border-vault-border bg-vault-card p-5"
          >
            <div class="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
              <div class="min-w-0">
                <div class="flex flex-wrap items-center gap-2">
                  <span
                    v-if="inv.status === 'matured'"
                    class="relative inline-flex h-2.5 w-2.5 shrink-0"
                    aria-hidden="true"
                  >
                    <span class="vault-ping-ring absolute inset-0 rounded-full bg-amber-400" />
                    <span class="relative inline-flex h-2.5 w-2.5 rounded-full bg-amber-400" />
                  </span>
                  <h3 class="truncate text-base font-bold text-white">{{ inv.title }}</h3>
                  <span
                    class="rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider"
                    :class="getInvestmentStatusPresentation(inv.status).badgeClass"
                  >
                    {{ inv.status }}
                  </span>
                </div>
                <p class="mt-1 text-xs text-slate-400">
                  Mulai {{ formatDateID(inv.start_date) }} · Jatuh Tempo
                  <span class="font-mono text-slate-200">{{ formatDateID(inv.maturity_date) }}</span>
                  ({{ inv.duration_days }} hari)
                </p>
              </div>

              <div class="sm:text-right">
                <p class="text-[11px] uppercase tracking-wider text-slate-400">Total Settlement</p>
                <p class="break-words font-mono text-lg font-bold text-white tabular-nums">
                  {{ formatIDR(totalMaturityValue(inv), true) }}
                </p>
              </div>
            </div>

            <div class="mt-4 grid grid-cols-1 gap-3 rounded-xl bg-vault-bg/80 p-3 text-xs sm:grid-cols-3">
              <div>
                <p class="text-slate-400">Pokok</p>
                <p class="mt-0.5 break-words font-mono font-semibold text-slate-200 tabular-nums">
                  {{ formatIDR(inv.principal_amount) }}
                </p>
              </div>
              <div>
                <p class="text-slate-400">Imbal Hasil</p>
                <p class="mt-0.5 font-mono font-semibold text-amber-300 tabular-nums">
                  {{ inv.expected_return_pct }}%
                </p>
              </div>
              <div>
                <p class="text-slate-400">Profit (DB)</p>
                <p class="mt-0.5 break-words font-mono font-semibold text-sky-300 tabular-nums">
                  +{{ formatIDR(inv.expected_profit_amount, true) }}
                </p>
              </div>
            </div>

            <!-- Tenor Progress Bar -->
            <div class="mt-4">
              <div class="mb-1.5 flex items-center justify-between gap-2 text-[11px]">
                <span class="inline-flex items-center gap-1 text-slate-400">
                  <Clock v-if="inv.status === 'active'" class="h-3.5 w-3.5 shrink-0 text-sky-400" />
                  <CheckCircle2 v-else class="h-3.5 w-3.5 shrink-0 text-emerald-400" />
                  <template v-if="inv.status === 'active'">
                    Sisa {{ Math.max(0, daysUntilMaturity(inv.maturity_date)) }} hari menuju jatuh tempo
                  </template>
                  <template v-else-if="inv.status === 'matured'">
                    Jatuh tempo tercapai — siap dicairkan ke Kas Likuid
                  </template>
                  <template v-else>
                    Sudah dicairkan &amp; masuk ke Kas Likuid
                  </template>
                </span>
                <span class="shrink-0 font-mono text-slate-300">{{ progressPercent(inv) }}%</span>
              </div>
              <div class="h-2 w-full overflow-hidden rounded-full bg-slate-900">
                <div
                  class="h-full rounded-full transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)]"
                  :class="getInvestmentStatusPresentation(inv.status).barClass"
                  :style="{ width: `${progressPercent(inv)}%` }"
                />
              </div>
            </div>

            <div v-if="inv.status === 'matured'" class="mt-4 flex justify-end">
              <button
                type="button"
                class="group inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-xs font-bold text-slate-950 transition hover:bg-emerald-400 active:scale-[0.98] sm:w-auto"
                @click="claimingContract = inv"
              >
                <span>Cairkan / Claim ke Kas Likuid</span>
                <ArrowRight class="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" />
              </button>
            </div>
          </article>
        </div>
      </div>

      <!-- Desktop Embedded Contract Simulator -->
      <aside class="hidden lg:col-span-5 lg:block">
        <div class="sticky top-6 rounded-2xl border border-vault-border bg-vault-card p-6">
          <h2 class="text-base font-bold text-white">Simulator &amp; Kontrak Baru</h2>
          <p class="mt-1 text-xs text-slate-400">
            Hitung proyeksi profit sebelum mengeksekusi penempatan modal.
          </p>
          <div class="mt-5">
            <ContractSimulatorForm />
          </div>
        </div>
      </aside>
    </div>

    <InvestmentModal :open="showMobileModal" @close="showMobileModal = false" />
    <ClaimContractModal :investment="claimingContract" @close="claimingContract = null" />
  </div>
</template>
