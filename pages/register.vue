<script setup lang="ts">
import { ArrowRight, CheckCircle2, Lock, Mail, ShieldCheck } from 'lucide-vue-next'
import { getAuthConfirmUrl } from '~/utils/auth-url'

definePageMeta({
  layout: false
})

const config = useRuntimeConfig()
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
        emailRedirectTo: getAuthConfirmUrl(config.public.siteUrl)
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
  <div class="relative flex min-h-[100dvh] items-center justify-center overflow-hidden bg-vault-bg px-4 py-8 sm:py-12">
    <VaultBackdrop :focused="isInteracting" />

    <div class="relative z-10 mx-auto grid w-full max-w-5xl grid-cols-1 items-center gap-8 lg:grid-cols-12 lg:gap-12">
      <!-- Mobile Banking Showcase Stage -->
      <div class="flex flex-col items-center space-y-6 text-center lg:col-span-6 lg:items-start lg:text-left">
        <div class="inline-flex items-center gap-2 rounded-full border border-white/10 bg-vault-card/80 px-3 py-1.5 backdrop-blur-md">
          <span class="flex h-5 w-5 items-center justify-center rounded-full bg-violet-500/20 text-violet-300">
            <ShieldCheck class="h-3.5 w-3.5" />
          </span>
          <span class="text-xs font-semibold tracking-wide text-slate-200">FinVault Account</span>
        </div>

        <div class="space-y-2.5">
          <h1 class="text-3xl font-extrabold uppercase leading-[1.05] tracking-tight text-white sm:text-4xl lg:text-5xl">
            ONE VAULT.<br />FULL CONTROL.
          </h1>
          <p class="mx-auto max-w-md text-xs leading-relaxed text-slate-400 sm:text-sm lg:mx-0">
            Terisolasi penuh dengan PostgreSQL Row Level Security dan kalkulasi desimal eksak.
          </p>
        </div>

        <div class="w-full max-w-sm">
          <AuthCardDeck />
        </div>
      </div>

      <!-- Registration Card -->
      <div class="w-full lg:col-span-6">
        <div
          class="mx-auto w-full max-w-md rounded-[28px] border border-white/10 bg-vault-surface/90 p-6 shadow-2xl backdrop-blur-xl transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] sm:p-7"
          :class="isInteracting ? 'border-violet-400/40 shadow-[0_24px_60px_-25px_rgba(124,58,237,0.35)]' : ''"
          @mouseenter="isInteracting = true"
          @mouseleave="isInteracting = false"
        >
          <div class="grid grid-cols-2 gap-2 rounded-full border border-white/10 bg-vault-bg p-1">
            <NuxtLink
              to="/login"
              class="rounded-full py-2 text-center text-xs font-semibold text-slate-400 transition hover:text-white"
            >
              Masuk
            </NuxtLink>
            <span
              class="rounded-full bg-white py-2 text-center text-xs font-bold text-slate-950 shadow-sm"
            >
              Daftar
            </span>
          </div>

          <div
            v-if="registeredSuccess"
            class="mt-6 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-xs text-emerald-200"
          >
            <div class="flex items-start gap-2.5">
              <CheckCircle2 class="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
              <div>
                <p class="font-semibold">Registrasi Berhasil</p>
                <p class="mt-1 leading-relaxed text-emerald-200/80">
                  Cek kotak masuk email Anda untuk konfirmasi akun, lalu masuk ke dashboard.
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
                  class="w-full rounded-2xl border border-vault-border bg-vault-card py-3 pl-10 pr-3.5 text-sm text-white placeholder-slate-500 transition focus:border-violet-500 focus:outline-none"
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
                  class="w-full rounded-2xl border border-vault-border bg-vault-card py-3 pl-10 pr-3.5 text-sm text-white placeholder-slate-500 transition focus:border-violet-500 focus:outline-none"
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
                  class="w-full rounded-2xl border border-vault-border bg-vault-card py-3 pl-10 pr-3.5 text-sm text-white placeholder-slate-500 transition focus:border-violet-500 focus:outline-none"
                />
              </div>
            </div>

            <p
              v-if="errorMessage"
              class="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-3.5 py-2 text-xs text-rose-300"
            >
              {{ errorMessage }}
            </p>

            <button
              type="submit"
              :disabled="loading"
              class="group flex w-full items-center justify-center gap-2 rounded-full bg-white py-3 text-sm font-bold text-slate-950 transition duration-200 hover:bg-slate-200 active:scale-[0.98] disabled:opacity-50"
            >
              <span>{{ loading ? 'Mendaftarkan...' : 'Buat Akun FinVault' }}</span>
              <ArrowRight
                v-if="!loading"
                class="h-4 w-4 transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-1"
              />
            </button>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>
