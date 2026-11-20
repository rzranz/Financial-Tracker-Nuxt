<script setup lang="ts">
import Decimal from 'decimal.js'
import { CheckCircle2, ShieldAlert, X } from 'lucide-vue-next'
import type { InvestmentRecord } from '~/types/database'
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
    errorMessage.value =
      (err as { data?: { statusMessage?: string }; statusMessage?: string })?.data?.statusMessage ||
      (err as { statusMessage?: string })?.statusMessage ||
      'Gagal mencairkan kontrak investasi'
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="investment"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
      @click.self="emit('close')"
    >
      <div class="w-full max-w-md rounded-2xl border border-vault-border bg-vault-surface p-6 shadow-2xl">
        <div class="flex items-center justify-between border-b border-vault-border pb-4">
          <div class="flex items-center gap-2.5">
            <div
              class="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400"
            >
              <CheckCircle2 class="h-5 w-5" />
            </div>
            <div>
              <h2 class="text-base font-bold text-white">Konfirmasi Pencairan Kontrak</h2>
              <p class="text-xs text-slate-400">Settlement Modal + Imbal Hasil ke Kas Likuid</p>
            </div>
          </div>
          <button
            type="button"
            class="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-800 hover:text-white"
            aria-label="Tutup modal"
            @click="emit('close')"
          >
            <X class="h-4 w-4" />
          </button>
        </div>

        <div class="mt-5 space-y-3 rounded-xl border border-vault-border bg-vault-card p-4 text-xs">
          <div class="flex items-center justify-between">
            <span class="text-slate-400">Instrumen</span>
            <span class="font-semibold text-white">{{ investment.title }}</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-slate-400">Tanggal Jatuh Tempo</span>
            <span class="font-mono text-slate-200">{{ formatDateID(investment.maturity_date) }}</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-slate-400">Pokok Modal</span>
            <span class="font-mono text-slate-200 tabular-nums">
              {{ formatIDR(investment.principal_amount, true) }}
            </span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-slate-400">Profit ({{ investment.expected_return_pct }}%)</span>
            <span class="font-mono text-emerald-400 tabular-nums">
              +{{ formatIDR(investment.expected_profit_amount, true) }}
            </span>
          </div>
          <div class="flex items-center justify-between border-t border-white/10 pt-3 text-sm">
            <span class="font-semibold text-slate-200">Total Masuk Kas Likuid</span>
            <span class="font-mono font-bold text-emerald-300 tabular-nums">
              {{ formatIDR(totalSettlement, true) }}
            </span>
          </div>
        </div>

        <div class="mt-4 flex items-start gap-2 rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-xs text-amber-200">
          <ShieldAlert class="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
          <p>
            Aksi ini bersifat final: status kontrak berubah menjadi <span class="font-mono">CLAIMED</span>
            dan mutasi <span class="font-mono">investment_in</span> tercatat otomatis.
          </p>
        </div>

        <p
          v-if="errorMessage"
          class="mt-3 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-300"
        >
          {{ errorMessage }}
        </p>

        <div class="mt-5 flex items-center justify-end gap-2.5">
          <button
            type="button"
            class="rounded-xl border border-vault-border px-4 py-2.5 text-xs font-semibold text-slate-300 transition hover:bg-slate-800"
            @click="emit('close')"
          >
            Batal
          </button>
          <button
            type="button"
            :disabled="submitting"
            class="rounded-xl bg-emerald-500 px-5 py-2.5 text-xs font-bold text-slate-950 transition hover:bg-emerald-400 active:scale-[0.98] disabled:opacity-50"
            @click="handleClaim"
          >
            {{ submitting ? 'Memproses...' : 'Cairkan Sekarang' }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
