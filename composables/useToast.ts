export interface ToastMessage {
  id: string
  title: string
  description?: string
  variant: 'success' | 'error' | 'info'
}

export function useToast() {
  const toasts = useState<ToastMessage[]>('finvault-toasts', () => [])

  function pushToast(toast: Omit<ToastMessage, 'id'>) {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
    toasts.value.push({ ...toast, id })

    if (import.meta.client) {
      setTimeout(() => {
        dismissToast(id)
      }, 4500)
    }
  }

  function dismissToast(id: string) {
    toasts.value = toasts.value.filter((t) => t.id !== id)
  }

  return {
    toasts,
    pushToast,
    dismissToast
  }
}
