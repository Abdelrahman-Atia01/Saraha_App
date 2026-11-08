<script setup>
import { MailWarning } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'
const auth = useAuthStore()
</script>

<template>
  <div v-if="auth.user && !auth.isActivated" class="flex items-start gap-3 rounded-2xl bg-sand px-4 py-3 text-sm" role="status">
    <MailWarning class="mt-0.5 size-5 shrink-0 text-terracotta" aria-hidden="true" />
    <p>حسابك غير مفعّل بعد. افتح رابط التفعيل المرسل إلى بريدك الإلكتروني.</p>
  </div>
</template>
