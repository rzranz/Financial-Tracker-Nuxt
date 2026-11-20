<script setup lang="ts">
import {
  ArrowLeftRight,
  Bell,
  Home,
  Landmark,
  LogOut,
  ShieldCheck,
  UserCog
} from 'lucide-vue-next'
import { getUserDisplayName } from '~/utils/profile'

const route = useRoute()
const supabase = useSupabaseClient()
const user = useSupabaseUser()
const { summary, resetState } = useFinVault()

const isSigningOut = ref(false)

const navItems = computed(() => [
  { to: '/', label: 'Overview', mobileLabel: 'Home', icon: Home },
  { to: '/ledger', label: 'Cash Ledger', mobileLabel: 'Ledger', icon: ArrowLeftRight },
  {
    to: '/investments',
    label: 'Investments',
    mobileLabel: 'Invest',
    icon: Landmark,
    badge: summary.value.maturedCount || 0
  },
  {
    to: '/notifications',
    label: 'Notifications',
    mobileLabel: 'Alerts',
    icon: Bell,
    badge: summary.value.unreadNotifications || 0
  }
])

const displayName = computed(() => getUserDisplayName(user.value))

async function handleSignOut() {
  isSigningOut.value = true
  try {
    await supabase.auth.signOut()
    resetState()
    await navigateTo('/login')
  } finally {
    isSigningOut.value = false
  }
}
</script>

