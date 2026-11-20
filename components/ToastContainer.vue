<script setup lang="ts">
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-vue-next'

const { toasts, dismissToast } = useToast()
</script>

<template>
  <div
    class="pointer-events-none fixed bottom-20 right-4 z-50 flex w-full max-w-sm flex-col gap-2.5 lg:bottom-6 lg:right-6"
    aria-live="polite"
  >
    <TransitionGroup
      enter-active-class="transition duration-300 ease-out"
      enter-from-class="translate-y-2 opacity-0"
      enter-to-class="translate-y-0 opacity-100"
      leave-active-class="transition duration-200 ease-in"
      leave-from-class="translate-y-0 opacity-100"
      leave-to-class="translate-y-2 opacity-0"
    >
      <div
        v-for="toast in toasts"
        :key="toast.id"
        class="pointer-events-auto flex items-start gap-3 rounded-xl border bg-vault-card/95 p-3.5 shadow-2xl backdrop-blur-md"
        :class="{
          'border-emerald-500/40': toast.variant === 'success',
          'border-rose-500/40': toast.variant === 'error',
          'border-amber-500/40': toast.variant === 'info'
        }"
      >
        <CheckCircle2
          v-if="toast.variant === 'success'"
          class="mt-0.5 h-4 w-4 shrink-0 text-emerald-400"
        />
        <AlertCircle
          v-else-if="toast.variant === 'error'"
          class="mt-0.5 h-4 w-4 shrink-0 text-rose-400"
        />
        <Info v-else class="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />

        <div class="min-w-0 flex-1">
          <p class="text-sm font-semibold text-slate-100">{{ toast.title }}</p>
          <p v-if="toast.description" class="mt-0.5 text-xs text-slate-400">
            {{ toast.description }}
          </p>
        </div>

        <button
          type="button"
          class="rounded-md p-1 text-slate-400 transition hover:bg-slate-800 hover:text-slate-200"
          aria-label="Tutup notifikasi"
          @click="dismissToast(toast.id)"
        >
          <X class="h-3.5 w-3.5" />
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>
