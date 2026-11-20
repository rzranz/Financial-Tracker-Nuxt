<script setup lang="ts">
import Decimal from 'decimal.js'
import { Calculator, CalendarClock, Sparkles } from 'lucide-vue-next'
import {
  addDaysUTC,
  computeAnnualizedYieldPct,
  computeExpectedProfit,
  formatDateID,
  formatIDR,
  todayUTC,
  toDecimal
} from '~/utils/finance'

const emit = defineEmits<{
  (e: 'created'): void
}>()

const { summary, createInvestment } = useFinVault()

const title = ref('')
const principalAmount = ref('10000000')
const expectedReturnPct = ref('5.50')
const durationDays = ref(90)
const startDate = ref(todayUTC())
const deductFromCash = ref(true)
const submitting = ref(false)
const errorMessage = ref('')

const presets = [
  { label: 'Deposito 30H (0.50%)', title: 'Deposito Digital 30 Hari', pct: '0.50', days: 30 },
  { label: 'P2P 60H (2.40%)', title: 'P2P Lending Tenor 60 Hari', pct: '2.40', days: 60 },
  { label: 'SBN / Obligasi 90H (1.65%)', title: 'SBN Jangka Pendek 90 Hari', pct: '1.65', days: 90 }
]

function applyPreset(preset: (typeof presets)[number]) {
  title.value = preset.title
  expectedReturnPct.value = preset.pct
  durationDays.value = preset.days
}

const simulation = computed(() => {
  const validPrincipal = /^\d+(\.\d{1,2})?$/.test(principalAmount.value.trim())
    ? principalAmount.value.trim()
    : '0'
  const validPct = /^\d+(\.\d{1,2})?$/.test(expectedReturnPct.value.trim())
    ? expectedReturnPct.value.trim()
    : '0'
  const days = Math.max(1, Number(durationDays.value) || 1)

  const profit = computeExpectedProfit(validPrincipal, validPct)
  const totalMaturity = toDecimal(validPrincipal)
    .plus(toDecimal(profit))
    .toDecimalPlaces(2, Decimal.ROUND_HALF_UP)
    .toFixed(2)
  const maturityDate = addDaysUTC(startDate.value || todayUTC(), days)
  const apr = computeAnnualizedYieldPct(validPct, days)

  const insufficientCash =
    deductFromCash.value && toDecimal(summary.value.liquidCash).lt(toDecimal(validPrincipal))

  return {
    profit,
    totalMaturity,
    maturityDate,
    apr,
    insufficientCash
  }
})

