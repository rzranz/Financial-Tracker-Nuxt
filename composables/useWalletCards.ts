import {
  type CardThemeKey,
  type StoredCustomCard,
  type WalletCardConfig,
  buildCustomWalletCard,
  getCustomCardsFromUser,
  mergeWalletCards
} from '~/utils/cards'

export function useWalletCards() {
  const supabase = useSupabaseClient()
  const user = useSupabaseUser()
  const { pushToast } = useToast()

  const customCards = computed<WalletCardConfig[]>(() => getCustomCardsFromUser(user.value))
  const allCards = computed<WalletCardConfig[]>(() => mergeWalletCards(customCards.value))

  function toStoredList(cards: WalletCardConfig[]): StoredCustomCard[] {
    return cards.map((card) => ({
      id: card.id,
      name: card.name,
      shortLabel: card.shortLabel,
      subtitle: card.subtitle,
      last4: card.maskedNumber.slice(-4),
      theme: card.theme ?? 'sapphire'
    }))
  }

  async function addCustomCard(payload: {
    name: string
    shortLabel?: string
    subtitle?: string
    last4?: string
    theme: CardThemeKey
  }): Promise<WalletCardConfig> {
    const uniqueSuffix = Date.now().toString(36).slice(-4)
    const slug =
      (payload.shortLabel || payload.name)
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '') || 'card'

    const newCard = buildCustomWalletCard({
      id: `custom-${slug}-${uniqueSuffix}`,
      name: payload.name,
      shortLabel: payload.shortLabel,
      subtitle: payload.subtitle,
      last4: payload.last4,
      theme: payload.theme
    })

    const nextStored = toStoredList([...customCards.value, newCard])
    const { data, error } = await supabase.auth.updateUser({
      data: {
        wallet_cards: nextStored
      }
    })

    if (error) {
      throw new Error(error.message)
    }

    if (data.user) {
      user.value = data.user
    }

    pushToast({
      title: 'Kartu Baru Ditambahkan',
      description: `${newCard.name} siap dipakai di tumpukan dompet.`,
      variant: 'success'
    })

    return newCard
  }

  async function removeCustomCard(cardId: string) {
    const nextStored = toStoredList(
      customCards.value.filter((c: WalletCardConfig) => c.id !== cardId)
    )
    const { data, error } = await supabase.auth.updateUser({
      data: {
        wallet_cards: nextStored
      }
    })

    if (error) {
      throw new Error(error.message)
    }

    if (data.user) {
      user.value = data.user
    }

    pushToast({
      title: 'Kartu Dihapus',
      description: 'Daftar rekening kustom telah diperbarui.',
      variant: 'info'
    })
  }

  return {
    customCards,
    allCards,
    addCustomCard,
    removeCustomCard
  }
}
