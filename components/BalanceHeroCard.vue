<script setup lang="ts">
import Decimal from 'decimal.js'
import { Lock, Plus, ShieldCheck, Sparkles, TrendingUp } from 'lucide-vue-next'
import type { FinancialSummary } from '~/types/database'
import { formatIDR, toDecimal } from '~/utils/finance'

const props = defineProps<{
  summary: FinancialSummary
  loading?: boolean
}>()

const emit = defineEmits<{
  (e: 'add-cash'): void
  (e: 'open-investments'): void
}>()

const spotlight = ref({ x: 50, y: 30, active: false })
const showBackCardDetail = ref(false)

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
      <!-- Pinterest-Style Stacked Card Deck with Concave Bottom-Right Cutout Notch -->
      <div class="xl:col-span-5">
        <div class="relative pt-1">
          <!-- Peeking Amber Gold Back Card (Locked Principal P_l) -->
          <button
            type="button"
            class="group relative z-0 -mb-6 flex w-full items-center justify-between rounded-t-[26px] bg-gradient-to-r from-[#F7C948] via-[#F5B841] to-[#E9A825] px-5 pb-9 pt-3.5 text-left text-slate-950 transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-1 active:translate-y-0"
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

          <!-- Main Front Violet Card (Liquid Cash C_l) with Cutout Notch -->
          <div
            class="group relative z-10 overflow-hidden rounded-[26px] bg-gradient-to-br from-[#7C3AED] via-[#8B5CF6] to-[#6D28D9] p-5 pb-6 text-white shadow-[0_24px_50px_-20px_rgba(124,58,237,0.55)] transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] sm:p-6 sm:pb-7"
            @mousemove="handlePointerMove"
            @mouseleave="handlePointerLeave"
          >
            <!-- Pointer Spotlight -->
            <div
              aria-hidden="true"
              class="pointer-events-none absolute inset-0 transition-opacity duration-500"
              :class="spotlight.active ? 'opacity-100' : 'opacity-0'"
              :style="{
                background: `radial-gradient(280px circle at ${spotlight.x}% ${spotlight.y}%, rgba(255, 255, 255, 0.18), transparent 70%)`
              }"
            />

            <!-- Card Top Row -->
            <div class="relative z-10 flex items-center justify-between gap-2">
              <div class="flex items-center gap-2">
                <span class="flex h-7 w-7 items-center justify-center rounded-full bg-white/15 backdrop-blur-sm">
                  <ShieldCheck class="h-4 w-4 text-white" />
                </span>
                <span class="text-[11px] font-semibold uppercase tracking-wider text-white/85">
                  Kas Likuid (Riil)
                </span>
              </div>
              <span class="rounded-full bg-white/15 px-2.5 py-0.5 font-mono text-[10px] font-semibold tracking-wider text-white/90">
                C_l · IDR
              </span>
            </div>

            <!-- Balance Display -->
            <div class="relative z-10 mt-5">
              <p class="text-xs font-medium text-white/75">Real Spendable Balance</p>
              <div
                v-if="loading"
                class="mt-1.5 h-9 w-48 animate-pulse rounded-xl bg-white/20"
              />
              <p
                v-else
                class="mt-1 break-words font-mono text-3xl font-extrabold tracking-tight text-white tabular-nums sm:text-4xl"
              >
                {{ formatIDR(summary.liquidCash) }}
              </p>
            </div>

            <!-- Card Bottom Left Info (Leaves clean room for bottom-right cutout notch) -->
            <div class="relative z-10 mt-6 pr-36 sm:pr-40">
              <p class="text-[11px] text-white/70">Projected Net Worth</p>
              <p class="mt-0.5 truncate font-mono text-sm font-bold text-white tabular-nums">
                {{ formatIDR(summary.projectedNetWorth) }}
              </p>
            </div>

            <!-- Bottom-Right Concave Cutout Notch ("Out-Shape-From-Shape") -->
            <div
              class="absolute bottom-0 right-0 z-20 rounded-tl-[26px] bg-vault-bg pl-2.5 pt-2.5"
            >
              <!-- Left concave fillet connecting card bottom edge to notch -->
              <svg
                aria-hidden="true"
                class="pointer-events-none absolute -left-5 bottom-0 h-5 w-5 text-vault-bg"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path d="M20 20H0C11.0457 20 20 11.0457 20 0V20Z" />
              </svg>
              <!-- Top concave fillet connecting card right edge to notch -->
              <svg
                aria-hidden="true"
                class="pointer-events-none absolute -top-5 right-0 h-5 w-5 text-vault-bg"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path d="M20 20H0C11.0457 20 20 11.0457 20 0V20Z" />
              </svg>

              <!-- Button-in-Button CTA nestled inside the cutout -->
              <button
                type="button"
                class="group/btn inline-flex items-center gap-2 rounded-full border border-white/15 bg-[#151722] py-1.5 pl-2 pr-4 text-xs font-bold text-white shadow-lg transition-all duration-200 hover:border-white/30 hover:bg-[#1E2130] active:scale-[0.96]"
                @click="emit('add-cash')"
              >
                <span
                  class="flex h-7 w-7 items-center justify-center rounded-full bg-white text-slate-950 transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover/btn:rotate-90 group-hover/btn:scale-105"
                >
                  <Plus class="h-4 w-4" />
                </span>
                <span>Catat Kas</span>
              </button>
            </div>
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
        <!-- Locked Principal -->
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

        <!-- Projected Profit -->
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

        <!-- Projected Net Worth -->
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