async function handleSubmit() {
  errorMessage.value = ''
  const cleanPrincipal = principalAmount.value.replace(/,/g, '.').trim()
  const cleanPct = expectedReturnPct.value.replace(/,/g, '.').trim()

  if (!title.value.trim() || title.value.trim().length < 2) {
    errorMessage.value = 'Nama instrumen minimal 2 karakter.'
    return
  }
  if (!/^\d+(\.\d{1,2})?$/.test(cleanPrincipal) || Number(cleanPrincipal) <= 0) {
    errorMessage.value = 'Pokok investasi harus angka valid lebih besar dari 0.'
    return
  }
  if (!/^\d+(\.\d{1,2})?$/.test(cleanPct) || Number(cleanPct) < 0) {
    errorMessage.value = 'Persentase imbal hasil harus angka valid (>= 0).'
    return
  }
  if (simulation.value.insufficientCash) {
    errorMessage.value = 'Saldo Kas Likuid tidak mencukupi untuk pemotongan modal.'
    return
  }

  submitting.value = true
  try {
    await createInvestment({
      title: title.value.trim(),
      principal_amount: cleanPrincipal,
      expected_return_pct: cleanPct,
      duration_days: Number(durationDays.value),
      start_date: startDate.value,
      deduct_from_cash: deductFromCash.value
    })
    title.value = ''
    emit('created')
  } catch (err: unknown) {
    errorMessage.value =
      (err as { data?: { statusMessage?: string }; statusMessage?: string })?.data?.statusMessage ||
      (err as { statusMessage?: string })?.statusMessage ||
      'Gagal membuat kontrak investasi'
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <form class="space-y-4" @submit.prevent="handleSubmit">
    <!-- Presets -->
    <div class="flex flex-wrap gap-1.5">
      <button
        v-for="preset in presets"
        :key="preset.label"
        type="button"
        class="inline-flex items-center gap-1 rounded-lg border border-vault-border bg-vault-bg px-2.5 py-1 text-[11px] font-medium text-slate-300 transition hover:border-amber-500/40 hover:text-amber-300"
        @click="applyPreset(preset)"
      >
        <Sparkles class="h-3 w-3 text-amber-400" />
        {{ preset.label }}
      </button>
    </div>

    <div class="space-y-1.5">
      <label for="inv-title" class="block text-xs font-medium text-slate-300">
        Nama Kontrak / Instrumen
      </label>
      <input
        id="inv-title"
        v-model="title"
        type="text"
        required
        placeholder="Misal: Deposito SeaBank 3 Bulan"
        class="w-full rounded-xl border border-vault-border bg-vault-bg px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none"
      />
    </div>

    <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <div class="space-y-1.5">
        <label for="inv-principal" class="block text-xs font-medium text-slate-300">
          Modal Pokok (IDR)
        </label>
        <input
          id="inv-principal"
          v-model="principalAmount"
          type="text"
          inputmode="decimal"
          required
          class="w-full rounded-xl border border-vault-border bg-vault-bg px-3.5 py-2.5 font-mono text-sm text-white focus:border-amber-500 focus:outline-none"
        />
      </div>

      <div class="space-y-1.5">
        <label for="inv-pct" class="block text-xs font-medium text-slate-300">
          Imbal Hasil Kontrak (%)
        </label>
        <input
          id="inv-pct"
          v-model="expectedReturnPct"
          type="text"
          inputmode="decimal"
          required
          class="w-full rounded-xl border border-vault-border bg-vault-bg px-3.5 py-2.5 font-mono text-sm text-white focus:border-amber-500 focus:outline-none"
        />
      </div>
    </div>

    <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <div class="space-y-1.5">
        <label for="inv-days" class="block text-xs font-medium text-slate-300">
          Durasi Tenor (Hari)
        </label>
        <input
          id="inv-days"
          v-model.number="durationDays"
          type="number"
          min="1"
          max="36500"
          required
          class="w-full rounded-xl border border-vault-border bg-vault-bg px-3.5 py-2.5 font-mono text-sm text-white focus:border-amber-500 focus:outline-none"
        />
      </div>

      <div class="space-y-1.5">
        <label for="inv-start" class="block text-xs font-medium text-slate-300">
          Tanggal Mulai
        </label>
        <input
          id="inv-start"
          v-model="startDate"
          type="date"
          required
          class="w-full rounded-xl border border-vault-border bg-vault-bg px-3.5 py-2.5 text-sm text-white focus:border-amber-500 focus:outline-none"
        />
      </div>
    </div>

    <!-- Deduct from Liquid Cash checkbox -->
    <label
      class="flex cursor-pointer items-start gap-3 rounded-xl border border-vault-border bg-vault-bg/70 p-3.5 transition hover:border-slate-700"
    >
      <input
        v-model="deductFromCash"
        type="checkbox"
        class="mt-0.5 h-4 w-4 rounded border-slate-600 bg-vault-card text-emerald-500 focus:ring-emerald-500"
      />
      <div class="text-xs">
        <p class="font-semibold text-slate-200">Potong modal dari Kas Likuid sekarang</p>
        <p class="mt-0.5 text-slate-400">
          Mencatat mutasi <span class="font-mono text-amber-300">investment_out</span> secara atomik.
          Saldo tersedia:
          <span class="font-mono font-semibold text-emerald-400">{{ formatIDR(summary.liquidCash) }}</span>
        </p>
      </div>
    </label>

    <!-- Live Yield Simulator Preview -->
    <div class="rounded-xl border border-amber-500/25 bg-amber-500/5 p-4">
      <div class="flex items-center justify-between text-xs">
        <span class="inline-flex items-center gap-1.5 font-semibold text-amber-300">
          <Calculator class="h-3.5 w-3.5" />
          Simulasi Output Kontrak (DB Precision)
        </span>
        <span class="font-mono text-[11px] text-slate-400">~{{ simulation.apr }}% APR</span>
      </div>

      <div class="mt-3 grid grid-cols-2 gap-3 text-xs">
        <div>
          <p class="text-slate-400">Proyeksi Profit</p>
          <p class="mt-0.5 font-mono text-sm font-bold text-sky-300 tabular-nums">
            +{{ formatIDR(simulation.profit, true) }}
          </p>
        </div>
        <div>
          <p class="text-slate-400">Total Saat Cair</p>
          <p class="mt-0.5 font-mono text-sm font-bold text-white tabular-nums">
            {{ formatIDR(simulation.totalMaturity, true) }}
          </p>
        </div>
      </div>

      <div class="mt-3 flex items-center gap-1.5 border-t border-white/10 pt-2.5 text-xs text-slate-300">
        <CalendarClock class="h-3.5 w-3.5 text-amber-400" />
        <span>Jatuh tempo otomatis pada:</span>
        <span class="font-mono font-semibold text-white">{{ formatDateID(simulation.maturityDate) }}</span>
      </div>
    </div>

    <p
      v-if="simulation.insufficientCash"
      class="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-300"
    >
      Kas Likuid saat ini tidak cukup untuk modal ini. Tambah pemasukan atau matikan opsi pemotongan kas.
    </p>

    <p
      v-if="errorMessage"
      class="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-300"
    >
      {{ errorMessage }}
    </p>

    <button
      type="submit"
      :disabled="submitting || simulation.insufficientCash"
      class="w-full rounded-xl bg-amber-500 px-4 py-3 text-xs font-bold text-slate-950 transition hover:bg-amber-400 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
    >
      {{ submitting ? 'Membuat Kontrak...' : 'Aktifkan Kontrak Investasi' }}
    </button>
  </form>
</template>
