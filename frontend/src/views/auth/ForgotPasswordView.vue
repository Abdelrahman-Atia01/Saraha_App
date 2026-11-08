<script setup>
import { ref } from 'vue'
import { Mail } from 'lucide-vue-next'
import AuthLayout from '@/layouts/AuthLayout.vue'
import AppInput from '@/components/common/AppInput.vue'
import AppButton from '@/components/common/AppButton.vue'
import { authService } from '@/services/auth.service'
import { validateEmail } from '@/utils/validators'
import { errorMessage } from '@/utils/errors'
const email = ref('')
const error = ref('')
const success = ref('')
const loading = ref(false)
async function submit() {
  error.value = success.value = ''
  const invalid = validateEmail(email.value)
  if (invalid) { error.value = invalid; return }
  loading.value = true
  try { success.value = await authService.forgotPassword(email.value.trim()) }
  catch (e) { error.value = errorMessage(e) }
  finally { loading.value = false }
}
</script>
<template>
  <AuthLayout title="استعادة كلمة المرور" subtitle="أدخل بريدك الإلكتروني لإرسال رابط الاستعادة" back="/login">
    <form class="space-y-4" @submit.prevent="submit">
      <p v-if="error" class="rounded-control bg-terracotta-soft px-4 py-3 text-sm text-terracotta" role="alert">{{ error }}</p>
      <p v-if="success" class="rounded-control bg-forest-50 px-4 py-3 text-sm text-forest-800" role="status">{{ success }}</p>
      <AppInput v-model="email" label="البريد الإلكتروني" type="email" :icon="Mail" autocomplete="email" :error="error && !success ? error : ''" />
      <AppButton type="submit" block :loading="loading">إرسال رابط الاستعادة</AppButton>
    </form>
  </AuthLayout>
</template>
