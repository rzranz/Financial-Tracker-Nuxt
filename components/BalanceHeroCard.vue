<script setup lang="ts">
import Decimal from 'decimal.js'
import {
  CreditCard,
  Lock,
  Plus,
  Sparkles,
  Trash2,
  TrendingUp,
  X
} from 'lucide-vue-next'
import type { FinancialSummary, TransactionRecord } from '~/types/database'
import {
  type WalletCardConfig,
  type WalletCardId,
  computeCardMetrics,
  getWalletCard
} from '~/utils/cards'
import { formatIDR, toDecimal } from '~/utils/finance'

const props = withDefaults(
  defineProps<{
    summary: FinancialSummary
    transactions?: TransactionRecord[]
    selectedCard?: WalletCardId
    loading?: boolean
  }>(),
  {
    transactions: () => [],
    selectedCard: 'all'
  }
)

const emit = defineEmits<{
  (e: 'update:selectedCard', wallet: WalletCardId): void
  (e: 'add-cash', wallet: WalletCardId): void
  (e: 'open-investments'): void
}>()

const { allCards, removeCustomCard } = useWalletCards()
const isStackExpanded = ref(false)
const showAddCardModal = ref(false)
const deletingCardId = ref<string | null>(null)
const showBackCardDetail = ref(false)

const activeCard = computed(() => getWalletCard(props.selectedCard, allCards.value))

const peekingCards = computed(() =>
  allCards.value.filter((c: WalletCardConfig) => c.id !== props.selectedCard).slice(0, 2)
)

const allCardRows = computed(() =>
  allCards.value.map((card: WalletCardConfig) => ({
    card,
    metrics: computeCardMetrics(card.id, props.transactions, props.summary, allCards.value)
  }))
)

const activeMetrics = computed(() =>
  computeCardMetrics(props.selectedCard, props.transactions, props.summary, allCards.value)
)

function openStack() {
  isStackExpanded.value = true
}

function closeStack() {
  isStackExpanded.value = false
}

function selectCardFromStack(cardId: WalletCardId) {
  emit('update:selectedCard', cardId)
  isStackExpanded.value = false
}

function handleEscapeKey(event: KeyboardEvent) {
  if (event.key === 'Escape' && isStackExpanded.value && !showAddCardModal.value) {
    closeStack()
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleEscapeKey)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleEscapeKey)
})

