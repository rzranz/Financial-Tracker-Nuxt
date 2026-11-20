<script setup lang="ts">
import Decimal from 'decimal.js'
import { Lock, Sparkles, TrendingUp, Wallet } from 'lucide-vue-next'
import type { FinancialSummary } from '~/types/database'
import { formatIDR, toDecimal } from '~/utils/finance'

const props = defineProps<{
  summary: FinancialSummary
  loading?: boolean
}>()

const allocation = computed(() => {
  const liquid = Decimal.max(toDecimal(props.summary.liquidCash), 0)
  const locked = Decimal.max(toDecimal(props.summary.lockedPrincipal), 0)
  const profit = Decimal.max(toDecimal(props.summary.projectedProfit), 0)
  const total = liquid.plus(locked).plus(profit)

  if (total.lte(0)) {
    return { liquidPct: 0, lockedPct: 0, profitPct: 0 }
  }

  const liquidPct = liquid.div(total).times(100).toDecimalPlaces(1).toNumber()
  const lockedPct = locked.div(total).times(100).toDecimalPlaces(1).toNumber()
  const profitPct = Math.max(0, Number((100 - liquidPct - lockedPct).toFixed(1)))

  return { liquidPct, lockedPct, profitPct }
})
</script>

<template>
  <section class="space-y-4">
    <div class="grid grid-cols-1 gap-4 lg:grid-cols-12">
      <!-- Primary Liquid Cash Reality Card -->
      <div
        class="relative overflow-hidden rounded-2xl border border-emerald-500/25 bg-gradient-to-br from-vault-card via-vault-card to-emerald-950/30 p-6 lg:col-span-5"
      >
        <div class="flex items-center justify-between gap-2">
          <span
            class="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-emerald-300"
          >
            <Wallet class="h-3.5 w-3.5" />
            Kas Likuid (Uang Riil)
          </span>
          <span class="font-mono text-[11px] text-slate-400">C_l</span>
        </div>

        <div class="mt-5">
          <div
            v-if="loading"
            class="h-10 w-56 animate-pulse rounded-lg bg-slate-800"
          />
          <p
            v-else
            class="font-mono text-3xl font-bold tracking-tight text-white tabular-nums sm:text-4xl"
          >
            {{ formatIDR(summary.liquidCash) }}
          </p>
          <p class="mt-2 text-xs leading-relaxed text-slate-400">
            Saldo nyata hasil mutasi <span class="text-slate-200">income + investment_in</span>
            dikurangi <span class="text-slate-200">expense + investment_out</span>.
          </p>
        </div>

        <div class="mt-5 grid grid-cols-2 gap-3 border-t border-white/10 pt-4 text-xs">
          <div>
            <p class="text-slate-400">Total Masuk</p>
            <p class="mt-0.5 font-mono font-semibold text-emerald-400 tabular-nums">
              +{{ formatIDR(summary.totalIncome) }}
            </p>
          </div>
          <div>
            <p class="text-slate-400">Total Belanja</p>
            <p class="mt-0.5 font-mono font-semibold text-rose-400 tabular-nums">
              -{{ formatIDR(summary.totalExpense) }}
            </p>
          </div>
        </div>
      </div>

      <!-- Secondary 3 Metrics: Locked Principal, Projected Profit, Total Projected Net Worth -->
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-3 lg:col-span-7">
        <!-- Locked Principal -->
        <div class="flex flex-col justify-between rounded-2xl border border-vault-border bg-vault-card p-5">
          <div>
            <div class="flex items-center justify-between">
              <span
                class="inline-flex items-center gap-1.5 rounded-full border border-amber-500/25 bg-amber-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-amber-300"
              >
                <Lock class="h-3 w-3" />
                Locked Principal
              </span>
              <span class="font-mono text-[11px] text-slate-500">P_l</span>
            </div>
            <div v-if="loading" class="mt-4 h-8 w-36 animate-pulse rounded-lg bg-slate-800" />
            <p
              v-else
              class="mt-4 font-mono text-2xl font-bold text-slate-100 tabular-nums"
            >
              {{ formatIDR(summary.lockedPrincipal) }}
            </p>
          </div>
          <p class="mt-4 text-xs text-slate-400">
            {{ summary.activeCount }} aktif · {{ summary.maturedCount }} siap cair
          </p>
        </div>

        <!-- Projected Profit -->
        <div class="flex flex-col justify-between rounded-2xl border border-vault-border bg-vault-card p-5">
          <div>
            <div class="flex items-center justify-between">
              <span
                class="inline-flex items-center gap-1.5 rounded-full border border-sky-500/25 bg-sky-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-sky-300"
              >
                <TrendingUp class="h-3 w-3" />
                Projected Profit
              </span>
              <span class="font-mono text-[11px] text-slate-500">R_p</span>
            </div>
            <div v-if="loading" class="mt-4 h-8 w-36 animate-pulse rounded-lg bg-slate-800" />
            <p
              v-else
              class="mt-4 font-mono text-2xl font-bold text-sky-300 tabular-nums"
            >
              +{{ formatIDR(summary.projectedProfit) }}
            </p>
          </div>
          <p class="mt-4 text-xs text-slate-400">
            Estimasi ROI kontrak aktif (belum cair)
          </p>
        </div>

        <!-- Projected Net Worth -->
        <div class="flex flex-col justify-between rounded-2xl border border-vault-border bg-vault-card p-5">
          <div>
            <div class="flex items-center justify-between">
              <span
                class="inline-flex items-center gap-1.5 rounded-full border border-slate-600/40 bg-slate-800 px-2.5 py-0.5 text-[11px] font-semibold text-slate-200"
              >
                <Sparkles class="h-3 w-3 text-amber-400" />
                Projected Net Worth
              </span>
              <span class="font-mono text-[11px] text-slate-500">N_p</span>
            </div>
            <div v-if="loading" class="mt-4 h-8 w-36 animate-pulse rounded-lg bg-slate-800" />
            <p
              v-else
              class="mt-4 font-mono text-2xl font-bold text-white tabular-nums"
            >
              {{ formatIDR(summary.projectedNetWorth) }}
            </p>
          </div>
          <p class="mt-4 text-xs text-slate-400">
            Gabungan C_l + P_l + R_p
          </p>
        </div>
      </div>
    </div>

    <!-- Capital Allocation Bar -->
    <div class="rounded-2xl border border-vault-border bg-vault-card px-5 py-4">
      <div class="flex flex-wrap items-center justify-between gap-2 text-xs">
        <span class="font-semibold text-slate-300">Komposisi Kekayaan &amp; Likuiditas</span>
        <div class="flex flex-wrap items-center gap-4 text-slate-400">
          <span class="inline-flex items-center gap-1.5">
            <span class="h-2 w-2 rounded-full bg-emerald-400" />
            Likuid {{ allocation.liquidPct }}%
          </span>
          <span class="inline-flex items-center gap-1.5">
            <span class="h-2 w-2 rounded-full bg-amber-400" />
            Modal Terikat {{ allocation.lockedPct }}%
          </span>
          <span class="inline-flex items-center gap-1.5">
            <span class="h-2 w-2 rounded-full bg-sky-400" />
            Proyeksi ROI {{ allocation.profitPct }}%
          </span>
        </div>
      </div>
      <div class="mt-3 flex h-2.5 w-full overflow-hidden rounded-full bg-slate-900">
        <div
          class="bg-emerald-500 transition-all duration-500"
          :style="{ width: `${allocation.liquidPct}%` }"
        />
        <div
          class="bg-amber-500 transition-all duration-500"
          :style="{ width: `${allocation.lockedPct}%` }"
        />
        <div
          class="bg-sky-400 transition-all duration-500"
          :style="{ width: `${allocation.profitPct}%` }"
        />
      </div>
    </div>
  </section>
</template>
