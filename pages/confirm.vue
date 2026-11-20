<script setup lang="ts">
import { ShieldCheck } from 'lucide-vue-next'

definePageMeta({
  layout: false
})

const user = useSupabaseUser()

watch(
  user,
  () => {
    if (user.value) {
      navigateTo('/')
    }
  },
  { immediate: true }
)
</script>

<template>
  <div class="relative flex min-h-[100dvh] items-center justify-center overflow-hidden bg-vault-bg px-4">
    <VaultBackdrop focused />

    <div
      class="relative z-10 flex flex-col items-center rounded-2xl border border-vault-border bg-vault-surface/90 px-8 py-7 text-center shadow-2xl backdrop-blur-xl"
    >
      <div class="relative flex h-12 w-12 items-center justify-center">
        <span
          aria-hidden="true"
          class="vault-ping-ring absolute inset-0 rounded-xl border border-emerald-400/50"
        />
        <div
          class="relative flex h-12 w-12 items-center justify-center rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
        >
          <ShieldCheck class="h-6 w-6" />
        </div>
      </div>
      <p class="mt-4 text-sm font-medium text-slate-200">Memverifikasi sesi autentikasi...</p>
    </div>
  </div>
</template>