async function handleRemoveCustomCard(cardId: string) {
  if (deletingCardId.value) return
  deletingCardId.value = cardId
  try {
    await removeCustomCard(cardId)
    if (props.selectedCard === cardId) {
      emit('update:selectedCard', 'all')
    }
  } finally {
    deletingCardId.value = null
  }
}

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
    <div class="grid grid-cols-1 gap-4 xl:grid-cols-12">
      <!-- Stacked Wallet Card Deck -->
      <div class="xl:col-span-5">
        <div class="relative pt-1">
          <!-- Peeking Amber Gold Back Card (Locked Principal P_l) -->
          <button
            type="button"
            class="group relative z-0 -mb-5 flex w-full items-center justify-between rounded-t-[26px] bg-gradient-to-r from-[#F7C948] via-[#F5B841] to-[#E9A825] px-5 pb-8 pt-3.5 text-left text-slate-950 transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-1 active:translate-y-0"
            @click="showBackCardDetail = !showBackCardDetail"
          >
            <div class="flex items-center gap-2">
              <span class="flex h-6 w-6 items-center justify-center rounded-full bg-slate-950/15">
                <Lock class="h-3.5 w-3.5 text-slate-950" />
              </span>
              <span class="text-[11px] font-bold uppercase tracking-wider text-slate-900/80">
                Locked · {{ summary.activeCount + summary.maturedCount }} Kontrak
              </span>
            </div>
            <span class="font-mono text-xs font-extrabold tracking-tight text-slate-950 tabular-nums">
              {{ formatIDR(summary.lockedPrincipal) }}
            </span>
          </button>

          <!-- Collapsed Stack View -->
          <div
            class="relative z-10"
            role="button"
            tabindex="0"
            aria-label="Buka tumpukan kartu untuk memilih rekening atau e-wallet"
            @keydown.enter.prevent="openStack"
            @keydown.space.prevent="openStack"
          >
            <!-- Subtle Stacked Card Layers Peeking Above Active Card -->
            <div
              v-for="(peek, idx) in peekingCards"
              :key="peek.id"
              aria-hidden="true"
              class="relative -mb-4 h-7 cursor-pointer rounded-t-[22px] border-t border-white/20 bg-gradient-to-r px-5 pt-1.5 transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]"
              :class="[
                peek.gradientClass,
                idx === 0 ? 'mx-3 opacity-80' : 'mx-1.5 opacity-95'
              ]"
              @click="openStack"
            >
              <span class="block text-[9px] font-bold uppercase tracking-widest text-white/75">
                {{ peek.name }}
              </span>
            </div>

            <!-- Active Front BankCard -->
            <BankCard
              :card="activeCard"
              :balance="activeMetrics.balance"
              :inflow="activeMetrics.inflow"
              :outflow="activeMetrics.outflow"
              :tx-count="activeMetrics.txCount"
              :projected-net-worth="summary.projectedNetWorth"
              :loading="loading"
              mode="hero"
              notch-bg-class="bg-vault-bg"
              notch-text-class="text-vault-bg"
              @card-click="openStack"
              @notch-click="emit('add-cash', activeCard.id)"
            />
          </div>

          <!-- Optional expandable detail drawer when clicking peeking Amber card -->
          <Transition
            enter-active-class="transition duration-250 ease-out"
            enter-from-class="-translate-y-2 opacity-0"
            enter-to-class="translate-y-0 opacity-100"
            leave-active-class="transition duration-150 ease-in"
            leave-from-class="translate-y-0 opacity-100"
            leave-to-class="-translate-y-2 opacity-0"
          >
            <div
              v-if="showBackCardDetail"
              class="mt-2.5 flex items-center justify-between gap-3 rounded-2xl border border-amber-500/25 bg-amber-500/10 px-4 py-3 text-xs"
            >
              <div>
                <p class="font-semibold text-amber-200">
                  {{ summary.activeCount }} Kontrak Aktif · {{ summary.maturedCount }} Siap Cair
                </p>
                <p class="mt-0.5 text-amber-300/80">
                  Profit estimasi: +{{ formatIDR(summary.projectedProfit) }}
                </p>
              </div>
              <button
                type="button"
                class="shrink-0 rounded-full bg-amber-400 px-3 py-1.5 text-[11px] font-bold text-slate-950 transition hover:bg-amber-300 active:scale-95"
                @click="emit('open-investments')"
              >
                Kelola
              </button>
            </div>
          </Transition>
        </div>
      </div>

      <!-- Secondary 3 Metrics: Double-Bezel Cards -->
      <div class="grid grid-cols-1 gap-3.5 md:grid-cols-3 xl:col-span-7">
        <div
          class="vault-card-interactive vault-bezel group relative flex flex-col justify-between overflow-hidden rounded-[24px] p-5"
        >
          <div
            aria-hidden="true"
            class="pointer-events-none absolute -bottom-10 -right-10 h-28 w-28 rounded-full bg-amber-500/[0.07] blur-xl transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-150"
          />
          <div class="relative z-10">
            <div class="flex items-center justify-between gap-2">
              <span
                class="inline-flex items-center gap-1.5 rounded-full border border-amber-500/25 bg-amber-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-amber-300"
              >
                <Lock class="h-3 w-3 shrink-0 transition-transform duration-300 group-hover:-rotate-6" />
                Locked Principal
              </span>
              <span class="font-mono text-[11px] text-slate-500">P_l</span>
            </div>
            <div v-if="loading" class="mt-4 h-8 w-36 animate-pulse rounded-lg bg-slate-800" />
            <p
              v-else
              class="mt-4 break-words font-mono text-xl font-bold text-slate-100 tabular-nums sm:text-2xl"
            >
              {{ formatIDR(summary.lockedPrincipal) }}
            </p>
          </div>
          <p class="relative z-10 mt-4 text-xs text-slate-400">
            {{ summary.activeCount }} aktif · {{ summary.maturedCount }} siap cair
          </p>
        </div>

        <div
          class="vault-card-interactive vault-bezel group relative flex flex-col justify-between overflow-hidden rounded-[24px] p-5"
        >
          <div
            aria-hidden="true"
            class="pointer-events-none absolute -bottom-10 -right-10 h-28 w-28 rounded-full bg-sky-500/[0.07] blur-xl transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-150"
          />
          <div class="relative z-10">
            <div class="flex items-center justify-between gap-2">
              <span
                class="inline-flex items-center gap-1.5 rounded-full border border-sky-500/25 bg-sky-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-sky-300"
              >
                <TrendingUp class="h-3 w-3 shrink-0 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                Projected Profit
              </span>
              <span class="font-mono text-[11px] text-slate-500">R_p</span>
            </div>
            <div v-if="loading" class="mt-4 h-8 w-36 animate-pulse rounded-lg bg-slate-800" />
            <p
              v-else
              class="mt-4 break-words font-mono text-xl font-bold text-sky-300 tabular-nums sm:text-2xl"
            >
              +{{ formatIDR(summary.projectedProfit) }}
            </p>
          </div>
          <p class="relative z-10 mt-4 text-xs text-slate-400">
            Estimasi ROI kontrak aktif (belum cair)
          </p>
        </div>

        <div
          class="vault-card-interactive vault-bezel group relative flex flex-col justify-between overflow-hidden rounded-[24px] p-5"
        >
          <div
            aria-hidden="true"
            class="pointer-events-none absolute -bottom-10 -right-10 h-28 w-28 rounded-full bg-violet-500/[0.08] blur-xl transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-150"
          />
          <div class="relative z-10">
            <div class="flex items-center justify-between gap-2">
              <span
                class="inline-flex items-center gap-1.5 rounded-full border border-violet-500/25 bg-violet-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-violet-200"
              >
                <Sparkles class="h-3 w-3 shrink-0 text-amber-400 transition-transform duration-300 group-hover:rotate-12 group-hover:scale-110" />
                Projected Net Worth
              </span>
              <span class="font-mono text-[11px] text-slate-500">N_p</span>
            </div>
            <div v-if="loading" class="mt-4 h-8 w-36 animate-pulse rounded-lg bg-slate-800" />
            <p
              v-else
              class="mt-4 break-words font-mono text-xl font-bold text-white tabular-nums sm:text-2xl"
            >
              {{ formatIDR(summary.projectedNetWorth) }}
            </p>
          </div>
          <p class="relative z-10 mt-4 text-xs text-slate-400">
            Gabungan C_l + P_l + R_p
          </p>
        </div>
      </div>
    </div>

    <!-- Capital Allocation Bar -->
    <div class="vault-bezel rounded-[22px] px-5 py-4">
      <div class="flex flex-col justify-between gap-2 text-xs sm:flex-row sm:items-center">
        <span class="font-semibold text-slate-300">Komposisi Kekayaan &amp; Likuiditas</span>
        <div class="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-slate-400">
          <span class="inline-flex items-center gap-1.5">
            <span class="h-2 w-2 rounded-full bg-violet-400" />
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
          class="bg-violet-500 transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)]"
          :style="{ width: `${allocation.liquidPct}%` }"
        />
        <div
          class="bg-amber-400 transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)]"
          :style="{ width: `${allocation.lockedPct}%` }"
        />
        <div
          class="bg-sky-400 transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)]"
          :style="{ width: `${allocation.profitPct}%` }"
        />
      </div>
    </div>

    <!-- FULL-PAGE ON MOBILE / FULL-CARD GALLERY ON DESKTOP -->
    <Teleport to="body">
      <Transition name="wallet-sheet">
        <div
          v-if="isStackExpanded"
          role="dialog"
          aria-modal="true"
          aria-label="Pilih kartu atau rekening"
          class="fixed inset-0 z-50 overflow-y-auto bg-vault-bg md:bg-black/85 md:p-6 md:backdrop-blur-xl"
          @click.self="closeStack"
        >
          <div class="mx-auto flex min-h-full w-full max-w-4xl flex-col md:justify-center">
            <!-- Sticky Mobile / Gallery Header -->
            <div
              class="sticky top-0 z-30 flex items-center justify-between border-b border-white/[0.07] bg-vault-bg/95 px-4 py-4 backdrop-blur-xl md:rounded-t-[28px] md:border md:border-b-0 md:bg-[#0C0E14] md:px-6 md:py-5"
            >
              <div>
                <h2 class="text-base font-extrabold tracking-tight text-white sm:text-lg">
                  Dompet &amp; Kartu Rekening
                </h2>
                <p class="text-xs text-slate-400">
                  Tap salah satu kartu untuk mengaktifkan dan melihat mutasinya
                </p>
              </div>
              <button
                type="button"
                class="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-vault-card text-slate-300 transition hover:rotate-90 hover:border-white/25 hover:text-white active:scale-95"
                aria-label="Tutup daftar kartu"
                @click="closeStack"
              >
                <X class="h-4 w-4" />
              </button>
            </div>

            <!-- Physical Cutout Bank Cards Grid -->
            <div
              class="flex-1 px-4 pb-10 pt-5 md:flex-none md:rounded-b-[28px] md:border md:border-t-0 md:border-white/[0.07] md:bg-[#0C0E14] md:px-6 md:pb-6"
            >
              <div class="grid grid-cols-1 gap-5 md:grid-cols-2">
                <div
                  v-for="(row, index) in allCardRows"
                  :key="row.card.id"
                  class="stack-item-emerge"
                  :style="{ animationDelay: `${index * 45}ms` }"
                >
                  <BankCard
                    :card="row.card"
                    :balance="row.metrics.balance"
                    :inflow="row.metrics.inflow"
                    :outflow="row.metrics.outflow"
                    :tx-count="row.metrics.txCount"
                    :active="selectedCard === row.card.id"
                    mode="gallery"
                    notch-bg-class="bg-vault-bg md:bg-[#0C0E14]"
                    notch-text-class="text-vault-bg md:text-[#0C0E14]"
                    @card-click="selectCardFromStack(row.card.id)"
                  >
                    <template #top-right>
                      <button
                        v-if="row.card.isCustom"
                        type="button"
                        :disabled="deletingCardId === row.card.id"
                        class="rounded-full bg-black/30 p-1.5 text-white/80 transition hover:bg-rose-500 hover:text-white active:scale-90 disabled:opacity-40"
                        title="Hapus kartu kustom"
                        aria-label="Hapus kartu kustom"
                        @click.stop="handleRemoveCustomCard(row.card.id)"
                      >
                        <Trash2 class="h-3.5 w-3.5" />
                      </button>
                    </template>
                  </BankCard>
                </div>

                <!-- Matching Cutout-Shape "+ Tambah Kartu / E-Wallet" Card -->
                <div
                  class="stack-item-emerge group relative flex min-h-[212px] cursor-pointer flex-col justify-between overflow-hidden rounded-[26px] border border-dashed border-white/20 bg-[#12141C] p-5 pb-6 transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-0.5 hover:border-violet-400/60 hover:bg-[#171A24] active:scale-[0.98] sm:p-6"
                  :style="{ animationDelay: `${allCardRows.length * 45}ms` }"
                  role="button"
                  tabindex="0"
                  @click="showAddCardModal = true"
                  @keydown.enter.prevent="showAddCardModal = true"
                >
                  <div class="flex items-center justify-between">
                    <div class="flex items-center gap-2.5">
                      <span class="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-slate-300">
                        <CreditCard class="h-4 w-4" />
                      </span>
                      <span class="text-[11px] font-bold uppercase tracking-wider text-slate-300">
                        Rekening Baru
                      </span>
                    </div>
                  </div>

                  <div class="my-4">
                    <p class="text-lg font-bold text-white">Tambah Kartu / E-Wallet</p>
                    <p class="mt-1 text-xs leading-relaxed text-slate-400">
                      Buat kartu baru seperti BRI, SeaBank, Bank Jago, GoPay, atau rekening tabungan lainnya.
                    </p>
                  </div>

                  <p class="pr-32 text-[11px] font-medium text-violet-300">
                    Tersimpan di akun Anda
                  </p>

                  <!-- Matching Bottom-Right Concave Cutout Notch -->
                  <div
                    class="absolute bottom-0 right-0 z-20 rounded-tl-[24px] bg-vault-bg pl-2.5 pt-2.5 md:bg-[#0C0E14]"
                  >
                    <svg
                      aria-hidden="true"
                      class="pointer-events-none absolute -left-5 bottom-0 h-5 w-5 text-vault-bg md:text-[#0C0E14]"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path d="M20 20H0C11.0457 20 20 11.0457 20 0V20Z" />
                    </svg>
                    <svg
                      aria-hidden="true"
                      class="pointer-events-none absolute -top-5 right-0 h-5 w-5 text-vault-bg md:text-[#0C0E14]"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path d="M20 20H0C11.0457 20 20 11.0457 20 0V20Z" />
                    </svg>

                    <button
                      type="button"
                      class="inline-flex items-center gap-2 rounded-full bg-white py-1.5 pl-1.5 pr-3.5 text-xs font-bold text-slate-950 shadow-lg transition-all duration-200 group-hover:bg-slate-200 active:scale-95"
                      @click.stop="showAddCardModal = true"
                    >
                      <span
                        class="flex h-6 w-6 items-center justify-center rounded-full bg-slate-950 text-white transition-transform duration-300 group-hover:rotate-90"
                      >
                        <Plus class="h-3.5 w-3.5" />
                      </span>
                      <span>Buat</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <AddCardModal
      :open="showAddCardModal"
      @close="showAddCardModal = false"
      @created="(card) => selectCardFromStack(card.id)"
    />
  </section>
</template>

<style scoped>
.wallet-sheet-enter-active,
.wallet-sheet-leave-active {
  transition:
    opacity 260ms cubic-bezier(0.32, 0.72, 0, 1),
    transform 300ms cubic-bezier(0.32, 0.72, 0, 1);
}

.wallet-sheet-enter-from,
.wallet-sheet-leave-to {
  opacity: 0;
  transform: translateY(18px) scale(0.98);
}

.stack-item-emerge {
  animation: stack-card-fan 340ms cubic-bezier(0.32, 0.72, 0, 1) both;
}

@keyframes stack-card-fan {
  0% {
    opacity: 0;
    transform: translate3d(0, 16px, 0) scale(0.96);
  }
  100% {
    opacity: 1;
    transform: translate3d(0, 0, 0) scale(1);
  }
}

@media (prefers-reduced-motion: reduce) {
  .wallet-sheet-enter-active,
  .wallet-sheet-leave-active,
  .stack-item-emerge {
    animation: none;
    transition: opacity 120ms ease;
    transform: none;
  }
}
</style>
