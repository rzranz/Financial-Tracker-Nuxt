<script setup lang="ts">
import { X } from 'lucide-vue-next'

defineProps<{
  open: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()
</script>

<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
      @click.self="emit('close')"
    >
      <div
        class="max-h-[90dvh] w-full max-w-xl overflow-y-auto rounded-2xl border border-vault-border bg-vault-surface p-6 shadow-2xl"
      >
        <div class="mb-5 flex items-center justify-between border-b border-vault-border pb-4">
          <div>
            <h2 class="text-base font-bold text-white">Simulator &amp; Kontrak Investasi Baru</h2>
            <p class="mt-0.5 text-xs text-slate-400">
              Estimasi return dihitung otomatis di level PostgreSQL Generated Column
            </p>
          </div>
          <button
            type="button"
            class="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-800 hover:text-white"
            aria-label="Tutup modal"
            @click="emit('close')"
          >
            <X class="h-4 w-4" />
          </button>
        </div>

        <ContractSimulatorForm @created="emit('close')" />
      </div>
    </div>
  </Teleport>
</template>
