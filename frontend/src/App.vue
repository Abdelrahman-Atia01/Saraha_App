<script setup>
import ToastHost from '@/components/common/ToastHost.vue'
</script>

<template>
  <a href="#main" class="sr-only focus:not-sr-only focus:fixed focus:start-3 focus:top-3 focus:z-[70] focus:rounded-lg focus:bg-white focus:px-3 focus:py-2">تخطَّ إلى المحتوى</a>
  <RouterView />
  <ToastHost />
</template>
