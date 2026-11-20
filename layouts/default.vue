<script setup lang="ts">
import {
  ArrowLeftRight,
  Bell,
  Home,
  Landmark,
  LogOut,
  Menu,
  ShieldCheck,
  UserCog,
  X
} from 'lucide-vue-next'
import { getUserDisplayName } from '~/utils/profile'

const route = useRoute()
const supabase = useSupabaseClient()
const user = useSupabaseUser()
const { summary, resetState } = useFinVault()

const mobileDrawerOpen = ref(false)
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

watch(
  () => route.path,
  () => {
    mobileDrawerOpen.value = false
  }
)
</script>

<template>
  <div class="min-h-[100dvh] overflow-x-hidden bg-vault-bg text-slate-100">
    <!-- Desktop Sidebar -->
    <aside
      class="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-white/[0.07] bg-vault-surface lg:flex"
    >
      <div class="flex h-16 items-center gap-3 border-b border-white/[0.07] px-5">
        <div
          class="flex h-9 w-9 items-center justify-center rounded-xl border border-violet-500/30 bg-violet-500/15 text-violet-300"
        >
          <ShieldCheck class="h-5 w-5" />
        </div>
        <div>
          <p class="text-sm font-bold tracking-tight text-white">FinVault</p>
          <p class="text-[11px] font-medium text-slate-400">Real-Time Ledger Engine</p>
        </div>
      </div>

      <nav class="flex-1 space-y-1.5 px-3 py-5" aria-label="Navigasi utama">
        <NuxtLink
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          class="group flex items-center justify-between rounded-2xl px-3.5 py-2.5 text-sm font-medium transition-all duration-200 ease-[cubic-bezier(0.32,0.72,0,1)]"
          :class="
            route.path === item.to
              ? 'bg-white text-slate-950 shadow-sm'
              : 'text-slate-400 hover:bg-vault-card hover:text-slate-100'
          "
        >
          <span class="flex items-center gap-3">
            <component :is="item.icon" class="h-4 w-4 shrink-0" />
            <span>{{ item.label }}</span>
          </span>
          <span
            v-if="item.badge && item.badge > 0"
            class="inline-flex min-w-[20px] items-center justify-center rounded-full px-1.5 py-0.5 font-mono text-[11px] font-bold"
            :class="
              route.path === item.to
                ? 'bg-slate-950 text-amber-400'
                : 'bg-amber-500/20 text-amber-300'
            "
          >
            {{ item.badge }}
          </span>
        </NuxtLink>
      </nav>

      <div class="border-t border-white/[0.07] p-4">
        <div class="mb-3 rounded-2xl border border-white/[0.07] bg-vault-card p-3.5">
          <p class="text-[11px] font-semibold uppercase tracking-wider text-amber-300">
            Zero-Bias Accounting
          </p>
          <p class="mt-1 text-xs leading-relaxed text-slate-400">
            Kas Likuid dipisahkan ketat dari modal terikat &amp; proyeksi imbal hasil.
          </p>
        </div>

        <div class="flex items-center justify-between gap-2 rounded-2xl border border-white/[0.06] bg-vault-card/70 px-3 py-2.5">
          <NuxtLink
            to="/profile"
            class="group flex min-w-0 flex-1 items-center gap-2.5 rounded-xl transition hover:opacity-90"
            title="Edit Profile"
          >
            <UserAvatar :user="user" size="sm" />
            <div class="min-w-0">
              <p class="truncate text-xs font-semibold text-slate-100 group-hover:text-violet-300">
                {{ displayName }}
              </p>
              <p class="truncate text-[11px] text-slate-500">Edit Profile</p>
            </div>
          </NuxtLink>
          <button
            type="button"
            :disabled="isSigningOut"
            class="rounded-xl p-2 text-slate-400 transition hover:bg-slate-800 hover:text-rose-400 active:scale-95 disabled:opacity-50"
            title="Keluar"
            aria-label="Keluar dari akun"
            @click="handleSignOut"
          >
            <LogOut class="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>

    <!-- Pinterest-Style Minimal Mobile Header -->
    <header
      class="sticky top-0 z-30 flex items-center justify-between bg-vault-bg/85 px-4 pb-2 pt-3 backdrop-blur-xl lg:hidden"
    >
      <button
        type="button"
        class="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-vault-card text-slate-200 transition hover:border-white/20 active:scale-95"
        aria-label="Menu akun"
        @click="mobileDrawerOpen = !mobileDrawerOpen"
      >
        <X v-if="mobileDrawerOpen" class="h-4 w-4" />
        <Menu v-else class="h-4 w-4" />
      </button>

      <div class="flex items-center gap-2">
        <NuxtLink
          to="/notifications"
          class="relative flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-vault-card text-slate-200 transition hover:border-white/20 active:scale-95"
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
          class="transition active:scale-95"
          title="Edit Profile"
          aria-label="Edit Profile"
        >
          <UserAvatar :user="user" size="md" />
        </NuxtLink>
      </div>
    </header>

    <!-- Mobile Quick Account Sheet -->
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="-translate-y-2 opacity-0"
      enter-to-class="translate-y-0 opacity-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="translate-y-0 opacity-100"
      leave-to-class="-translate-y-2 opacity-0"
    >
      <div
        v-if="mobileDrawerOpen"
        class="fixed inset-x-4 top-16 z-40 space-y-3 rounded-3xl border border-white/10 bg-vault-surface/95 p-4 shadow-2xl backdrop-blur-xl lg:hidden"
      >
        <div class="flex items-center justify-between gap-3">
          <div class="flex min-w-0 items-center gap-3">
            <UserAvatar :user="user" size="md" />
            <div class="min-w-0">
              <p class="truncate text-sm font-semibold text-white">
                {{ displayName }}
              </p>
              <p class="truncate text-[11px] text-slate-400">
                {{ user?.email || 'FinVault User' }}
              </p>
            </div>
          </div>

          <button
            type="button"
            :disabled="isSigningOut"
            class="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-rose-500/30 bg-rose-500/10 px-3.5 py-2 text-xs font-semibold text-rose-300 transition active:scale-95"
            @click="handleSignOut"
          >
            <LogOut class="h-3.5 w-3.5" />
            Keluar
          </button>
        </div>

        <NuxtLink
          to="/profile"
          class="flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-vault-card px-4 py-2.5 text-xs font-semibold text-slate-200 transition hover:border-white/25 active:scale-[0.98]"
        >
          <UserCog class="h-4 w-4 text-violet-300" />
          Edit Profile &amp; Keamanan
        </NuxtLink>
      </div>
    </Transition>

    <!-- Main Content -->
    <main class="pb-28 lg:pb-10 lg:pl-64">
      <div class="mx-auto max-w-6xl px-4 py-3 sm:px-6 sm:py-5 lg:px-8 lg:py-8">
        <slot />
      </div>
    </main>

    <!-- Pinterest-Style Floating Pill Bottom Dock (Mobile & Tablet) -->
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
