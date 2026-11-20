<script setup lang="ts">
import Decimal from 'decimal.js'
import { CheckCircle2, ShieldAlert } from 'lucide-vue-next'
import type { InvestmentRecord } from '~/types/database'
import { extractApiErrorMessage } from '~/utils/errors'
import { formatDateID, formatIDR, toDecimal } from '~/utils/finance'

const props = defineProps<{
  investment: InvestmentRecord | null
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const { claimInvestment } = useFinVault()
const submitting = ref(false)
const errorMessage = ref('')

watch(
  () => props.investment,
  () => {
    errorMessage.value = ''
  }
)

const totalSettlement = computed(() => {
  if (!props.investment) return '0.00'
  return toDecimal(props.investment.principal_amount)
    .plus(toDecimal(props.investment.expected_profit_amount))
    .toDecimalPlaces(2, Decimal.ROUND_HALF_UP)
    .toFixed(2)
})

async function handleClaim() {
  if (!props.investment || submitting.value) return
  submitting.value = true
  errorMessage.value = ''
  try {
    await claimInvestment(props.investment.id)
    emit('close')
  } catch (err: unknown) {
    errorMessage.value = extractApiErrorMessage(err, 'Gagal mencairkan kontrak investasi')
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <BaseModal
    :open="Boolean(investment)"
    title="Konfirmasi Pencairan Kontrak"
    max-width-class="max-w-md"
    @close="emit('close')"
  >
    <template #header>
      <div class="flex items-center gap-2.5">
        <div
          class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400"
        >
          <CheckCircle2 class="h-5 w-5" />
        </div>
        <div>
          <h2 class="text-base font-bold text-white">Konfirmasi Pencairan Kontrak</h2>
          <p class="text-xs text-slate-400">Settlement Modal + Imbal Hasil ke Kas Likuid</p>
        </div>
      </div>
    </template>

    <div v-if="investment" class="space-y-4">
      <div class="space-y-3 rounded-xl border border-vault-border bg-vault-card p-4 text-xs">
        <div class="flex items-center justify-between gap-2">
          <span class="text-slate-400">Instrumen</span>
          <span class="text-right font-semibold text-white">{{ investment.title }}</span>
        </div>
        <div class="flex items-center justify-between gap-2">
          <span class="text-slate-400">Tanggal Jatuh Tempo</span>
          <span class="font-mono text-slate-200">{{ formatDateID(investment.maturity_date) }}</span>
        </div>
        <div class="flex items-center justify-between gap-2">
          <span class="text-slate-400">Pokok Modal</span>
          <span class="font-mono text-slate-200 tabular-nums">
            {{ formatIDR(investment.principal_amount, true) }}
          </span>
        </div>
        <div class="flex items-center justify-between gap-2">
          <span class="text-slate-400">Profit ({{ investment.expected_return_pct }}%)</span>
          <span class="font-mono text-emerald-400 tabular-nums">
            +{{ formatIDR(investment.expected_profit_amount, true) }}
          </span>
        </div>
        <div class="flex flex-wrap items-center justify-between gap-2 border-t border-white/10 pt-3 text-sm">
          <span class="font-semibold text-slate-200">Total Masuk Kas Likuid</span>
          <span class="font-mono font-bold text-emerald-300 tabular-nums">
            {{ formatIDR(totalSettlement, true) }}
          </span>
        </div>
      </div>

      <div class="flex items-start gap-2 rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-xs text-amber-200">
        <ShieldAlert class="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
        <p>
          Aksi ini bersifat final: status kontrak berubah menjadi <span class="font-mono">CLAIMED</span>
          dan mutasi <span class="font-mono">investment_in</span> tercatat otomatis.
        </p>
      </div>

      <p
        v-if="errorMessage"
        class="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-300"
      >
        {{ errorMessage }}
      </p>

      <div class="flex flex-col-reverse gap-2.5 pt-1 sm:flex-row sm:justify-end">
        <button
          type="button"
          class="w-full rounded-xl border border-vault-border px-4 py-2.5 text-xs font-semibold text-slate-300 transition hover:bg-slate-800 sm:w-auto"
          @click="emit('close')"
        >
          Batal
        </button>
        <button
          type="button"
          :disabled="submitting"
          class="w-full rounded-xl bg-emerald-500 px-5 py-2.5 text-xs font-bold text-slate-950 transition hover:bg-emerald-400 active:scale-[0.98] disabled:opacity-50 sm:w-auto"
          @click="handleClaim"
        >
          {{ submitting ? 'Memproses...' : 'Cairkan Sekarang' }}
        </button>
      </div>
    </div>
  </BaseModal>
</template>
