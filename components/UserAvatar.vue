<script setup lang="ts">
import type { AvatarTheme, ProfileLikeUser } from '~/utils/profile'
import { getAvatarGradientClass, getUserInitials, getUserProfileMeta } from '~/utils/profile'

const props = withDefaults(
  defineProps<{
    user?: ProfileLikeUser | null
    size?: 'sm' | 'md' | 'lg'
    overrideAvatarUrl?: string
    overrideTheme?: AvatarTheme
    overrideName?: string
  }>(),
  {
    user: null,
    size: 'md',
    overrideAvatarUrl: undefined,
    overrideTheme: undefined,
    overrideName: undefined
  }
)

const imgBroken = ref(false)

const meta = computed(() => getUserProfileMeta(props.user))
const avatarUrl = computed(() =>
  props.overrideAvatarUrl !== undefined ? props.overrideAvatarUrl.trim() : meta.value.avatar_url || ''
)
const theme = computed(() => props.overrideTheme ?? meta.value.avatar_theme ?? 'violet')

watch(avatarUrl, () => {
  imgBroken.value = false
})

const initials = computed(() => {
  if (props.overrideName?.trim()) {
    return getUserInitials({ user_metadata: { full_name: props.overrideName } })
  }
  return getUserInitials(props.user)
})

const sizeClass = computed(() => {
  switch (props.size) {
    case 'sm':
      return 'h-8 w-8 text-[11px]'
    case 'lg':
      return 'h-16 w-16 text-lg'
    default:
      return 'h-10 w-10 text-xs'
  }
})
</script>

<template>
  <div
    class="relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/15 bg-gradient-to-br font-mono font-bold shadow-sm"
    :class="[sizeClass, getAvatarGradientClass(theme)]"
  >
    <img
      v-if="avatarUrl && !imgBroken"
      :src="avatarUrl"
      alt="Avatar profil"
      class="h-full w-full object-cover"
      @error="imgBroken = true"
    />
    <span v-else>{{ initials }}</span>
  </div>
</template>
