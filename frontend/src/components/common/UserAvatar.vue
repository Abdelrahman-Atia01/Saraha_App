<script setup>
import { UserRound } from 'lucide-vue-next'
defineProps({
  size: { type: String, default: 'size-11' },
  tone: { type: String, default: 'sand' },
  src: { type: String, default: '' },
})
</script>

<template>
  <span class="grid shrink-0 place-items-center overflow-hidden rounded-full" :class="[size, tone === 'sand' ? 'bg-sand-dark/70 text-forest-800' : 'bg-white/15 text-white']" aria-hidden="true">
    <img v-if="src" :src="src" alt="" class="size-full object-cover" loading="lazy" @error="$event.target.style.display = 'none'" />
    <UserRound v-else class="size-[55%]" />
  </span>
</template>
