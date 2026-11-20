<script setup lang="ts">
import { ArrowRight, CheckCircle2, Lock, Mail, ShieldCheck } from 'lucide-vue-next'

definePageMeta({
  layout: false
})

const supabase = useSupabaseClient()
const user = useSupabaseUser()

const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const loading = ref(false)
const isInteracting = ref(false)
const errorMessage = ref('')
const registeredSuccess = ref(false)

watchEffect(() => {
  if (user.value) {
    navigateTo('/')
  }
})

async function handleRegister() {
  errorMessage.value = ''
  if (password.value.length < 6) {
    errorMessage.value = 'Password minimal 6 karakter.'
    return
  }
  if (password.value !== confirmPassword.value) {
    errorMessage.value = 'Konfirmasi password tidak cocok.'
    return
  }

  loading.value = true
  try {
    const { data, error } = await supabase.auth.signUp({
      email: email.value.trim(),
      password: password.value,
      options: {
        emailRedirectTo: import.meta.client ? `${window.location.origin}/confirm` : undefined
      }
    })
    if (error) {
      errorMessage.value = error.message
      return
    }
    if (data.session) {
      await navigateTo('/')
      return
    }
    registeredSuccess.value = true
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="relative flex min-h-[100dvh] items-center justify-center overflow-hidden bg-vault-bg px-4 py-12">
    <VaultBackdrop :focused="isInteracting" />

    <div
      class="relative z-10 w-full max-w-md rounded-2xl border border-vault-border bg-vault-surface/90 p-7 shadow-2xl backdrop-blur-xl transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]"
      :class="isInteracting ? 'border-emerald-500/35 shadow-[0_24px_60px_-25px_rgba(16,185,129,0.25)]' : ''"
      @mouseenter="isInteracting = true"
      @mouseleave="isInteracting = false"
    >
      <div class="flex items-center gap-3">
        <div
          class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]"
          :class="isInteracting ? 'scale-105' : ''"
        >
          <ShieldCheck class="h-5 w-5" />
        </div>
        <div>
          <h1 class="text-lg font-bold text-white">Buat Akun FinVault</h1>
          <p class="text-xs text-slate-400">Terisolasi total dengan Supabase Row Level Security</p>
        </div>
      </div>

      <div
        v-if="registeredSuccess"
        class="mt-6 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-xs text-emerald-200"
      >
        <div class="flex items-start gap-2.5">
          <CheckCircle2 class="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
          <div>
            <p class="font-semibold">Registrasi Berhasil</p>
            <p class="mt-1 leading-relaxed text-emerald-200/80">
              Cek kotak masuk email Anda untuk konfirmasi akun, lalu login ke dashboard.
            </p>
          </div>
        </div>
      </div>

      <form
        v-else
        class="mt-6 space-y-4"
        @focusin="isInteracting = true"
        @focusout="isInteracting = false"
        @submit.prevent="handleRegister"
      >
        <div class="space-y-1.5">
          <label for="reg-email" class="block text-xs font-medium text-slate-300">Email</label>
          <div class="relative">
            <Mail class="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              id="reg-email"
              v-model="email"
              type="email"
              required
              autocomplete="email"
              placeholder="nama@email.com"
              class="w-full rounded-xl border border-vault-border bg-vault-card py-2.5 pl-10 pr-3.5 text-sm text-white placeholder-slate-500 transition focus:border-emerald-500 focus:outline-none"
            />
          </div>
        </div>

        <div class="space-y-1.5">
          <label for="reg-password" class="block text-xs font-medium text-slate-300">Password</label>
          <div class="relative">
            <Lock class="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              id="reg-password"
              v-model="password"
              type="password"
              required
              minlength="6"
              autocomplete="new-password"
              placeholder="Minimal 6 karakter"
              class="w-full rounded-xl border border-vault-border bg-vault-card py-2.5 pl-10 pr-3.5 text-sm text-white placeholder-slate-500 transition focus:border-emerald-500 focus:outline-none"
            />
          </div>
        </div>

        <div class="space-y-1.5">
          <label for="reg-confirm" class="block text-xs font-medium text-slate-300">
            Konfirmasi Password
          </label>
          <div class="relative">
            <Lock class="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              id="reg-confirm"
              v-model="confirmPassword"
              type="password"
              required
              minlength="6"
              autocomplete="new-password"
              placeholder="Ulangi password"
              class="w-full rounded-xl border border-vault-border bg-vault-card py-2.5 pl-10 pr-3.5 text-sm text-white placeholder-slate-500 transition focus:border-emerald-500 focus:outline-none"
            />
          </div>
        </div>

        <p
          v-if="errorMessage"
          class="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-300"
        >
          {{ errorMessage }}
        </p>

        <button
          type="submit"
          :disabled="loading"
          class="group flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 py-2.5 text-sm font-bold text-slate-950 transition duration-200 hover:bg-emerald-400 active:scale-[0.98] disabled:opacity-50"
        >
          <span>{{ loading ? 'Mendaftarkan...' : 'Buat Akun' }}</span>
          <ArrowRight
            v-if="!loading"
            class="h-4 w-4 transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-1"
          />
        </button>
      </form>

      <p class="mt-6 text-center text-xs text-slate-400">
        Sudah punya akun?
        <NuxtLink to="/login" class="font-semibold text-emerald-400 hover:text-emerald-300">
          Masuk di sini
        </NuxtLink>
      </p>
    </div>
  </div>
</template>
