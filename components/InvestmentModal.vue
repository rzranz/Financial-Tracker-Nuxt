<script setup lang="ts">
defineProps<{
  open: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()
</script>

<template>
  <BaseModal
    :open="open"
    title="Simulator & Kontrak Investasi Baru"
    subtitle="Estimasi return dihitung otomatis di level PostgreSQL Generated Column"
    max-width-class="max-w-xl"
    @close="emit('close')"
  >
    <ContractSimulatorForm @created="emit('close')" />
  </BaseModal>
</template>
