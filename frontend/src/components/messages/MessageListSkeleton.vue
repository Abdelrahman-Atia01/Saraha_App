<script setup>
defineProps({ rows: { type: Number, default: 5 } })
</script>

<template>
  <div class="space-y-1" role="status" aria-label="جارٍ التحميل">
    <div v-for="n in rows" :key="n" class="flex items-center gap-3.5 px-3 py-3.5">
      <div class="skeleton size-12 shrink-0 rounded-full" />
      <div class="flex-1 space-y-2">
        <div class="skeleton h-4 w-1/3 rounded" />
        <div class="skeleton h-3.5 w-4/5 rounded" />
      </div>
    </div>
  </div>
</template>
