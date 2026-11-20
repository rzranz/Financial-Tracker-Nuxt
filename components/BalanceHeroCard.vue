<script setup lang="ts">
import Decimal from 'decimal.js'
import {
  Check,
  ChevronDown,
  CreditCard,
  Layers,
  Lock,
  Plus,
  ShieldCheck,
  Sparkles,
  TrendingUp
} from 'lucide-vue-next'
import type { FinancialSummary, TransactionRecord } from '~/types/database'
import {
  WALLET_CARDS,
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

const isStackExpanded = ref(false)
const spotlight = ref({ x: 50, y: 30, active: false })
const showBackCardDetail = ref(false)

const activeCard = computed(() => getWalletCard(props.selectedCard))

const peekingCards = computed(() =>
  WALLET_CARDS.filter((c) => c.id !== props.selectedCard).slice(0, 2)
)

const allCardRows = computed(() =>
  WALLET_CARDS.map((card) => ({
    card,
    metrics: computeCardMetrics(card.id, props.transactions, props.summary)
  }))
)

const activeMetrics = computed(() =>
  computeCardMetrics(props.selectedCard, props.transactions, props.summary)
)

function toggleStack() {
  isStackExpanded.value = !isStackExpanded.value
}

function selectCardFromStack(cardId: WalletCardId) {
  emit('update:selectedCard', cardId)
  isStackExpanded.value = false
}

function handlePointerMove(event: MouseEvent) {
  const el = event.currentTarget as HTMLElement | null
  if (!el) return
  const rect = el.getBoundingClientRect()
  spotlight.value = {
    x: ((event.clientX - rect.left) / rect.width) * 100,
    y: ((event.clientY - rect.top) / rect.height) * 100,
    active: true
  }
}

function handlePointerLeave() {
  spotlight.value.active = false
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
      <!-- Pure Interactive Stacked Card Deck (Click to Fan Out All Cards, Click Any Card to Collapse) -->
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

          <!-- Collapsed Stack View vs Expanded Fan-Out List -->
          <Transition name="stack-morph" mode="out-in">
            <!-- COLLAPSED STACKED CARD VIEW -->
            <div
              v-if="!isStackExpanded"
              key="collapsed"
              class="relative z-10 cursor-pointer"
              role="button"
              tabindex="0"
              aria-label="Buka tumpukan kartu untuk memilih rekening atau e-wallet"
              @click="toggleStack"
              @keydown.enter.prevent="toggleStack"
              @keydown.space.prevent="toggleStack"
            >
              <!-- Subtle Stacked Card Layers Peeking Above Active Card -->
              <div
                v-for="(peek, idx) in peekingCards"
                :key="peek.id"
                aria-hidden="true"
                class="relative -mb-4 h-7 rounded-t-[22px] border-t border-white/20 bg-gradient-to-r px-5 pt-1.5 transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]"
                :class="[
                  peek.gradientClass,
                  idx === 0 ? 'mx-3 opacity-80' : 'mx-1.5 opacity-95'
                ]"
              >
                <span class="block text-[9px] font-bold uppercase tracking-widest text-white/75">
                  {{ peek.name }}
                </span>
              </div>

              <!-- Active Front Card with Concave Cutout Notch -->
              <div
                class="group relative overflow-hidden rounded-[26px] bg-gradient-to-br p-5 pb-6 text-white transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-0.5 sm:p-6 sm:pb-7"
                :class="activeCard.gradientClass"
                :style="{ boxShadow: `0 24px 50px -20px ${activeCard.shadowColor}` }"
                @mousemove="handlePointerMove"
                @mouseleave="handlePointerLeave"
              >
                <!-- Pointer Spotlight -->
                <div
                  aria-hidden="true"
                  class="pointer-events-none absolute inset-0 transition-opacity duration-500"
                  :class="spotlight.active ? 'opacity-100' : 'opacity-0'"
                  :style="{
                    background: `radial-gradient(280px circle at ${spotlight.x}% ${spotlight.y}%, rgba(255, 255, 255, 0.2), transparent 70%)`
                  }"
                />

                <!-- Card Top Row -->
                <div class="relative z-10 flex items-center justify-between gap-2">
                  <div class="flex items-center gap-2">
                    <span class="flex h-7 w-7 items-center justify-center rounded-full bg-white/15 backdrop-blur-sm">
                      <ShieldCheck v-if="activeCard.id === 'all'" class="h-4 w-4 text-white" />
                      <CreditCard v-else class="h-4 w-4 text-white" />
                    </span>
                    <span class="text-[11px] font-bold uppercase tracking-wider text-white/95">
                      {{ activeCard.name }}
                    </span>
                  </div>

                  <span
                    class="inline-flex items-center gap-1 rounded-full bg-black/25 px-2.5 py-1 text-[10px] font-semibold text-white/90 backdrop-blur-sm transition group-hover:bg-black/40"
                  >
                    <Layers class="h-3 w-3" />
                    Ganti Kartu
                    <ChevronDown class="h-3 w-3 transition-transform duration-300 group-hover:translate-y-0.5" />
                  </span>
                </div>

                <!-- Balance Display -->
                <div class="relative z-10 mt-5">
                  <p class="text-xs font-medium text-white/75">{{ activeCard.subtitle }}</p>
                  <div
                    v-if="loading"
                    class="mt-1.5 h-9 w-48 animate-pulse rounded-xl bg-white/20"
                  />
                  <p
                    v-else
                    class="mt-1 break-words font-mono text-3xl font-extrabold tracking-tight text-white tabular-nums sm:text-4xl"
                  >
                    {{ formatIDR(activeMetrics.balance) }}
                  </p>
                </div>

                <!-- Card Bottom Left Info (Leaves clean room for bottom-right cutout notch) -->
                <div class="relative z-10 mt-6 pr-36 sm:pr-40">
                  <template v-if="activeCard.id === 'all'">
                    <p class="text-[11px] text-white/70">Projected Net Worth</p>
                    <p class="mt-0.5 truncate font-mono text-sm font-bold text-white tabular-nums">
                      {{ formatIDR(summary.projectedNetWorth) }}
                    </p>
                  </template>
                  <template v-else>
                    <p class="text-[11px] text-white/80">
                      {{ activeMetrics.txCount }} mutasi · Keluar
                      <span class="font-mono font-semibold text-white">{{ formatIDR(activeMetrics.outflow) }}</span>
                    </p>
                    <p class="mt-0.5 truncate font-mono text-xs font-semibold text-white/95 tabular-nums">
                      Masuk: +{{ formatIDR(activeMetrics.inflow) }}
                    </p>
                  </template>
                </div>

                <!-- Bottom-Right Concave Cutout Notch ("Out-Shape-From-Shape") -->
                <div
                  class="absolute bottom-0 right-0 z-20 rounded-tl-[26px] bg-vault-bg pl-2.5 pt-2.5"
                  @click.stop
                >
                  <svg
                    aria-hidden="true"
                    class="pointer-events-none absolute -left-5 bottom-0 h-5 w-5 text-vault-bg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path d="M20 20H0C11.0457 20 20 11.0457 20 0V20Z" />
                  </svg>
                  <svg
                    aria-hidden="true"
                    class="pointer-events-none absolute -top-5 right-0 h-5 w-5 text-vault-bg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path d="M20 20H0C11.0457 20 20 11.0457 20 0V20Z" />
                  </svg>

                  <button
                    type="button"
                    class="group/btn inline-flex items-center gap-2 rounded-full border border-white/15 bg-[#151722] py-1.5 pl-2 pr-4 text-xs font-bold text-white shadow-lg transition-all duration-200 hover:border-white/30 hover:bg-[#1E2130] active:scale-[0.96]"
                    @click.stop="emit('add-cash', activeCard.id)"
                  >
                    <span
                      class="flex h-7 w-7 items-center justify-center rounded-full bg-white text-slate-950 transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover/btn:rotate-90 group-hover/btn:scale-105"
                    >
                      <Plus class="h-4 w-4" />
                    </span>
                    <span>{{ activeCard.id === 'all' ? 'Catat Kas' : activeCard.shortLabel }}</span>
                  </button>
                </div>
              </div>
            </div>

            <!-- EXPANDED FANNED-OUT CARD STACK ("Keluar Berjajar") -->
            <div
              v-else
              key="expanded"
              class="relative z-10 space-y-2.5 rounded-[26px] border border-white/10 bg-[#0D0F15] p-3 shadow-2xl"
            >
              <div class="flex items-center justify-between px-1.5 pt-0.5">
                <span class="text-[11px] font-bold uppercase tracking-wider text-slate-300">
                  Pilih Kartu / Sumber Dana
                </span>
                <button
                  type="button"
                  class="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-semibold text-slate-300 transition hover:bg-white/10 hover:text-white active:scale-95"
                  @click="isStackExpanded = false"
                >
                  Tutup
                </button>
              </div>

              <button
                v-for="(row, index) in allCardRows"
                :key="row.card.id"
                type="button"
                class="stack-item-emerge group flex w-full items-center justify-between gap-3 rounded-2xl border bg-gradient-to-r p-4 text-left text-white transition-all duration-200 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-0.5 active:scale-[0.98]"
                :class="[
                  row.card.gradientClass,
                  selectedCard === row.card.id
                    ? 'border-white/60 ring-2 ring-white/25'
                    : 'border-white/15 opacity-90 hover:opacity-100'
                ]"
                :style="{ animationDelay: `${index * 45}ms` }"
                @click="selectCardFromStack(row.card.id)"
              >
                <div class="flex min-w-0 items-center gap-3">
                  <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/15 backdrop-blur-sm">
                    <ShieldCheck v-if="row.card.id === 'all'" class="h-4 w-4 text-white" />
                    <CreditCard v-else class="h-4 w-4 text-white" />
                  </span>
                  <div class="min-w-0">
                    <div class="flex items-center gap-2">
                      <p class="truncate text-sm font-bold text-white">{{ row.card.name }}</p>
                      <span
                        v-if="selectedCard === row.card.id"
                        class="inline-flex items-center gap-0.5 rounded-full bg-white px-2 py-0.5 text-[10px] font-extrabold text-slate-950"
                      >
                        <Check class="h-2.5 w-2.5" />
                        Aktif
                      </span>
                    </div>
                    <p class="mt-0.5 truncate text-[11px] text-white/75">
                      {{ row.card.id === 'all' ? 'Total semua rekening' : `${row.metrics.txCount} mutasi · ${row.card.maskedNumber.slice(-4)}` }}
                    </p>
                  </div>
                </div>

                <div class="shrink-0 text-right">
                  <p class="font-mono text-sm font-extrabold text-white tabular-nums">
                    {{ formatIDR(row.metrics.balance) }}
                  </p>
                  <p
                    v-if="row.card.id !== 'all'"
                    class="mt-0.5 font-mono text-[10px] text-white/75 tabular-nums"
                  >
                    Keluar {{ formatIDR(row.metrics.outflow) }}
                  </p>
                </div>
              </button>
            </div>
          </Transition>

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
  </section>
</template>

<style scoped>
.stack-morph-enter-active,
.stack-morph-leave-active {
  transition:
    transform 260ms cubic-bezier(0.32, 0.72, 0, 1),
    opacity 200ms cubic-bezier(0.32, 0.72, 0, 1);
}

.stack-morph-enter-from {
  opacity: 0;
  transform: translate3d(0, 10px, 0) scale(0.97);
}

.stack-morph-leave-to {
  opacity: 0;
  transform: translate3d(0, -10px, 0) scale(0.97);
}

.stack-item-emerge {
  animation: stack-card-fan 320ms cubic-bezier(0.32, 0.72, 0, 1) both;
}

@keyframes stack-card-fan {
  0% {
    opacity: 0;
    transform: translate3d(0, -14px, 0) scale(0.95);
  }
  100% {
    opacity: 1;
    transform: translate3d(0, 0, 0) scale(1);
  }
}

@media (prefers-reduced-motion: reduce) {
  .stack-morph-enter-active,
  .stack-morph-leave-active,
  .stack-item-emerge {
    animation: none;
    transition: opacity 120ms ease;
    transform: none;
  }
}
</style>
