<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    size?: 'sm' | 'md' | 'lg'
  }>(),
  {
    size: 'md'
  }
)

const rawId = useId()
const filterId = computed(() => `finvault-goo-${rawId.replace(/[^a-zA-Z0-9_-]/g, '')}`)

const sizeClass = computed(() => {
  switch (props.size) {
    case 'sm':
      return 'h-12 w-12'
    case 'lg':
      return 'h-24 w-24'
    default:
      return 'h-16 w-16'
  }
})
</script>

<template>
  <div
    class="relative inline-flex shrink-0 select-none items-center justify-center"
    :class="sizeClass"
    aria-hidden="true"
  >
    <!-- Soft ambient glow behind the liquid shapes -->
    <div
      class="pointer-events-none absolute inset-1 rounded-full bg-emerald-500/20 blur-xl"
    />

    <svg
      viewBox="0 0 120 120"
      class="h-full w-full overflow-visible"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <filter :id="filterId" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="6.5" result="blur" />
          <feColorMatrix
            in="blur"
            mode="matrix"
            values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 22 -9"
            result="goo"
          />
          <feBlend in="SourceGraphic" in2="goo" />
        </filter>

        <radialGradient :id="`${filterId}-core`" cx="40%" cy="35%" r="65%">
          <stop offset="0%" stop-color="#34D399" />
          <stop offset="65%" stop-color="#10B981" />
          <stop offset="100%" stop-color="#047857" />
        </radialGradient>

        <radialGradient :id="`${filterId}-yield`" cx="40%" cy="35%" r="65%">
          <stop offset="0%" stop-color="#FCD34D" />
          <stop offset="100%" stop-color="#F59E0B" />
        </radialGradient>

        <radialGradient :id="`${filterId}-sky`" cx="40%" cy="35%" r="65%">
          <stop offset="0%" stop-color="#7DD3FC" />
          <stop offset="100%" stop-color="#0EA5E9" />
        </radialGradient>
      </defs>

      <!-- Merging & Separating Shapes (Out-Shape-From-Shape Metaball Group) -->
      <g :filter="`url(#${filterId})`">
        <!-- Core Liquid Orb -->
        <circle
          cx="60"
          cy="60"
          r="22"
          :fill="`url(#${filterId}-core)`"
          class="vault-orb-core"
        />

        <!-- Shape 1: Emerges out top-right and merges back -->
        <circle
          cx="60"
          cy="60"
          r="13"
          :fill="`url(#${filterId}-yield)`"
          class="vault-orb-sat vault-orb-sat-1"
        />

        <!-- Shape 2: Emerges out bottom-left and merges back -->
        <circle
          cx="60"
          cy="60"
          r="11"
          :fill="`url(#${filterId}-core)`"
          class="vault-orb-sat vault-orb-sat-2"
        />

        <!-- Shape 3: Emerges out bottom-right and merges back -->
        <circle
          cx="60"
          cy="60"
          r="9"
          :fill="`url(#${filterId}-sky)`"
          class="vault-orb-sat vault-orb-sat-3"
        />
      </g>
    </svg>
  </div>
</template>

<style scoped>
.vault-orb-core {
  transform-box: fill-box;
  transform-origin: center;
  animation: orb-breathe 4.8s cubic-bezier(0.45, 0.05, 0.55, 0.95) infinite;
}

.vault-orb-sat {
  transform-box: fill-box;
  transform-origin: center;
}

.vault-orb-sat-1 {
  animation: orb-emerge-1 4.8s cubic-bezier(0.45, 0.05, 0.55, 0.95) infinite;
}

.vault-orb-sat-2 {
  animation: orb-emerge-2 5.6s cubic-bezier(0.45, 0.05, 0.55, 0.95) infinite;
  animation-delay: -1.8s;
}

.vault-orb-sat-3 {
  animation: orb-emerge-3 6.2s cubic-bezier(0.45, 0.05, 0.55, 0.95) infinite;
  animation-delay: -3.1s;
}

@keyframes orb-breathe {
  0%,
  100% {
    transform: scale(1);
  }
  50% {
    transform: scale(0.92);
  }
}

@keyframes orb-emerge-1 {
  0%,
  100% {
    transform: translate3d(0, 0, 0) scale(0.65);
  }
  45%,
  55% {
    transform: translate3d(25px, -18px, 0) scale(1);
  }
}

@keyframes orb-emerge-2 {
  0%,
  100% {
    transform: translate3d(0, 0, 0) scale(0.65);
  }
  45%,
  55% {
    transform: translate3d(-24px, 16px, 0) scale(0.95);
  }
}

@keyframes orb-emerge-3 {
  0%,
  100% {
    transform: translate3d(0, 0, 0) scale(0.6);
  }
  45%,
  55% {
    transform: translate3d(18px, 24px, 0) scale(0.9);
  }
}

@media (prefers-reduced-motion: reduce) {
  .vault-orb-core,
  .vault-orb-sat-1,
  .vault-orb-sat-2,
  .vault-orb-sat-3 {
    animation: none;
  }

  .vault-orb-sat-1 {
    transform: translate3d(20px, -14px, 0) scale(0.9);
  }

  .vault-orb-sat-2 {
    transform: translate3d(-18px, 12px, 0) scale(0.85);
  }
}
</style>
