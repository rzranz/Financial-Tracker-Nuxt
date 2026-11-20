export type AvatarTheme = 'violet' | 'emerald' | 'amber' | 'sky' | 'rose'

export interface UserProfileMetadata {
  full_name?: string
  username?: string
  bio?: string
  avatar_url?: string
  avatar_theme?: AvatarTheme
}

export interface ProfileLikeUser {
  email?: string | null
  user_metadata?: Record<string, unknown> | null
}

export const AVATAR_THEMES: { key: AvatarTheme; label: string; gradient: string; swatch: string }[] = [
  {
    key: 'violet',
    label: 'Royal Violet',
    gradient: 'from-violet-600 via-violet-500 to-indigo-600 text-white',
    swatch: 'bg-violet-500'
  },
  {
    key: 'amber',
    label: 'Vault Gold',
    gradient: 'from-amber-400 via-amber-500 to-orange-500 text-slate-950',
    swatch: 'bg-amber-400'
  },
  {
    key: 'emerald',
    label: 'Liquid Emerald',
    gradient: 'from-emerald-500 via-emerald-400 to-teal-600 text-slate-950',
    swatch: 'bg-emerald-500'
  },
  {
    key: 'sky',
    label: 'Horizon Sky',
    gradient: 'from-sky-400 via-sky-500 to-blue-600 text-slate-950',
    swatch: 'bg-sky-400'
  },
  {
    key: 'rose',
    label: 'Crimson Rose',
    gradient: 'from-rose-500 via-pink-500 to-fuchsia-600 text-white',
    swatch: 'bg-rose-500'
  }
]

export function getUserProfileMeta(user: ProfileLikeUser | null | undefined): UserProfileMetadata {
  const meta = (user?.user_metadata || {}) as Record<string, unknown>
  const theme = typeof meta.avatar_theme === 'string' ? meta.avatar_theme : 'violet'
  const validTheme: AvatarTheme = AVATAR_THEMES.some((t) => t.key === theme)
    ? (theme as AvatarTheme)
    : 'violet'

  return {
    full_name: typeof meta.full_name === 'string' ? meta.full_name.trim() : '',
    username: typeof meta.username === 'string' ? meta.username.trim() : '',
    bio: typeof meta.bio === 'string' ? meta.bio.trim() : '',
    avatar_url: typeof meta.avatar_url === 'string' ? meta.avatar_url.trim() : '',
    avatar_theme: validTheme
  }
}

export function getUserDisplayName(user: ProfileLikeUser | null | undefined): string {
  const meta = getUserProfileMeta(user)
  if (meta.full_name) return meta.full_name
  if (meta.username) return meta.username

  const email = user?.email
  if (!email) return 'Investor'
  const local = email.split('@')[0] || 'Investor'
  return local.charAt(0).toUpperCase() + local.slice(1)
}

export function getUserInitials(user: ProfileLikeUser | null | undefined): string {
  const meta = getUserProfileMeta(user)
  const source = meta.full_name || meta.username || user?.email?.split('@')[0] || 'FV'
  const words = source.trim().split(/\s+/).filter(Boolean)
  if (words.length >= 2) {
    return `${words[0][0]}${words[1][0]}`.toUpperCase()
  }
  return source.slice(0, 2).toUpperCase()
}

export function getAvatarGradientClass(theme: AvatarTheme = 'violet'): string {
  return AVATAR_THEMES.find((t) => t.key === theme)?.gradient ?? AVATAR_THEMES[0].gradient
}
