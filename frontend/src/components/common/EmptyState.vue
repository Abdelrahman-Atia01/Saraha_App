<script setup>
defineProps({
  icon: { type: [Object, Function], required: true },
  title: { type: String, required: true },
  description: { type: String, default: '' },
  tone: { type: String, default: 'neutral' }, // neutral | error
})
</script>

<template>
  <div class="flex flex-col items-center px-6 py-14 text-center">
    <span class="grid size-20 place-items-center rounded-full" :class="tone === 'error' ? 'bg-terracotta-soft text-terracotta' : 'bg-sand text-forest-600'">
      <component :is="icon" class="size-9" aria-hidden="true" />
    </span>
    <h2 class="mt-5 text-lg font-extrabold">{{ title }}</h2>
    <p v-if="description" class="mt-1.5 max-w-xs text-sm text-muted">{{ description }}</p>
    <div class="mt-6 flex flex-wrap justify-center gap-3"><slot /></div>
  </div>
</template>
