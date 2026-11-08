<script setup>
import { ref } from 'vue'
import { Lock } from 'lucide-vue-next'
import { useRoute, useRouter } from 'vue-router'
import AuthLayout from '@/layouts/AuthLayout.vue'
import AppInput from '@/components/common/AppInput.vue'
import AppButton from '@/components/common/AppButton.vue'
import { authService } from '@/services/auth.service'
import { validatePassword } from '@/utils/validators'
import { errorMessage } from '@/utils/errors'
const route = useRoute()
const router = useRouter()
const newPassword = ref('')
const confirmPassword = ref('')
const error = ref('')
const loading = ref(false)
async function submit() {
  error.value = ''
  if (validatePassword(newPassword.value)) { error.value = validatePassword(newPassword.value); return }
  if (confirmPassword.value !== newPassword.value) { error.value = 'كلمتا المرور غير متطابقتين.'; return }
  loading.value = true
  try { await authService.resetPassword(route.params.token, { newPassword: newPassword.value, confirmPassword: confirmPassword.value }); router.replace({ name: 'login', query: { reset: '1' } }) }
  catch (e) { error.value = errorMessage(e) }
  finally { loading.value = false }
}
</script>
<template>
  <AuthLayout title="كلمة مرور جديدة" subtitle="اختر كلمة مرور قوية لحسابك" back="/login">
    <form class="space-y-4" @submit.prevent="submit">
      <p v-if="error" class="rounded-control bg-terracotta-soft px-4 py-3 text-sm text-terracotta" role="alert">{{ error }}</p>
      <AppInput v-model="newPassword" label="كلمة المرور الجديدة" type="password" :icon="Lock" autocomplete="new-password" />
      <AppInput v-model="confirmPassword" label="تأكيد كلمة المرور" type="password" :icon="Lock" autocomplete="new-password" />
      <AppButton type="submit" block :loading="loading">حفظ كلمة المرور</AppButton>
    </form>
  </AuthLayout>
</template>
