<script setup lang="ts">
import { Check, KeyRound, Mail, Save, ShieldCheck, User } from 'lucide-vue-next'
import { extractApiErrorMessage } from '~/utils/errors'
import {
  AVATAR_THEMES,
  type AvatarTheme,
  getUserDisplayName,
  getUserProfileMeta
} from '~/utils/profile'

const supabase = useSupabaseClient()
const user = useSupabaseUser()
const { pushToast } = useToast()

const fullName = ref('')
const username = ref('')
const bio = ref('')
const avatarUrl = ref('')
const avatarTheme = ref<AvatarTheme>('violet')
const savingProfile = ref(false)
const profileError = ref('')

const newPassword = ref('')
const confirmPassword = ref('')
const savingPassword = ref(false)
const passwordError = ref('')

function hydrateFromUser() {
  const meta = getUserProfileMeta(user.value)
  fullName.value = meta.full_name || ''
  username.value = meta.username || ''
  bio.value = meta.bio || ''
  avatarUrl.value = meta.avatar_url || ''
  avatarTheme.value = meta.avatar_theme || 'violet'
}

watch(
  user,
  () => {
    hydrateFromUser()
  },
  { immediate: true }
)

const previewName = computed(
  () => fullName.value.trim() || username.value.trim() || getUserDisplayName(user.value)
)

async function handleSaveProfile() {
  profileError.value = ''

  if (avatarUrl.value.trim() && !/^https?:\/\/.+/i.test(avatarUrl.value.trim())) {
    profileError.value = 'URL avatar harus diawali dengan http:// atau https://'
    return
  }

  savingProfile.value = true
  try {
    const { data, error } = await supabase.auth.updateUser({
      data: {
        full_name: fullName.value.trim(),
        username: username.value.trim().replace(/^@+/, ''),
        bio: bio.value.trim(),
        avatar_url: avatarUrl.value.trim(),
        avatar_theme: avatarTheme.value
      }
    })

    if (error) {
      profileError.value = error.message
      return
    }

    if (data.user) {
      user.value = data.user
    }

    pushToast({
      title: 'Profil Diperbarui',
      description: 'Identitas dan preferensi tampilan profil Anda telah disimpan.',
      variant: 'success'
    })
  } catch (err: unknown) {
    profileError.value = extractApiErrorMessage(err, 'Gagal memperbarui profil')
  } finally {
    savingProfile.value = false
  }
}

async function handleUpdatePassword() {
  passwordError.value = ''

  if (newPassword.value.length < 6) {
    passwordError.value = 'Password baru minimal 6 karakter.'
    return
  }
  if (newPassword.value !== confirmPassword.value) {
    passwordError.value = 'Konfirmasi password tidak cocok.'
    return
  }

  savingPassword.value = true
  try {
    const { error } = await supabase.auth.updateUser({
      password: newPassword.value
    })
    if (error) {
      passwordError.value = error.message
      return
    }

    newPassword.value = ''
    confirmPassword.value = ''
    pushToast({
      title: 'Password Diperbarui',
      description: 'Password baru Anda sudah aktif.',
      variant: 'success'
    })
  } catch (err: unknown) {
    passwordError.value = extractApiErrorMessage(err, 'Gagal memperbarui password')
  } finally {
    savingPassword.value = false
  }
}
</script>

