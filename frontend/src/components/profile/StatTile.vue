<script setup>
defineProps({ value: { type: [String, Number], required: true }, label: { type: String, required: true }, loading: Boolean, small: Boolean })
</script>

<template>
  <div class="rounded-2xl bg-cream px-3 py-3.5 text-center shadow-soft">
    <div v-if="loading" class="skeleton mx-auto h-7 w-10 rounded" />
    <p v-else class="font-extrabold leading-none text-forest-800" :class="small ? 'py-1 text-sm leading-snug' : 'text-2xl'">{{ value }}</p>
    <p class="mt-1.5 text-xs text-muted">{{ label }}</p>
  </div>
</template>
