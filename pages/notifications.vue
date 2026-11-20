<script setup lang="ts">
import { ArrowRight, Bell, CheckCheck, CircleDot } from 'lucide-vue-next'
import { formatDateID } from '~/utils/finance'

const {
  notifications,
  summary,
  loading,
  initialized,
  refreshAll,
  markNotificationRead,
  markAllNotificationsRead
} = useFinVault()

onMounted(() => {
  if (!initialized.value) {
    refreshAll()
  }
})
</script>

<template>
  <div class="space-y-6">
    <header class="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
      <div>
        <h1 class="text-xl font-bold tracking-tight text-white sm:text-2xl">
          Notifications &amp; Maturity Log
        </h1>
        <p class="mt-1 text-xs text-slate-400 sm:text-sm">
          Notifikasi otomatis dari Vercel Daily Cron &amp; pengecekan jatuh tempo kontrak investasi.
        </p>
      </div>

      <button
        v-if="summary.unreadNotifications > 0"
        type="button"
        class="inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-vault-border bg-vault-card px-4 py-2.5 text-xs font-semibold text-slate-200 transition hover:border-emerald-500/40 hover:text-emerald-300 sm:w-auto"
        @click="markAllNotificationsRead"
      >
        <CheckCheck class="h-4 w-4" />
        Tandai Semua Dibaca ({{ summary.unreadNotifications }})
      </button>
    </header>

    <div class="rounded-2xl border border-vault-border bg-vault-card">
      <div v-if="loading && !initialized" class="space-y-3 p-5">
        <div v-for="i in 4" :key="i" class="h-20 animate-pulse rounded-xl bg-slate-900" />
      </div>

      <div v-else-if="notifications.length === 0" class="p-12 text-center">
        <Bell class="mx-auto h-8 w-8 text-slate-500" />
        <p class="mt-3 text-sm font-semibold text-slate-300">Belum ada notifikasi jatuh tempo</p>
        <p class="mt-1 text-xs text-slate-500">
          Saat kontrak mencapai tanggal maturity, Vercel Cron akan menerbitkan pengingat di sini.
        </p>
      </div>

      <ul v-else class="divide-y divide-vault-border">
        <li
          v-for="notif in notifications"
          :key="notif.id"
          class="flex flex-col justify-between gap-3 p-4 transition sm:flex-row sm:items-center sm:p-5"
          :class="notif.is_read ? 'opacity-70' : 'bg-amber-500/[0.04]'"
        >
          <div class="flex min-w-0 items-start gap-3">
            <CircleDot
              class="mt-1 h-4 w-4 shrink-0"
              :class="notif.is_read ? 'text-slate-600' : 'text-amber-400'"
            />
            <div class="min-w-0">
              <div class="flex flex-wrap items-center gap-2">
                <p class="text-sm font-semibold text-white">{{ notif.title }}</p>
                <span
                  v-if="!notif.is_read"
                  class="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-300"
                >
                  Baru
                </span>
              </div>
              <p class="mt-1 text-xs leading-relaxed text-slate-300">{{ notif.message }}</p>
              <p class="mt-1.5 font-mono text-[11px] text-slate-500">
                {{ formatDateID(notif.created_at) }}
              </p>
            </div>
          </div>

          <div class="flex flex-wrap items-center gap-2 sm:shrink-0">
            <button
              v-if="!notif.is_read"
              type="button"
              class="flex-1 rounded-lg border border-vault-border bg-vault-bg px-3 py-1.5 text-center text-xs font-medium text-slate-300 transition hover:text-white sm:flex-none"
              @click="markNotificationRead(notif.id)"
            >
              Tandai Dibaca
            </button>
            <NuxtLink
              v-if="notif.investment_id"
              to="/investments"
              class="inline-flex flex-1 items-center justify-center gap-1 rounded-lg bg-emerald-500/15 px-3 py-1.5 text-xs font-semibold text-emerald-300 transition hover:bg-emerald-500/25 sm:flex-none"
            >
              Lihat Kontrak
              <ArrowRight class="h-3.5 w-3.5" />
            </NuxtLink>
          </div>
        </li>
      </ul>
    </div>
  </div>
</template>
