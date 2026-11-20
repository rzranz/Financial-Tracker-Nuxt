<script setup lang="ts">
import { Wifi } from 'lucide-vue-next'

interface ShowcaseCard {
  id: string
  brand: string
  label: string
  number: string
  gradient: string
  accentChip: string
}

const cards: ShowcaseCard[] = [
  {
    id: 'vault-crimson',
    brand: 'FinVault',
    label: 'Reserve Vault',
    number: '•••• 4821',
    gradient: 'from-[#7F1D1D] via-[#4C1D95] to-[#1D4ED8]',
    accentChip: 'bg-amber-200/80'
  },
  {
    id: 'vault-metal',
    brand: 'FinVault',
    label: 'Liquid Platinum',
    number: '•••• 9042',
    gradient: 'from-[#CBD5E1] via-[#A78BFA] to-[#6366F1]',
    accentChip: 'bg-slate-900/25'
  },
  {
    id: 'vault-sky',
    brand: 'FinVault',
    label: 'BCA / E-Wallet Link',
    number: '•••• 1188',
    gradient: 'from-[#0284C7] via-[#0EA5E9] to-[#2563EB]',
    accentChip: 'bg-white/40'
  }
]

const activeIndex = ref(0)
let timer: ReturnType<typeof setInterval> | null = null

function nextCard() {
  activeIndex.value = (activeIndex.value + 1) % cards.length
}

function selectCard(idx: number) {
  activeIndex.value = idx
}

onMounted(() => {
  if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return
  }
  timer = setInterval(nextCard, 3000)
})

onBeforeUnmount(() => {
  if (timer) clearInterval(timer)
})

function cardPositionStyle(idx: number) {
  const offset = (idx - activeIndex.value + cards.length) % cards.length
  // 0 = front/active, 1 = stacked middle-back, 2 = bottom peek
  if (offset === 0) {
    return {
      transform: 'translate3d(0, 0px, 0) scale(1)',
      zIndex: 30,
      opacity: 1
    }
  }
  if (offset === 1) {
    return {
      transform: 'translate3d(0, -44px, 0) scale(0.92)',
      zIndex: 20,
      opacity: 0.92
    }
  }
  return {
    transform: 'translate3d(0, 42px, 0) scale(0.88)',
    zIndex: 10,
    opacity: 0.85
  }
}
</script>

<template>
  <div class="w-full space-y-5">
    <!-- Top Story-Style Step Progress Indicators -->
    <div class="grid grid-cols-3 gap-1.5" aria-hidden="true">
      <button
        v-for="(card, idx) in cards"
        :key="card.id"
        type="button"
        class="h-1 overflow-hidden rounded-full bg-white/15 transition-colors"
        :aria-label="`Tampilkan kartu ${card.label}`"
        @click="selectCard(idx)"
      >
        <span
          class="block h-full rounded-full bg-white transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]"
          :style="{ width: idx === activeIndex ? '100%' : idx < activeIndex ? '100%' : '0%' }"
        />
      </button>
    </div>

    <!-- Card-In / Card-Out 3D Stack -->
    <div
      class="relative mx-auto flex h-56 w-full max-w-[300px] cursor-pointer items-center justify-center sm:h-64 sm:max-w-[330px]"
      @click="nextCard"
    >
      <div
        v-for="(card, idx) in cards"
        :key="card.id"
        class="absolute h-40 w-full overflow-hidden rounded-2xl border border-white/20 bg-gradient-to-br p-5 text-white shadow-[0_24px_50px_-15px_rgba(0,0,0,0.75)] transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] sm:h-44"
        :class="card.gradient"
        :style="cardPositionStyle(idx)"
      >
        <!-- Metallic Sheen Sweep -->
        <div
          aria-hidden="true"
          class="pointer-events-none absolute inset-0 bg-gradient-to-tr from-white/0 via-white/15 to-white/0"
        />

        <div class="relative z-10 flex items-center justify-between">
          <span class="text-base font-extrabold tracking-tight text-white drop-shadow-sm">
            {{ card.brand }}
          </span>
          <Wifi class="h-4 w-4 rotate-90 text-white/80" />
        </div>

        <div class="relative z-10 mt-4 flex items-center gap-3">
          <!-- EMV Metallic Chip SVG -->
          <div
            class="flex h-7 w-9 items-center justify-center rounded-md border border-white/30 bg-gradient-to-br from-amber-100/80 to-amber-300/60"
          >
            <div class="h-4 w-5 rounded-sm border border-slate-900/25" />
          </div>
          <span class="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white/90" :class="card.accentChip">
            {{ card.label }}
          </span>
        </div>

        <div class="relative z-10 mt-5 flex items-center justify-between font-mono text-xs text-white/85">
          <span>{{ card.number }}</span>
          <span class="text-[10px] uppercase tracking-widest text-white/75">FinVault Pay</span>
        </div>
      </div>
    </div>

    <p class="text-center text-[11px] font-medium text-slate-400">
      Tap kartu untuk mengganti pratinjau dompet
    </p>
  </div>
</template>
