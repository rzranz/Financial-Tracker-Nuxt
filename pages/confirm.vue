<script setup lang="ts">
import { AlertCircle, ShieldCheck } from 'lucide-vue-next'

definePageMeta({
  layout: false
})

const route = useRoute()
const supabase = useSupabaseClient()
const user = useSupabaseUser()

const errorMessage = ref('')
const statusText = ref('Memverifikasi sesi autentikasi...')

watch(
  user,
  () => {
    if (user.value) {
      navigateTo('/')
    }
  },
  { immediate: true }
)

onMounted(async () => {
  const errDesc = route.query.error_description || route.query.error
  if (errDesc) {
    errorMessage.value = String(errDesc)
    return
  }

  const code = route.query.code
  if (typeof code === 'string' && code) {
    statusText.value = 'Menukar kode konfirmasi akun...'
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    if (error) {
      errorMessage.value = error.message
      return
    }
    if (data.user) {
      user.value = data.user
      await navigateTo('/')
      return
    }
  }

  const { data: sessionData } = await supabase.auth.getSession()
  if (sessionData.session?.user) {
    user.value = sessionData.session.user
    await navigateTo('/')
    return
  }

  setTimeout(() => {
    if (!user.value && !errorMessage.value) {
      errorMessage.value =
        'Tautan konfirmasi sudah kedaluwarsa atau sesi belum ditemukan. Silakan masuk kembali.'
    }
  }, 4000)
})
</script>

<template>
  <div class="relative flex min-h-[100dvh] items-center justify-center overflow-hidden bg-vault-bg px-4">
    <VaultBackdrop focused />

    <div
      class="relative z-10 flex w-full max-w-sm flex-col items-center rounded-[28px] border border-white/10 bg-vault-surface/90 px-7 py-8 text-center shadow-2xl backdrop-blur-xl"
    >
      <template v-if="errorMessage">
        <div
          class="flex h-12 w-12 items-center justify-center rounded-full border border-rose-500/30 bg-rose-500/15 text-rose-300"
        >
          <AlertCircle class="h-6 w-6" />
        </div>
        <h1 class="mt-4 text-base font-bold text-white">Konfirmasi Gagal</h1>
        <p class="mt-1.5 text-xs leading-relaxed text-slate-400">
          {{ errorMessage }}
        </p>
        <NuxtLink
          to="/login"
          class="mt-5 inline-flex w-full items-center justify-center rounded-full bg-white px-5 py-2.5 text-xs font-bold text-slate-950 transition hover:bg-slate-200 active:scale-95"
        >
          Kembali ke Halaman Masuk
        </NuxtLink>
      </template>

      <template v-else>
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
        <p class="mt-4 text-sm font-medium text-slate-200">{{ statusText }}</p>
      </template>
    </div>
  </div>
</template>
