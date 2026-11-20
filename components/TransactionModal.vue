<script setup lang="ts">
import { extractApiErrorMessage } from '~/utils/errors'
import { formatIDR, todayUTC } from '~/utils/finance'

const props = withDefaults(
  defineProps<{
    open: boolean
    initialType?: 'income' | 'expense'
  }>(),
  {
    initialType: 'income'
  }
)

const emit = defineEmits<{
  (e: 'close'): void
}>()

const { createTransaction } = useFinVault()

const type = ref<'income' | 'expense'>(props.initialType)
const category = ref(props.initialType === 'income' ? 'Gaji' : 'Makan & Minum')
const amount = ref('')
const note = ref('')
const transactionDate = ref(todayUTC())
const submitting = ref(false)
const errorMessage = ref('')

const typeTabs: { key: 'income' | 'expense'; label: string }[] = [
  { key: 'income', label: '+ Kas Masuk (Income)' },
  { key: 'expense', label: '- Kas Keluar (Expense)' }
]

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
      type.value = props.initialType
      category.value = props.initialType === 'income' ? incomeCategories[0] : expenseCategories[0]
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
    errorMessage.value = extractApiErrorMessage(err, 'Gagal menyimpan transaksi')
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <BaseModal
    :open="open"
    title="Catat Mutasi Kas Riil"
    subtitle="Mengubah nilai Liquid Cash secara presisi (NUMERIC 15,2)"
    @close="emit('close')"
  >
    <form class="space-y-4" @submit.prevent="handleSubmit">
      <!-- Sliding / Morphing Type Switcher -->
      <SegmentedTabs v-model="type" :items="typeTabs" full-width />

      <!-- Amount -->
      <div class="space-y-1.5">
        <div class="flex flex-wrap items-center justify-between gap-2">
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
          class="w-full rounded-xl border border-vault-border bg-vault-card px-3.5 py-2.5 font-mono text-sm text-white placeholder-slate-500 transition focus:border-emerald-500 focus:outline-none"
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
            class="rounded-lg border px-2.5 py-1 text-xs font-medium transition-all duration-200 active:scale-[0.96]"
            :class="
              category === item
                ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-300'
                : 'border-vault-border bg-vault-card text-slate-400 hover:border-slate-600 hover:text-slate-200'
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
          class="w-full rounded-xl border border-vault-border bg-vault-card px-3.5 py-2 text-sm text-white placeholder-slate-500 transition focus:border-emerald-500 focus:outline-none"
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
            class="w-full rounded-xl border border-vault-border bg-vault-card px-3 py-2 text-sm text-white transition focus:border-emerald-500 focus:outline-none"
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
            class="w-full rounded-xl border border-vault-border bg-vault-card px-3 py-2 text-sm text-white placeholder-slate-500 transition focus:border-emerald-500 focus:outline-none"
          />
        </div>
      </div>

      <p
        v-if="errorMessage"
        class="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-300"
      >
        {{ errorMessage }}
      </p>

      <div class="flex flex-col-reverse gap-2.5 pt-2 sm:flex-row sm:justify-end">
        <button
          type="button"
          class="w-full rounded-xl border border-vault-border px-4 py-2.5 text-xs font-semibold text-slate-300 transition hover:bg-slate-800 active:scale-[0.98] sm:w-auto"
          @click="emit('close')"
        >
          Batal
        </button>
        <button
          type="submit"
          :disabled="submitting"
          class="w-full rounded-xl bg-emerald-500 px-5 py-2.5 text-xs font-bold text-slate-950 transition hover:bg-emerald-400 active:scale-[0.98] disabled:opacity-50 sm:w-auto"
        >
          {{ submitting ? 'Menyimpan...' : 'Simpan Mutasi' }}
        </button>
      </div>
    </form>
  </BaseModal>
</template>
