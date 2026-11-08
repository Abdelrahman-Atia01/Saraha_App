<script setup>
// Envelope + padlock mark (the "Saraha" identity from the design reference).
defineProps({ size: { type: Number, default: 72 }, tone: { type: String, default: 'light' } })
</script>

<template>
  <svg :width="size" :height="size" viewBox="0 0 96 96" fill="none" aria-hidden="true">
    <rect x="8" y="20" width="68" height="48" rx="9" :fill="tone === 'light' ? '#f6f1e7' : '#1f3a2e'" />
    <path d="M12 27l30 22 30-22" :stroke="tone === 'light' ? '#1f3a2e' : '#f6f1e7'" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" />
    <rect x="52" y="50" width="30" height="26" rx="7" :fill="tone === 'light' ? '#d9cfbb' : '#3f6652'" />
    <path d="M58 50v-5a9 9 0 0118 0v5" :stroke="tone === 'light' ? '#d9cfbb' : '#3f6652'" stroke-width="4" stroke-linecap="round" />
    <circle cx="67" cy="62" r="3.4" :fill="tone === 'light' ? '#1f3a2e' : '#f6f1e7'" />
  </svg>
</template>
