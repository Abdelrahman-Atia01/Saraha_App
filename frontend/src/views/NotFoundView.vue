<script setup>
import { SearchX } from 'lucide-vue-next'
import EmptyState from '@/components/common/EmptyState.vue'
import AppButton from '@/components/common/AppButton.vue'
</script>

<template>
  <main id="main" class="grid min-h-dvh place-items-center bg-ivory">
    <EmptyState :icon="SearchX" title="الصفحة غير موجودة" description="الرابط الذي فتحته غير صحيح أو لم يعد متاحًا.">
      <AppButton to="/">العودة للرئيسية</AppButton>
    </EmptyState>
  </main>
</template>
