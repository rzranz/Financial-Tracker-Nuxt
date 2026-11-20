<script setup lang="ts">
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
  <div class="flex min-h-[100dvh] items-center justify-center bg-vault-bg px-4">
    <div class="rounded-2xl border border-vault-border bg-vault-surface px-8 py-6 text-center">
      <div class="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-emerald-400 border-t-transparent" />
      <p class="mt-3 text-sm font-medium text-slate-200">Memverifikasi sesi autentikasi...</p>
    </div>
  </div>
</template>
