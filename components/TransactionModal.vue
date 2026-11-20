<script setup lang="ts">
import { ArrowDownLeft, ArrowUpRight, X } from 'lucide-vue-next'
import { formatIDR, todayUTC } from '~/utils/finance'

const props = defineProps<{
  open: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const { createTransaction } = useFinVault()

const type = ref<'income' | 'expense'>('income')
const category = ref('Gaji')
const amount = ref('')
const note = ref('')
const transactionDate = ref(todayUTC())
const submitting = ref(false)
const errorMessage = ref('')

const incomeCategories = ['Gaji', 'Freelance', 'Bisnis', 'Bonus', 'Dividen', 'Lainnya']
const expenseCategories = [
  'Makan & Minum',
  'Hunian & Utilitas',
  'Transportasi',
  'Belanja & Gaya Hidup',
  'Kesehatan',
  'Lainnya'
]

const categoryOptions = computed(() =>
  type.value === 'income' ? incomeCategories : expenseCategories
)

watch(type, (nextType: 'income' | 'expense') => {
  category.value = nextType === 'income' ? incomeCategories[0] : expenseCategories[0]
})

watch(
  () => props.open,
  (isOpen: boolean) => {
    if (isOpen) {
      errorMessage.value = ''
    }
  }
)

const formattedPreview = computed(() => {
  if (!amount.value || Number.isNaN(Number(amount.value))) return 'Rp 0'
  return formatIDR(amount.value, true)
})

async function handleSubmit() {
  errorMessage.value = ''
  const cleanedAmount = amount.value.replace(/,/g, '.').trim()
  if (!/^\d+(\.\d{1,2})?$/.test(cleanedAmount) || Number(cleanedAmount) <= 0) {
    errorMessage.value = 'Masukkan nominal valid lebih besar dari 0 (maksimal 2 desimal).'
    return
  }

  submitting.value = true
  try {
    await createTransaction({
      type: type.value,
      category: category.value,
      amount: cleanedAmount,
      note: note.value.trim() || null,
      transaction_date: transactionDate.value
    })
    amount.value = ''
    note.value = ''
    emit('close')
  } catch (err: unknown) {
    errorMessage.value =
      (err as { data?: { statusMessage?: string }; statusMessage?: string })?.data?.statusMessage ||
      (err as { statusMessage?: string })?.statusMessage ||
      'Gagal menyimpan transaksi'
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
      @click.self="emit('close')"
    >
      <div class="w-full max-w-lg rounded-2xl border border-vault-border bg-vault-surface p-6 shadow-2xl">
        <div class="flex items-center justify-between border-b border-vault-border pb-4">
          <div>
            <h2 class="text-base font-bold text-white">Catat Mutasi Kas Riil</h2>
            <p class="mt-0.5 text-xs text-slate-400">
              Mengubah nilai Liquid Cash secara presisi (NUMERIC 15,2)
            </p>
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

        <form class="mt-5 space-y-4" @submit.prevent="handleSubmit">
          <!-- Type Switcher -->
          <div class="grid grid-cols-2 gap-2 rounded-xl border border-vault-border bg-vault-bg p-1">
            <button
              type="button"
              class="flex items-center justify-center gap-2 rounded-lg py-2.5 text-xs font-semibold transition"
              :class="
                type === 'income'
                  ? 'bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              "
              @click="type = 'income'"
            >
              <ArrowDownLeft class="h-4 w-4" />
              Kas Masuk (Income)
            </button>
            <button
              type="button"
              class="flex items-center justify-center gap-2 rounded-lg py-2.5 text-xs font-semibold transition"
              :class="
                type === 'expense'
                  ? 'bg-rose-500/15 text-rose-300 ring-1 ring-rose-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              "
              @click="type = 'expense'"
            >
              <ArrowUpRight class="h-4 w-4" />
              Kas Keluar (Expense)
            </button>
          </div>

          <!-- Amount -->
          <div class="space-y-1.5">
            <div class="flex items-center justify-between">
              <label for="tx-amount" class="text-xs font-medium text-slate-300">
                Nominal (IDR)
              </label>
              <span class="font-mono text-xs font-semibold text-emerald-400 tabular-nums">
                {{ formattedPreview }}
              </span>
            </div>
            <input
              id="tx-amount"
              v-model="amount"
              type="text"
              inputmode="decimal"
              placeholder="Contoh: 5000000 atau 150000.50"
              required
              class="w-full rounded-xl border border-vault-border bg-vault-card px-3.5 py-2.5 font-mono text-sm text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <!-- Category Pills -->
          <div class="space-y-2">
            <label for="tx-category" class="block text-xs font-medium text-slate-300">
              Kategori
            </label>
            <div class="flex flex-wrap gap-1.5">
              <button
                v-for="item in categoryOptions"
                :key="item"
                type="button"
                class="rounded-lg border px-2.5 py-1 text-xs font-medium transition"
                :class="
                  category === item
                    ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-300'
                    : 'border-vault-border bg-vault-card text-slate-400 hover:text-slate-200'
                "
                @click="category = item"
              >
                {{ item }}
              </button>
            </div>
            <input
              id="tx-category"
              v-model="category"
              type="text"
              required
              placeholder="Atau ketik kategori khusus..."
              class="w-full rounded-xl border border-vault-border bg-vault-card px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <!-- Date & Note -->
          <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div class="space-y-1.5">
              <label for="tx-date" class="block text-xs font-medium text-slate-300">
                Tanggal Transaksi
              </label>
              <input
                id="tx-date"
                v-model="transactionDate"
                type="date"
                class="w-full rounded-xl border border-vault-border bg-vault-card px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <div class="space-y-1.5">
              <label for="tx-note" class="block text-xs font-medium text-slate-300">
                Catatan (Opsional)
              </label>
              <input
                id="tx-note"
                v-model="note"
                type="text"
                maxlength="240"
                placeholder="Keterangan mutasi..."
                class="w-full rounded-xl border border-vault-border bg-vault-card px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <p
            v-if="errorMessage"
            class="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-300"
          >
            {{ errorMessage }}
          </p>

          <div class="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              class="rounded-xl border border-vault-border px-4 py-2.5 text-xs font-semibold text-slate-300 transition hover:bg-slate-800"
              @click="emit('close')"
            >
              Batal
            </button>
            <button
              type="submit"
              :disabled="submitting"
              class="rounded-xl bg-emerald-500 px-5 py-2.5 text-xs font-semibold text-slate-950 transition hover:bg-emerald-400 active:scale-[0.98] disabled:opacity-50"
            >
              {{ submitting ? 'Menyimpan...' : 'Simpan Mutasi' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </Teleport>
</template>
