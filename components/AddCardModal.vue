<script setup lang="ts">
import { Check, Sparkles } from 'lucide-vue-next'
import {
  CARD_THEMES,
  type CardThemeKey,
  type WalletCardConfig,
  buildCustomWalletCard
} from '~/utils/cards'
import { extractApiErrorMessage } from '~/utils/errors'

const props = defineProps<{
  open: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'created', card: WalletCardConfig): void
}>()

const { addCustomCard } = useWalletCards()

const name = ref('')
const shortLabel = ref('')
const last4 = ref('')
const theme = ref<CardThemeKey>('sapphire')
const submitting = ref(false)
const errorMessage = ref('')

const quickTemplates: { name: string; shortLabel: string; theme: CardThemeKey }[] = [
  { name: 'BRI BritAma', shortLabel: 'BRI', theme: 'sapphire' },
  { name: 'SeaBank', shortLabel: 'SeaBank', theme: 'amber' },
  { name: 'Bank Jago', shortLabel: 'Jago', theme: 'violet' },
  { name: 'CIMB Niaga', shortLabel: 'CIMB', theme: 'crimson' },
  { name: 'ShopeePay', shortLabel: 'ShopeePay', theme: 'amber' },
  { name: 'OVO Cash', shortLabel: 'OVO', theme: 'violet' }
]

watch(
  () => props.open,
  (isOpen: boolean) => {
    if (isOpen) {
      errorMessage.value = ''
    }
  }
)

function applyTemplate(tpl: (typeof quickTemplates)[number]) {
  name.value = tpl.name
  shortLabel.value = tpl.shortLabel
  theme.value = tpl.theme
}

const previewCard = computed(() =>
  buildCustomWalletCard({
    id: 'preview',
    name: name.value.trim() || 'Nama Rekening Baru',
    shortLabel: shortLabel.value.trim() || undefined,
    last4: last4.value,
    theme: theme.value
  })
)

async function handleSubmit() {
  errorMessage.value = ''
  if (name.value.trim().length < 2) {
    errorMessage.value = 'Nama kartu atau rekening minimal 2 karakter.'
    return
  }

  submitting.value = true
  try {
    const created = await addCustomCard({
      name: name.value.trim(),
      shortLabel: shortLabel.value.trim() || undefined,
      last4: last4.value.trim() || undefined,
      theme: theme.value
    })
    name.value = ''
    shortLabel.value = ''
    last4.value = ''
    emit('created', created)
    emit('close')
  } catch (err: unknown) {
    errorMessage.value = extractApiErrorMessage(err, 'Gagal menambahkan kartu baru')
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <BaseModal
    :open="open"
    title="Tambah Kartu / Rekening Baru"
    subtitle="Simpan kartu bank atau e-wallet tambahan ke tumpukan dompet FinVault"
    @close="emit('close')"
  >
    <form class="space-y-4" @submit.prevent="handleSubmit">
      <!-- Live Physical Card Preview with Cutout Notch -->
      <BankCard
        :card="previewCard"
        balance="0.00"
        mode="preview"
        :interactive="false"
        notch-bg-class="bg-vault-surface"
        notch-text-class="text-vault-surface"
      />

      <!-- Quick Bank / E-Wallet Presets -->
      <div class="space-y-1.5">
        <span class="block text-xs font-medium text-slate-300">Preset Populer</span>
        <div class="flex flex-wrap gap-1.5">
          <button
            v-for="tpl in quickTemplates"
            :key="tpl.name"
            type="button"
            class="inline-flex items-center gap-1 rounded-full border border-vault-border bg-vault-bg px-2.5 py-1 text-[11px] font-medium text-slate-300 transition hover:border-white/25 hover:text-white active:scale-95"
            @click="applyTemplate(tpl)"
          >
            <Sparkles class="h-3 w-3 text-amber-400" />
            {{ tpl.shortLabel }}
          </button>
        </div>
      </div>

      <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div class="space-y-1.5">
          <label for="card-name" class="block text-xs font-medium text-slate-300">
            Nama Kartu / Rekening
          </label>
          <input
            id="card-name"
            v-model="name"
            type="text"
            required
            maxlength="32"
            placeholder="Misal: SeaBank atau BRI"
            class="w-full rounded-xl border border-vault-border bg-vault-card px-3.5 py-2.5 text-sm text-white placeholder-slate-500 transition focus:border-violet-500 focus:outline-none"
          />
        </div>

        <div class="space-y-1.5">
          <label for="card-short" class="block text-xs font-medium text-slate-300">
            Label Singkat (Opsional)
          </label>
          <input
            id="card-short"
            v-model="shortLabel"
            type="text"
            maxlength="14"
            placeholder="Misal: SeaBank"
            class="w-full rounded-xl border border-vault-border bg-vault-card px-3.5 py-2.5 text-sm text-white placeholder-slate-500 transition focus:border-violet-500 focus:outline-none"
          />
        </div>
      </div>

      <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div class="space-y-1.5">
          <label for="card-last4" class="block text-xs font-medium text-slate-300">
            4 Digit Terakhir (Opsional)
          </label>
          <input
            id="card-last4"
            v-model="last4"
            type="text"
            inputmode="numeric"
            maxlength="4"
            placeholder="4910"
            class="w-full rounded-xl border border-vault-border bg-vault-card px-3.5 py-2.5 font-mono text-sm text-white placeholder-slate-500 transition focus:border-violet-500 focus:outline-none"
          />
        </div>

        <div class="space-y-1.5">
          <span class="block text-xs font-medium text-slate-300">Warna Kartu</span>
          <div class="flex flex-wrap items-center gap-2 pt-1">
            <button
              v-for="item in CARD_THEMES"
              :key="item.key"
              type="button"
              :title="item.label"
              :aria-label="item.label"
              class="flex h-7 w-7 items-center justify-center rounded-full border transition active:scale-90"
              :class="[
                item.swatchClass,
                theme === item.key ? 'border-white ring-2 ring-white/40' : 'border-white/20 opacity-80 hover:opacity-100'
              ]"
              @click="theme = item.key"
            >
              <Check v-if="theme === item.key" class="h-3.5 w-3.5 text-white" />
            </button>
          </div>
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
          class="w-full rounded-full border border-vault-border px-4 py-2.5 text-xs font-semibold text-slate-300 transition hover:bg-slate-800 sm:w-auto"
          @click="emit('close')"
        >
          Batal
        </button>
        <button
          type="submit"
          :disabled="submitting"
          class="w-full rounded-full bg-white px-5 py-2.5 text-xs font-bold text-slate-950 transition hover:bg-slate-200 active:scale-[0.98] disabled:opacity-50 sm:w-auto"
        >
          {{ submitting ? 'Menyimpan...' : 'Buat Kartu Baru' }}
        </button>
      </div>
    </form>
  </BaseModal>
</template>
