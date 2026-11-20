<script setup lang="ts">
import { ArrowRight, Lock, Mail, RefreshCw, ShieldCheck } from 'lucide-vue-next'

definePageMeta({
  layout: false
})

const supabase = useSupabaseClient()
const user = useSupabaseUser()

const email = ref('')
const password = ref('')
const loading = ref(false)
const resending = ref(false)
const isInteracting = ref(false)
const errorMessage = ref('')
const needsConfirmation = ref(false)
const resendMessage = ref('')

watchEffect(() => {
  if (user.value) {
    navigateTo('/')
  }
})

async function handleLogin() {
  errorMessage.value = ''
  resendMessage.value = ''
  needsConfirmation.value = false
  loading.value = true
  try {
    const { error } = await supabase.auth.signInWithPassword({
      email: email.value.trim(),
      password: password.value
    })
    if (error) {
      if (error.message.toLowerCase().includes('email not confirmed')) {
        needsConfirmation.value = true
        errorMessage.value =
          'Email Anda belum dikonfirmasi. Cek inbox/spam email Anda untuk klik tautan verifikasi, atau konfirmasi akun di Supabase Dashboard.'
      } else {
        errorMessage.value = error.message
      }
      return
    }
    await navigateTo('/')
  } finally {
    loading.value = false
  }
}

async function handleResendConfirmation() {
  if (!email.value.trim() || resending.value) return
  resending.value = true
  resendMessage.value = ''
  try {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: email.value.trim(),
      options: {
        emailRedirectTo: import.meta.client ? `${window.location.origin}/confirm` : undefined
      }
    })
    if (error) {
      errorMessage.value = error.message
      return
    }
    resendMessage.value = 'Email konfirmasi baru telah dikirim. Periksa kotak masuk atau folder Spam.'
  } finally {
    resending.value = false
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
          <h1 class="text-lg font-bold text-white">Masuk ke FinVault</h1>
          <p class="text-xs text-slate-400">Personal Cash Ledger &amp; Investment Contract Engine</p>
        </div>
      </div>

      <form
        class="mt-6 space-y-4"
        @focusin="isInteracting = true"
        @focusout="isInteracting = false"
        @submit.prevent="handleLogin"
      >
        <div class="space-y-1.5">
          <label for="login-email" class="block text-xs font-medium text-slate-300">Email</label>
          <div class="relative">
            <Mail class="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              id="login-email"
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
          <label for="login-password" class="block text-xs font-medium text-slate-300">Password</label>
          <div class="relative">
            <Lock class="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              id="login-password"
              v-model="password"
              type="password"
              required
              autocomplete="current-password"
              placeholder="••••••••"
              class="w-full rounded-xl border border-vault-border bg-vault-card py-2.5 pl-10 pr-3.5 text-sm text-white placeholder-slate-500 transition focus:border-emerald-500 focus:outline-none"
            />
          </div>
        </div>

        <div
          v-if="errorMessage"
          class="space-y-2 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2.5 text-xs text-rose-300"
        >
          <p class="leading-relaxed">{{ errorMessage }}</p>
          <button
            v-if="needsConfirmation"
            type="button"
            :disabled="resending"
            class="inline-flex items-center gap-1.5 rounded-lg border border-amber-500/40 bg-amber-500/15 px-2.5 py-1.5 text-[11px] font-semibold text-amber-200 transition hover:bg-amber-500/25 active:scale-[0.98] disabled:opacity-50"
            @click="handleResendConfirmation"
          >
            <RefreshCw class="h-3 w-3" :class="{ 'animate-spin': resending }" />
            {{ resending ? 'Mengirim ulang...' : 'Kirim Ulang Email Konfirmasi' }}
          </button>
        </div>

        <p
          v-if="resendMessage"
          class="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-300"
        >
          {{ resendMessage }}
        </p>

        <button
          type="submit"
          :disabled="loading"
          class="group flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 py-2.5 text-sm font-bold text-slate-950 transition duration-200 hover:bg-emerald-400 active:scale-[0.98] disabled:opacity-50"
        >
          <span>{{ loading ? 'Memverifikasi...' : 'Masuk' }}</span>
          <ArrowRight
            v-if="!loading"
            class="h-4 w-4 transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-1"
          />
        </button>
      </form>

      <p class="mt-6 text-center text-xs text-slate-400">
        Belum memiliki akun?
        <NuxtLink to="/register" class="font-semibold text-emerald-400 hover:text-emerald-300">
          Daftar sekarang
        </NuxtLink>
      </p>
    </div>
  </div>
</template>
