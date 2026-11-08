<script setup>
import { CircleAlert, RefreshCw } from 'lucide-vue-next'
import EmptyState from '@/components/common/EmptyState.vue'
import AppButton from '@/components/common/AppButton.vue'
defineProps({ error: { type: Object, required: true } })
defineEmits(['retry'])
</script>

<template>
  <EmptyState :icon="CircleAlert" tone="error" title="تعذّر تحميل الرسائل" :description="error.message">
    <AppButton variant="outline" size="sm" @click="$emit('retry')"><RefreshCw class="size-4" aria-hidden="true" />إعادة المحاولة</AppButton>
  </EmptyState>
</template>
