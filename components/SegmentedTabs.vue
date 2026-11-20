<script setup lang="ts" generic="T extends string">
export interface SegmentedTabItem<K extends string = string> {
  key: K
  label: string
}

const props = withDefaults(
  defineProps<{
    modelValue: T
    items: SegmentedTabItem<T>[]
    tone?: 'emerald' | 'amber'
    fullWidth?: boolean
  }>(),
  {
    tone: 'emerald',
    fullWidth: false
  }
)

const emit = defineEmits<{
  (e: 'update:modelValue', value: T): void
}>()

const containerRef = ref<HTMLElement | null>(null)
const itemRefs = ref<Record<string, HTMLElement | null>>({})
const indicator = ref({ left: 0, top: 0, width: 0, height: 0, ready: false })

function setItemRef(key: string, el: Element | ComponentPublicInstance | null) {
  itemRefs.value[key] = el instanceof HTMLElement ? el : null
}

function measureIndicator() {
  const container = containerRef.value
  const activeEl = itemRefs.value[props.modelValue]
  if (!container || !activeEl) return

  indicator.value = {
    left: activeEl.offsetLeft,
    top: activeEl.offsetTop,
    width: activeEl.offsetWidth,
    height: activeEl.offsetHeight,
    ready: true
  }
}

watch(
  () => [props.modelValue, props.items.length],
  async () => {
    await nextTick()
    measureIndicator()
  },
  { immediate: true }
)

let resizeObserver: ResizeObserver | null = null

onMounted(() => {
  measureIndicator()
  if (containerRef.value && typeof ResizeObserver !== 'undefined') {
    resizeObserver = new ResizeObserver(() => measureIndicator())
    resizeObserver.observe(containerRef.value)
  }
})

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
})

const pillToneClass = computed(() =>
  props.tone === 'amber'
    ? 'border-amber-500/40 bg-amber-500/15 shadow-[0_0_20px_-6px_rgba(245,158,11,0.45)]'
    : 'border-emerald-500/40 bg-emerald-500/15 shadow-[0_0_20px_-6px_rgba(16,185,129,0.45)]'
)

const activeTextClass = computed(() =>
  props.tone === 'amber' ? 'text-amber-300' : 'text-emerald-300'
)
</script>

<template>
  <div
    ref="containerRef"
    class="relative flex flex-wrap gap-1 rounded-xl border border-vault-border bg-vault-bg p-1"
    :class="fullWidth ? 'w-full' : 'w-fit max-w-full'"
    role="tablist"
  >
    <!-- Sliding / Morphing Active Background Shape -->
    <span
      v-if="indicator.ready"
      aria-hidden="true"
      class="pointer-events-none absolute left-0 top-0 rounded-lg border transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]"
      :class="pillToneClass"
      :style="{
        width: `${indicator.width}px`,
        height: `${indicator.height}px`,
        transform: `translate3d(${indicator.left}px, ${indicator.top}px, 0)`
      }"
    />

    <button
      v-for="item in items"
      :key="item.key"
      :ref="(el) => setItemRef(item.key, el)"
      type="button"
      role="tab"
      :aria-selected="modelValue === item.key"
      class="relative z-10 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors duration-200 active:scale-[0.98]"
      :class="[
        fullWidth ? 'flex-1 text-center' : '',
        modelValue === item.key ? activeTextClass : 'text-slate-400 hover:text-slate-200'
      ]"
      @click="emit('update:modelValue', item.key)"
    >
      {{ item.label }}
    </button>
  </div>
</template>
