<script setup>
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Lock, Mail } from 'lucide-vue-next'
import AuthLayout from '@/layouts/AuthLayout.vue'
import AppInput from '@/components/common/AppInput.vue'
import AppButton from '@/components/common/AppButton.vue'
import { useForm } from '@/composables/useForm'
import { useAuthStore } from '@/stores/auth'
import { useToastStore } from '@/stores/toast'
import { safeRedirect } from '@/router'
import { validateEmail, validatePassword } from '@/utils/validators'
import { errorMessage } from '@/utils/errors'

const auth = useAuthStore()
const router = useRouter()
const route = useRoute()
const toast = useToastStore()
const serverError = ref('')

const { values, errors, submitting, touch, onInput, submit } = useForm(
  { email: String(route.query.email || ''), password: '' },
  { email: validateEmail, password: validatePassword },
)

const onSubmit = () => submit(async (v) => {
  serverError.value = ''
  try {
    await auth.login({ email: v.email.trim(), password: v.password })
    toast.success('أهلًا بعودتك!')
    router.replace(safeRedirect(route.query.redirect))
  } catch (e) {
    serverError.value = errorMessage(e)
  }
})
</script>

<template>
  <AuthLayout title="مرحبًا بك مجددًا" subtitle="سجّل دخولك للمتابعة" back="/welcome">
    <form class="space-y-4" novalidate @submit.prevent="onSubmit">
      <p v-if="route.query.registered" class="rounded-control bg-forest-50 px-4 py-3 text-sm text-forest-800" role="status">
        تم إنشاء حسابك. سجّل الدخول للمتابعة.
      </p>
      <p v-if="serverError" class="rounded-control bg-terracotta-soft px-4 py-3 text-sm font-medium text-terracotta" role="alert">{{ serverError }}</p>

      <AppInput v-model="values.email" label="البريد الإلكتروني" type="email" :icon="Mail" autocomplete="email" inputmode="email"
                :error="errors.email" @update:model-value="onInput('email')" @blur="touch('email')" />
      <AppInput v-model="values.password" label="كلمة المرور" type="password" :icon="Lock" autocomplete="current-password"
                :error="errors.password" @update:model-value="onInput('password')" @blur="touch('password')" />

      <div class="flex justify-end"><RouterLink to="/forgot-password" class="text-sm font-semibold text-forest-800 hover:underline">نسيت كلمة المرور؟</RouterLink></div>
      <p v-if="route.query.reset" class="rounded-control bg-forest-50 px-4 py-3 text-sm text-forest-800" role="status">تم تغيير كلمة المرور. يمكنك تسجيل الدخول الآن.</p>
      <AppButton type="submit" block :loading="submitting">تسجيل الدخول</AppButton>
    </form>

    <div class="my-5 flex items-center gap-3 text-sm text-muted"><span class="h-px flex-1 bg-sand-dark" />أو<span class="h-px flex-1 bg-sand-dark" /></div>
    <AppButton to="/register" variant="outline" block>إنشاء حساب جديد</AppButton>
  </AuthLayout>
</template>