<template>
  <div class="space-y-6">
    <header>
      <h1 class="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
        Edit Profile
      </h1>
      <p class="mt-1 text-xs text-slate-400 sm:text-sm">
        Kelola identitas akun, tema avatar, serta keamanan kata sandi Supabase Anda.
      </p>
    </header>

    <!-- Live Profile Preview Banner -->
    <section class="vault-bezel relative overflow-hidden rounded-[28px] p-5 sm:p-6">
      <div
        aria-hidden="true"
        class="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-violet-500/10 blur-2xl"
      />
      <div class="relative z-10 flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div class="flex items-center gap-4">
          <UserAvatar
            :user="user"
            size="lg"
            :override-avatar-url="avatarUrl"
            :override-theme="avatarTheme"
            :override-name="previewName"
          />
          <div class="min-w-0">
            <div class="flex flex-wrap items-center gap-2">
              <h2 class="truncate text-lg font-bold text-white">{{ previewName }}</h2>
              <span
                v-if="username.trim()"
                class="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 font-mono text-[11px] text-slate-300"
              >
                @{{ username.trim().replace(/^@+/, '') }}
              </span>
            </div>
            <p class="mt-0.5 flex items-center gap-1.5 text-xs text-slate-400">
              <Mail class="h-3.5 w-3.5 shrink-0" />
              <span class="truncate">{{ user?.email || '-' }}</span>
            </p>
            <p v-if="bio.trim()" class="mt-1.5 text-xs text-slate-300">
              {{ bio.trim() }}
            </p>
          </div>
        </div>

        <span
          class="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold text-emerald-300"
        >
          <ShieldCheck class="h-3.5 w-3.5" />
          RLS Verified Account
        </span>
      </div>
    </section>

    <div class="grid grid-cols-1 gap-6 lg:grid-cols-12">
      <!-- Profile Identity Form -->
      <section class="vault-bezel rounded-[28px] p-5 sm:p-6 lg:col-span-7">
        <div class="flex items-center gap-2 border-b border-white/[0.07] pb-4">
          <User class="h-4 w-4 text-violet-300" />
          <h2 class="text-sm font-bold text-white">Informasi Profil</h2>
        </div>

        <form class="mt-5 space-y-4" @submit.prevent="handleSaveProfile">
          <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div class="space-y-1.5">
              <label for="profile-name" class="block text-xs font-medium text-slate-300">
                Nama Lengkap
              </label>
              <input
                id="profile-name"
                v-model="fullName"
                type="text"
                maxlength="80"
                placeholder="Misal: Rizki Ananda"
                class="w-full rounded-xl border border-vault-border bg-vault-bg px-3.5 py-2.5 text-sm text-white placeholder-slate-500 transition focus:border-violet-500 focus:outline-none"
              />
            </div>

            <div class="space-y-1.5">
              <label for="profile-username" class="block text-xs font-medium text-slate-300">
                Username / Panggilan
              </label>
              <input
                id="profile-username"
                v-model="username"
                type="text"
                maxlength="40"
                placeholder="Misal: rzranz"
                class="w-full rounded-xl border border-vault-border bg-vault-bg px-3.5 py-2.5 text-sm text-white placeholder-slate-500 transition focus:border-violet-500 focus:outline-none"
              />
            </div>
          </div>

          <!-- Avatar Theme Swatches -->
          <div class="space-y-2">
            <span class="block text-xs font-medium text-slate-300">Warna Tema Avatar</span>
            <div class="flex flex-wrap gap-2.5">
              <button
                v-for="theme in AVATAR_THEMES"
                :key="theme.key"
                type="button"
                class="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition active:scale-95"
                :class="
                  avatarTheme === theme.key
                    ? 'border-white/40 bg-white/10 text-white'
                    : 'border-vault-border bg-vault-bg text-slate-400 hover:border-white/20 hover:text-slate-200'
                "
                @click="avatarTheme = theme.key"
              >
                <span class="flex h-4 w-4 items-center justify-center rounded-full" :class="theme.swatch">
                  <Check v-if="avatarTheme === theme.key" class="h-2.5 w-2.5 text-slate-950" />
                </span>
                <span>{{ theme.label }}</span>
              </button>
            </div>
          </div>

          <div class="space-y-1.5">
            <label for="profile-avatar-url" class="block text-xs font-medium text-slate-300">
              URL Foto Avatar (Opsional)
            </label>
            <input
              id="profile-avatar-url"
              v-model="avatarUrl"
              type="url"
              placeholder="https://example.com/avatar.jpg"
              class="w-full rounded-xl border border-vault-border bg-vault-bg px-3.5 py-2.5 text-sm text-white placeholder-slate-500 transition focus:border-violet-500 focus:outline-none"
            />
            <p class="text-[11px] text-slate-500">
              Kosongkan jika ingin memakai avatar inisial dengan warna tema di atas.
            </p>
          </div>

          <div class="space-y-1.5">
            <label for="profile-bio" class="block text-xs font-medium text-slate-300">
              Bio / Catatan Target Finansial
            </label>
            <textarea
              id="profile-bio"
              v-model="bio"
              rows="3"
              maxlength="180"
              placeholder="Misal: Fokus membangun kas likuid 6 bulan & deposito berjangka."
              class="w-full rounded-xl border border-vault-border bg-vault-bg px-3.5 py-2.5 text-sm text-white placeholder-slate-500 transition focus:border-violet-500 focus:outline-none"
            />
          </div>

          <p
            v-if="profileError"
            class="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-300"
          >
            {{ profileError }}
          </p>

          <div class="flex justify-end pt-1">
            <button
              type="submit"
              :disabled="savingProfile"
              class="inline-flex w-full items-center justify-center gap-2 rounded-full bg-white px-5 py-2.5 text-xs font-bold text-slate-950 transition hover:bg-slate-200 active:scale-[0.98] disabled:opacity-50 sm:w-auto"
            >
              <Save class="h-3.5 w-3.5" />
              {{ savingProfile ? 'Menyimpan...' : 'Simpan Profil' }}
            </button>
          </div>
        </form>
      </section>

      <!-- Security / Password Update -->
      <section class="vault-bezel rounded-[28px] p-5 sm:p-6 lg:col-span-5">
        <div class="flex items-center gap-2 border-b border-white/[0.07] pb-4">
          <KeyRound class="h-4 w-4 text-amber-300" />
          <h2 class="text-sm font-bold text-white">Keamanan Password</h2>
        </div>

        <form class="mt-5 space-y-4" @submit.prevent="handleUpdatePassword">
          <div class="space-y-1.5">
            <label for="new-password" class="block text-xs font-medium text-slate-300">
              Password Baru
            </label>
            <input
              id="new-password"
              v-model="newPassword"
              type="password"
              minlength="6"
              autocomplete="new-password"
              placeholder="Minimal 6 karakter"
              class="w-full rounded-xl border border-vault-border bg-vault-bg px-3.5 py-2.5 text-sm text-white placeholder-slate-500 transition focus:border-amber-500 focus:outline-none"
            />
          </div>

          <div class="space-y-1.5">
            <label for="confirm-new-password" class="block text-xs font-medium text-slate-300">
              Konfirmasi Password Baru
            </label>
            <input
              id="confirm-new-password"
              v-model="confirmPassword"
              type="password"
              minlength="6"
              autocomplete="new-password"
              placeholder="Ulangi password baru"
              class="w-full rounded-xl border border-vault-border bg-vault-bg px-3.5 py-2.5 text-sm text-white placeholder-slate-500 transition focus:border-amber-500 focus:outline-none"
            />
          </div>

          <p
            v-if="passwordError"
            class="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-300"
          >
            {{ passwordError }}
          </p>

          <button
            type="submit"
            :disabled="savingPassword"
            class="inline-flex w-full items-center justify-center gap-2 rounded-full border border-amber-500/40 bg-amber-500/15 px-5 py-2.5 text-xs font-bold text-amber-200 transition hover:bg-amber-500/25 active:scale-[0.98] disabled:opacity-50"
          >
            <KeyRound class="h-3.5 w-3.5" />
            {{ savingPassword ? 'Memperbarui...' : 'Ubah Password' }}
          </button>
        </form>
      </section>
    </div>
  </div>
</template>
