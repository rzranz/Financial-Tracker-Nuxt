<script setup lang="ts">
import {
  ArrowLeftRight,
  Bell,
  Landmark,
  LayoutDashboard,
  LogOut,
  ShieldCheck
} from 'lucide-vue-next'

const route = useRoute()
const supabase = useSupabaseClient()
const user = useSupabaseUser()
const { summary } = useFinVault()

const navItems = computed(() => [
  { to: '/', label: 'Overview', icon: LayoutDashboard },
  { to: '/ledger', label: 'Cash Ledger', icon: ArrowLeftRight },
  { to: '/investments', label: 'Investments', icon: Landmark, badge: summary.value.maturedCount || 0 },
  {
    to: '/notifications',
    label: 'Notifications',
    icon: Bell,
    badge: summary.value.unreadNotifications || 0
  }
])

const isSigningOut = ref(false)
async function handleSignOut() {
  isSigningOut.value = true
  try {
    await supabase.auth.signOut()
    await navigateTo('/login')
  } finally {
    isSigningOut.value = false
  }
}
</script>

<template>
  <div class="min-h-[100dvh] bg-vault-bg text-slate-100">
    <!-- Desktop Sidebar -->
    <aside
      class="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-vault-border bg-vault-surface lg:flex"
    >
      <div class="flex h-16 items-center gap-3 border-b border-vault-border px-5">
        <div
          class="flex h-9 w-9 items-center justify-center rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
        >
          <ShieldCheck class="h-5 w-5" />
        </div>
        <div>
          <p class="text-sm font-bold tracking-tight text-white">FinVault</p>
          <p class="text-[11px] font-medium text-slate-400">Real-Time Ledger Engine</p>
        </div>
      </div>

      <nav class="flex-1 space-y-1.5 px-3 py-5">
        <NuxtLink
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          class="group flex items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors"
          :class="
            route.path === item.to
              ? 'border border-emerald-500/25 bg-emerald-500/10 text-emerald-300'
              : 'border border-transparent text-slate-400 hover:bg-vault-card hover:text-slate-100'
          "
        >
          <span class="flex items-center gap-3">
            <component :is="item.icon" class="h-4 w-4 shrink-0" />
            <span>{{ item.label }}</span>
          </span>
          <span
            v-if="item.badge && item.badge > 0"
            class="inline-flex min-w-[20px] items-center justify-center rounded-full bg-amber-500/20 px-1.5 py-0.5 font-mono text-[11px] font-semibold text-amber-300"
          >
            {{ item.badge }}
          </span>
        </NuxtLink>
      </nav>

      <div class="border-t border-vault-border p-4">
        <div class="mb-3 rounded-xl border border-vault-border bg-vault-card p-3">
          <p class="text-[11px] font-semibold uppercase tracking-wider text-emerald-400">
            Zero-Bias Accounting
          </p>
          <p class="mt-1 text-xs leading-relaxed text-slate-400">
            Kas Likuid dipisahkan ketat dari modal terikat &amp; proyeksi imbal hasil.
          </p>
        </div>

        <div class="flex items-center justify-between gap-2 rounded-xl bg-vault-card/60 px-3 py-2.5">
          <div class="min-w-0">
            <p class="truncate text-xs font-medium text-slate-200">
              {{ user?.email || 'Authenticated User' }}
            </p>
            <p class="text-[11px] text-slate-500">RLS Protected</p>
          </div>
          <button
            type="button"
            :disabled="isSigningOut"
            class="rounded-lg p-2 text-slate-400 transition hover:bg-slate-800 hover:text-rose-400 disabled:opacity-50"
            title="Keluar"
            @click="handleSignOut"
          >
            <LogOut class="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>

    <!-- Mobile Header -->
    <header
      class="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-vault-border bg-vault-surface/95 px-4 backdrop-blur-md lg:hidden"
    >
      <div class="flex items-center gap-2.5">
        <div
          class="flex h-8 w-8 items-center justify-center rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
        >
          <ShieldCheck class="h-4 w-4" />
        </div>
        <span class="text-sm font-bold tracking-tight text-white">FinVault</span>
      </div>
      <button
        type="button"
        :disabled="isSigningOut"
        class="inline-flex items-center gap-1.5 rounded-lg border border-vault-border bg-vault-card px-2.5 py-1.5 text-xs font-medium text-slate-300 transition hover:text-rose-400"
        @click="handleSignOut"
      >
        <LogOut class="h-3.5 w-3.5" />
        <span>Keluar</span>
      </button>
    </header>

    <!-- Main Content -->
    <main class="pb-24 lg:pb-10 lg:pl-64">
      <div class="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <slot />
      </div>
    </main>

    <!-- Mobile Bottom Navigation -->
    <nav
      class="fixed inset-x-0 bottom-0 z-30 grid grid-cols-4 border-t border-vault-border bg-vault-surface/95 backdrop-blur-md lg:hidden"
    >
      <NuxtLink
        v-for="item in navItems"
        :key="item.to"
        :to="item.to"
        class="relative flex flex-col items-center justify-center gap-1 py-2.5 text-[11px] font-medium transition-colors"
        :class="route.path === item.to ? 'text-emerald-400' : 'text-slate-400'"
      >
        <component :is="item.icon" class="h-4 w-4" />
        <span>{{ item.label === 'Notifications' ? 'Alerts' : item.label }}</span>
        <span
          v-if="item.badge && item.badge > 0"
          class="absolute right-4 top-1.5 inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-amber-500 px-1 font-mono text-[10px] font-bold text-slate-950"
        >
          {{ item.badge }}
        </span>
      </NuxtLink>
    </nav>

    <ToastContainer />
  </div>
</template>