<template>
  <div class="min-h-[100dvh] overflow-x-hidden bg-vault-bg text-slate-100">
    <!-- Unified Top Bar (Brand Left + Profile & Notifications Top-Right) -->
    <header
      class="sticky top-0 z-30 border-b border-white/[0.05] bg-vault-bg/85 backdrop-blur-xl"
    >
      <div class="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        <!-- Brand Emblem -->
        <NuxtLink
          to="/"
          class="group flex items-center gap-2.5 rounded-full border border-white/[0.08] bg-vault-card/80 py-1.5 pl-1.5 pr-3.5 transition hover:border-white/20 active:scale-[0.98]"
        >
          <span
            class="flex h-8 w-8 items-center justify-center rounded-full bg-violet-500/20 text-violet-300 transition-transform duration-300 group-hover:scale-105"
          >
            <ShieldCheck class="h-4 w-4" />
          </span>
          <span class="text-sm font-bold tracking-tight text-white">FinVault</span>
        </NuxtLink>

        <!-- Top-Right Profile + Notifications + Sign Out -->
        <div class="flex items-center gap-2">
          <NuxtLink
            to="/notifications"
            class="relative flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-vault-card text-slate-200 transition hover:border-white/25 hover:text-white active:scale-95"
            title="Notifications"
            aria-label="Notifikasi"
          >
            <Bell class="h-4 w-4" />
            <span
              v-if="summary.unreadNotifications > 0"
              class="absolute right-2 top-2 h-2 w-2 rounded-full bg-amber-400 ring-2 ring-vault-card"
            />
          </NuxtLink>

          <NuxtLink
            to="/profile"
            class="group flex items-center gap-2.5 rounded-full border border-white/10 bg-vault-card py-1 pl-1 pr-3 transition hover:border-violet-400/40 active:scale-[0.98]"
            title="Edit Profile"
            aria-label="Edit Profile"
          >
            <UserAvatar :user="user" size="sm" />
            <div class="hidden text-left sm:block">
              <p class="max-w-[140px] truncate text-xs font-semibold text-white group-hover:text-violet-300">
                {{ displayName }}
              </p>
              <p class="text-[10px] text-slate-400">Edit Profile</p>
            </div>
          </NuxtLink>

          <button
            type="button"
            :disabled="isSigningOut"
            class="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-vault-card text-slate-400 transition hover:border-rose-500/40 hover:bg-rose-500/10 hover:text-rose-300 active:scale-95 disabled:opacity-50"
            title="Keluar"
            aria-label="Keluar dari akun"
            @click="handleSignOut"
          >
            <LogOut class="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>

    <!-- Desktop Floating Circular Rail (No wide sidebar — circular pills + hover page name!) -->
    <nav
      aria-label="Navigasi desktop"
      class="fixed left-5 top-1/2 z-30 hidden -translate-y-1/2 flex-col items-center gap-2 rounded-full border border-white/10 bg-[#12141C]/90 p-2 shadow-[0_20px_50px_rgba(0,0,0,0.75)] backdrop-blur-xl lg:flex"
    >
      <NuxtLink
        v-for="item in navItems"
        :key="item.to"
        :to="item.to"
        class="group relative flex h-11 w-11 items-center justify-center rounded-full transition-all duration-200 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-95"
        :class="
          route.path === item.to
            ? 'bg-white text-slate-950 shadow-md'
            : 'text-slate-400 hover:bg-white/10 hover:text-white'
        "
        :aria-label="item.label"
      >
        <component :is="item.icon" class="h-4 w-4 shrink-0" />

        <span
          v-if="item.badge && item.badge > 0"
          class="absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-amber-400 px-1 font-mono text-[10px] font-bold text-slate-950"
        >
          {{ item.badge }}
        </span>

        <!-- Hover Tooltip revealing page name -->
        <span
          class="pointer-events-none absolute left-14 whitespace-nowrap rounded-full border border-white/10 bg-[#181B26] px-3 py-1.5 text-xs font-semibold text-white opacity-0 shadow-xl transition-all duration-200 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-0 group-hover:opacity-100"
          style="transform: translateX(-6px);"
        >
          {{ item.label }}
        </span>
      </NuxtLink>

      <div class="my-0.5 h-px w-6 bg-white/10" aria-hidden="true" />

      <NuxtLink
        to="/profile"
        class="group relative flex h-11 w-11 items-center justify-center rounded-full transition-all duration-200 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-95"
        :class="
          route.path === '/profile'
            ? 'bg-white text-slate-950 shadow-md'
            : 'text-slate-400 hover:bg-white/10 hover:text-white'
        "
        aria-label="Profile"
      >
        <UserCog class="h-4 w-4 shrink-0" />
        <span
          class="pointer-events-none absolute left-14 whitespace-nowrap rounded-full border border-white/10 bg-[#181B26] px-3 py-1.5 text-xs font-semibold text-white opacity-0 shadow-xl transition-all duration-200 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-0 group-hover:opacity-100"
          style="transform: translateX(-6px);"
        >
          Edit Profile
        </span>
      </NuxtLink>
    </nav>

    <!-- Main Content -->
    <main class="pb-28 lg:pb-12 lg:pl-20">
      <div class="mx-auto max-w-6xl px-4 py-4 sm:px-6 sm:py-6 lg:px-8">
        <slot />
      </div>
    </main>

    <!-- Mobile & Tablet Floating Pill Bottom Dock -->
    <nav
      aria-label="Navigasi mobile"
      class="fixed inset-x-4 bottom-4 z-40 mx-auto flex max-w-md items-center justify-between gap-1 rounded-full border border-white/10 bg-[#13151E]/95 p-1.5 pb-[calc(0.375rem+env(safe-area-inset-bottom))] shadow-[0_20px_50px_rgba(0,0,0,0.85)] backdrop-blur-xl lg:hidden"
    >
      <NuxtLink
        v-for="item in navItems"
        :key="item.to"
        :to="item.to"
        class="relative flex items-center justify-center gap-2 rounded-full transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-95"
        :class="
          route.path === item.to
            ? 'bg-white px-4 py-2.5 text-slate-950 shadow-sm'
            : 'h-10 w-10 text-slate-400 hover:bg-white/5 hover:text-white'
        "
      >
        <component :is="item.icon" class="h-4 w-4 shrink-0" />
        <span
          v-if="route.path === item.to"
          class="text-xs font-bold tracking-tight"
        >
          {{ item.mobileLabel }}
        </span>
        <span
          v-if="item.badge && item.badge > 0 && route.path !== item.to"
          class="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-amber-400"
        />
      </NuxtLink>
    </nav>

    <ToastContainer />
  </div>
</template>
