<script setup>
import { computed } from 'vue'
import { LoaderCircle } from 'lucide-vue-next'

const props = defineProps({
  variant: { type: String, default: 'primary' }, // primary | outline | soft | danger | dangerSoft | ghost | onDark
  type: { type: String, default: 'button' },
  loading: Boolean,
  disabled: Boolean,
  block: Boolean,
  size: { type: String, default: 'md' }, // md | sm
  to: { type: [String, Object], default: null },
})

const classes = computed(() => [
  'inline-flex items-center justify-center gap-2 rounded-control font-bold transition select-none',
  'disabled:opacity-60 active:scale-[.98] motion-reduce:active:scale-100',
  props.size === 'sm' ? 'h-10 px-4 text-sm' : 'h-12 px-5 text-[0.95rem]',
  props.block ? 'w-full' : '',
  {
    primary: 'bg-forest-800 text-white hover:bg-forest-700 disabled:hover:bg-forest-800',
    outline: 'border border-forest-800 text-forest-800 bg-transparent hover:bg-forest-50',
    soft: 'bg-sand text-charcoal hover:bg-sand-dark/70',
    danger: 'bg-terracotta text-white hover:bg-terracotta-dark',
    dangerSoft: 'bg-terracotta-soft text-terracotta hover:bg-[#efcec6]',
    ghost: 'text-forest-800 hover:bg-forest-50',
    onDark: 'bg-ivory text-forest-800 hover:bg-white',
  }[props.variant],
])
</script>

<template>
  <RouterLink v-if="to" :to="to" :class="classes"><slot /></RouterLink>
  <button v-else :type="type" :class="classes" :disabled="disabled || loading" :aria-busy="loading || undefined">
    <LoaderCircle v-if="loading" class="size-5 animate-spin" aria-hidden="true" />
    <slot />
  </button>
</template>
