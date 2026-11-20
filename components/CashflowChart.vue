<script setup lang="ts">
import Decimal from 'decimal.js'
import type { FinancialSummary } from '~/types/database'
import { formatIDR, toDecimal } from '~/utils/finance'

const props = defineProps<{
  summary: FinancialSummary
}>()

const bars = computed(() => {
  const items = [
    { label: 'Income', value: toDecimal(props.summary.totalIncome), color: 'bg-emerald-500' },
    { label: 'Claimed ROI + Pokok', value: toDecimal(props.summary.totalInvestmentIn), color: 'bg-sky-400' },
    { label: 'Expense', value: toDecimal(props.summary.totalExpense), color: 'bg-rose-500' },
    { label: 'Penempatan Kontrak', value: toDecimal(props.summary.totalInvestmentOut), color: 'bg-amber-500' }
  ]

  const maxVal = items.reduce((acc, item) => Decimal.max(acc, item.value), new Decimal(1))

  return items.map((item) => ({
    ...item,
    formatted: formatIDR(item.value.toFixed(2)),
    pct: item.value.div(maxVal).times(100).toDecimalPlaces(1).toNumber()
  }))
})
</script>

<template>
  <div class="rounded-2xl border border-vault-border bg-vault-card p-5">
    <div class="flex items-center justify-between">
      <div>
        <h3 class="text-sm font-semibold text-white">Aliran Mutasi Kas Riil</h3>
        <p class="mt-0.5 text-xs text-slate-400">
          Perbandingan arus masuk vs keluar berdasarkan ledger aktual
        </p>
      </div>
    </div>

    <div class="mt-5 space-y-4">
      <div v-for="bar in bars" :key="bar.label" class="space-y-1.5">
        <div class="flex items-center justify-between text-xs">
          <span class="font-medium text-slate-300">{{ bar.label }}</span>
          <span class="font-mono font-semibold text-slate-100 tabular-nums">
            {{ bar.formatted }}
          </span>
        </div>
        <div class="h-2 w-full overflow-hidden rounded-full bg-slate-900">
          <div
            class="h-full rounded-full transition-all duration-500"
            :class="bar.color"
            :style="{ width: `${bar.pct}%` }"
          />
        </div>
      </div>
    </div>
  </div>
</template>
