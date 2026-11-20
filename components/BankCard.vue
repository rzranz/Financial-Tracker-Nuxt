<script setup lang="ts">
import { Check, ChevronDown, CreditCard, Layers, Plus, ShieldCheck, Wifi } from 'lucide-vue-next'
import type { WalletCardConfig } from '~/utils/cards'
import { formatIDR } from '~/utils/finance'

const props = withDefaults(
  defineProps<{
    card: WalletCardConfig
    balance: string
    inflow?: string
    outflow?: string
    txCount?: number
    projectedNetWorth?: string
    loading?: boolean
    active?: boolean
    interactive?: boolean
    mode?: 'hero' | 'gallery' | 'preview'
    notchBgClass?: string
    notchTextClass?: string
  }>(),
  {
    inflow: '0.00',
    outflow: '0.00',
    txCount: 0,
    projectedNetWorth: '0.00',
    loading: false,
    active: false,
    interactive: true,
    mode: 'hero',
    notchBgClass: 'bg-vault-bg',
    notchTextClass: 'text-vault-bg'
  }
)

const emit = defineEmits<{
  (e: 'card-click'): void
  (e: 'notch-click'): void
}>()

const spotlight = ref({ x: 50, y: 30, active: false })

function handlePointerMove(event: MouseEvent) {
  if (!props.interactive) return
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
</script>

<template>
  <div
    class="group relative overflow-hidden rounded-[26px] border border-white/15 bg-gradient-to-br p-5 pb-6 text-white transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] sm:p-6"
    :class="[
      card.gradientClass,
      interactive ? 'cursor-pointer hover:-translate-y-0.5' : '',
      active && mode === 'gallery' ? 'border-white/70 ring-2 ring-white/30' : ''
    ]"
    :style="{ boxShadow: `0 22px 46px -20px ${card.shadowColor}` }"
    @mousemove="handlePointerMove"
    @mouseleave="handlePointerLeave"
    @click="emit('card-click')"
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

    <!-- Subtle Physical Card Curved Guilloche / Metallic Rings -->
    <svg
      aria-hidden="true"
      viewBox="0 0 360 220"
      class="pointer-events-none absolute -right-10 -top-8 h-52 w-72 text-white/[0.08]"
      fill="none"
    >
      <circle cx="240" cy="70" r="95" stroke="currentColor" stroke-width="1.2" />
      <circle cx="240" cy="70" r="130" stroke="currentColor" stroke-width="1" />
      <circle cx="240" cy="70" r="165" stroke="currentColor" stroke-width="0.8" />
    </svg>

    <!-- Card Header Row -->
    <div class="relative z-10 flex items-center justify-between gap-2">
      <div class="flex items-center gap-2.5">
        <span class="flex h-7 w-7 items-center justify-center rounded-full bg-white/15 backdrop-blur-sm">
          <ShieldCheck v-if="card.id === 'all'" class="h-4 w-4 text-white" />
          <CreditCard v-else class="h-4 w-4 text-white" />
        </span>
        <span class="text-[11px] font-bold uppercase tracking-wider text-white/95">
          {{ card.name }}
        </span>
      </div>

      <div class="flex items-center gap-2">
        <Wifi class="h-3.5 w-3.5 rotate-90 text-white/65" aria-hidden="true" />
        <span
          v-if="mode === 'hero'"
          class="inline-flex items-center gap-1 rounded-full bg-black/25 px-2.5 py-1 text-[10px] font-semibold text-white/90 backdrop-blur-sm transition group-hover:bg-black/40"
        >
          <Layers class="h-3 w-3" />
          Ganti Kartu
          <ChevronDown class="h-3 w-3 transition-transform duration-300 group-hover:translate-y-0.5" />
        </span>
        <slot name="top-right" />
      </div>
    </div>

    <!-- EMV Metallic Chip + Card Number Mask -->
    <div class="relative z-10 mt-4 flex items-center gap-3">
      <div
        aria-hidden="true"
        class="flex h-6 w-8 items-center justify-center rounded-[5px] border border-white/35 bg-gradient-to-br from-amber-100/80 via-amber-200/55 to-amber-400/50 shadow-inner"
      >
        <div class="h-3.5 w-4 rounded-[2px] border border-slate-900/30" />
      </div>
      <span class="font-mono text-[11px] tracking-widest text-white/80">
        {{ card.maskedNumber }}
      </span>
    </div>

    <!-- Card Balance -->
    <div class="relative z-10 mt-4">
      <p class="text-[11px] font-medium text-white/75">{{ card.subtitle }}</p>
      <div
        v-if="loading"
        class="mt-1.5 h-8 w-44 animate-pulse rounded-xl bg-white/20"
      />
      <p
        v-else
        class="mt-0.5 break-words font-mono text-2xl font-extrabold tracking-tight text-white tabular-nums sm:text-3xl"
      >
        {{ formatIDR(balance) }}
      </p>
    </div>

    <!-- Bottom Left Card Footer (Clear of Bottom-Right Cutout Notch) -->
    <div class="relative z-10 mt-5 pr-32 sm:pr-36">
      <template v-if="card.id === 'all' && mode === 'hero'">
        <p class="text-[10px] uppercase tracking-wider text-white/65">Projected Net Worth</p>
        <p class="mt-0.5 truncate font-mono text-xs font-bold text-white tabular-nums">
          {{ formatIDR(projectedNetWorth) }}
        </p>
      </template>
      <template v-else-if="card.id === 'all'">
        <p class="text-[10px] uppercase tracking-wider text-white/65">Semua Rekening</p>
        <p class="mt-0.5 truncate font-mono text-xs font-semibold text-white/90 tabular-nums">
          {{ txCount }} total mutasi
        </p>
      </template>
      <template v-else>
        <p class="text-[10px] uppercase tracking-wider text-white/70">
          {{ txCount }} mutasi · Keluar {{ formatIDR(outflow) }}
        </p>
        <p class="mt-0.5 truncate font-mono text-xs font-semibold text-white/95 tabular-nums">
          Masuk +{{ formatIDR(inflow) }}
        </p>
      </template>
    </div>

    <!-- Bottom-Right Concave Cutout Notch (Signature Physical Card Cutout) -->
    <div
      class="absolute bottom-0 right-0 z-20 rounded-tl-[24px] pl-2.5 pt-2.5"
      :class="notchBgClass"
      @click.stop
    >
      <svg
        aria-hidden="true"
        class="pointer-events-none absolute -left-5 bottom-0 h-5 w-5"
        :class="notchTextClass"
        viewBox="0 0 20 20"
        fill="currentColor"
      >
        <path d="M20 20H0C11.0457 20 20 11.0457 20 0V20Z" />
      </svg>
      <svg
        aria-hidden="true"
        class="pointer-events-none absolute -top-5 right-0 h-5 w-5"
        :class="notchTextClass"
        viewBox="0 0 20 20"
        fill="currentColor"
      >
        <path d="M20 20H0C11.0457 20 20 11.0457 20 0V20Z" />
      </svg>

      <!-- Hero Mode CTA -->
      <button
        v-if="mode === 'hero'"
        type="button"
        class="group/btn inline-flex items-center gap-2 rounded-full border border-white/15 bg-[#151722] py-1.5 pl-1.5 pr-3.5 text-xs font-bold text-white shadow-lg transition-all duration-200 hover:border-white/30 hover:bg-[#1E2130] active:scale-[0.96]"
        @click.stop="emit('notch-click')"
      >
        <span
          class="flex h-7 w-7 items-center justify-center rounded-full bg-white text-slate-950 transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover/btn:rotate-90 group-hover/btn:scale-105"
        >
          <Plus class="h-4 w-4" />
        </span>
        <span>{{ card.id === 'all' ? 'Catat Kas' : card.shortLabel }}</span>
      </button>

      <!-- Gallery Mode Select / Active Badge -->
      <button
        v-else-if="mode === 'gallery'"
        type="button"
        class="inline-flex items-center gap-1.5 rounded-full border py-1.5 pl-2 pr-3.5 text-[11px] font-bold transition-all duration-200 active:scale-95"
        :class="
          active
            ? 'border-white bg-white text-slate-950 shadow-md'
            : 'border-white/15 bg-[#151722] text-white hover:border-white/30'
        "
        @click.stop="emit('card-click')"
      >
        <span
          class="flex h-6 w-6 items-center justify-center rounded-full"
          :class="active ? 'bg-slate-950 text-white' : 'bg-white/15 text-white'"
        >
          <Check v-if="active" class="h-3.5 w-3.5" />
          <CreditCard v-else class="h-3 w-3" />
        </span>
        <span>{{ active ? 'Aktif' : 'Pilih' }}</span>
      </button>

      <!-- Preview Mode Pill -->
      <span
        v-else
        class="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-[#151722] px-3 py-1.5 text-[11px] font-bold text-white"
      >
        Preview
      </span>
    </div>
  </div>
</template>
