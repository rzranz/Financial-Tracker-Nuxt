<script setup lang="ts">
import { X } from 'lucide-vue-next'

const props = withDefaults(
  defineProps<{
    open: boolean
    title: string
    subtitle?: string
    maxWidthClass?: string
  }>(),
  {
    subtitle: undefined,
    maxWidthClass: 'max-w-lg'
  }
)

const emit = defineEmits<{
  (e: 'close'): void
}>()

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape' && props.open) {
    emit('close')
  }
}

onMounted(() => {
  window.addEventListener('keydown', onKeydown)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeydown)
})
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="open"
        role="dialog"
        aria-modal="true"
        :aria-label="title"
        class="fixed inset-0 z-[60] flex items-end justify-center bg-black/75 p-0 backdrop-blur-sm sm:items-center sm:p-4"
        @click.self="emit('close')"
      >
        <div
          class="modal-panel-emerge max-h-[92dvh] w-full overflow-y-auto rounded-t-2xl border border-vault-border bg-vault-surface p-5 shadow-2xl sm:rounded-2xl sm:p-6"
          :class="maxWidthClass"
        >
          <div class="flex items-start justify-between gap-3 border-b border-vault-border pb-4">
            <div class="min-w-0">
              <slot name="header">
                <h2 class="text-base font-bold text-white">{{ title }}</h2>
                <p v-if="subtitle" class="mt-0.5 text-xs text-slate-400">
                  {{ subtitle }}
                </p>
              </slot>
            </div>
            <button
              type="button"
              class="shrink-0 rounded-lg p-1.5 text-slate-400 transition duration-200 hover:rotate-90 hover:bg-slate-800 hover:text-white active:scale-95"
              aria-label="Tutup modal"
              @click="emit('close')"
            >
              <X class="h-4 w-4" />
            </button>
          </div>

          <div class="mt-5">
            <slot />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-panel-emerge {
  animation: modal-shape-emerge 280ms cubic-bezier(0.32, 0.72, 0, 1);
}

@keyframes modal-shape-emerge {
  0% {
    opacity: 0;
    transform: translateY(14px) scale(0.97);
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@media (prefers-reduced-motion: reduce) {
  .modal-panel-emerge {
    animation: none;
  }
}
</style>
