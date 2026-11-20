<script setup lang="ts">
withDefaults(
  defineProps<{
    focused?: boolean
  }>(),
  {
    focused: false
  }
)
</script>

<template>
  <div class="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
    <!-- Subtle architectural grid -->
    <div class="vault-grid-pattern absolute inset-0 opacity-[0.035]" />

    <!-- Morphing background shapes emerging softly from behind the central surface -->
    <div
      class="vault-bg-shape vault-bg-shape-1 absolute left-1/2 top-1/2 h-[420px] w-[420px] -translate-x-[62%] -translate-y-[58%] rounded-[42%] bg-emerald-500/[0.09] blur-[90px] transition-transform duration-700 ease-[cubic-bezier(0.32,0.72,0,1)]"
      :class="focused ? 'scale-110 opacity-100' : 'scale-100 opacity-80'"
    />
    <div
      class="vault-bg-shape vault-bg-shape-2 absolute left-1/2 top-1/2 h-[360px] w-[360px] -translate-x-[35%] -translate-y-[40%] rounded-[46%] bg-sky-500/[0.07] blur-[95px] transition-transform duration-700 ease-[cubic-bezier(0.32,0.72,0,1)]"
      :class="focused ? 'scale-115 opacity-100' : 'scale-100 opacity-75'"
    />
    <div
      class="vault-bg-shape vault-bg-shape-3 absolute left-1/2 top-1/2 h-[280px] w-[280px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-emerald-500/10 transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)]"
      :class="focused ? 'scale-125 border-emerald-400/20' : 'scale-100'"
    />
  </div>
</template>

<style scoped>
.vault-grid-pattern {
  background-image:
    linear-gradient(to right, rgba(148, 163, 184, 0.4) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(148, 163, 184, 0.4) 1px, transparent 1px);
  background-size: 48px 48px;
  mask-image: radial-gradient(circle at center, black 20%, transparent 75%);
}

.vault-bg-shape-1 {
  animation: vault-drift-1 14s ease-in-out infinite alternate;
}

.vault-bg-shape-2 {
  animation: vault-drift-2 17s ease-in-out infinite alternate;
}

@keyframes vault-drift-1 {
  0% {
    border-radius: 42% 58% 62% 38% / 45% 40% 60% 55%;
  }
  100% {
    border-radius: 56% 44% 38% 62% / 58% 52% 48% 42%;
  }
}

@keyframes vault-drift-2 {
  0% {
    border-radius: 54% 46% 40% 60% / 48% 60% 40% 52%;
  }
  100% {
    border-radius: 38% 62% 55% 45% / 60% 42% 58% 40%;
  }
}

@media (prefers-reduced-motion: reduce) {
  .vault-bg-shape-1,
  .vault-bg-shape-2 {
    animation: none;
  }
}
</style>
