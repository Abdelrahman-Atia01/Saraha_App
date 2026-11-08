<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { Lock, Mail, MailCheck, Phone, User } from 'lucide-vue-next'
import AuthLayout from '@/layouts/AuthLayout.vue'
import AppInput from '@/components/common/AppInput.vue'
import AppButton from '@/components/common/AppButton.vue'
import { useForm } from '@/composables/useForm'
import { useAuthStore } from '@/stores/auth'
import { validateConfirm, validateEmail, validatePassword, validatePhone, validateUserName } from '@/utils/validators'
import { errorMessage } from '@/utils/errors'

const auth = useAuthStore()
const router = useRouter()
const serverError = ref('')
const registeredEmail = ref('')

const { values, errors, submitting, touch, onInput, submit } = useForm(
  { userName: '', email: '', phone: '', password: '', confirmPassword: '' },
  {
    userName: validateUserName,
    email: validateEmail,
    phone: validatePhone,
    password: validatePassword,
    confirmPassword: (v, all) => validateConfirm(all.password)(v),
  },
)

const onSubmit = () => submit(async (v) => {
  serverError.value = ''
  try {
    await auth.register({
      userName: v.userName.trim(),
      email: v.email.trim(),
      phone: v.phone.trim(),
      password: v.password,
      confirmPassword: v.confirmPassword,
    })
    registeredEmail.value = v.email.trim() // shown only because the backend returned the created user
  } catch (e) {
    serverError.value = errorMessage(e)
  }
})
</script>

<template>
  <AuthLayout v-if="registeredEmail" title="تحقق من بريدك" subtitle="تم إنشاء حسابك بنجاح" show-mark>
    <div class="rounded-card bg-cream p-6 text-center shadow-soft">
      <span class="mx-auto grid size-16 place-items-center rounded-full bg-forest-50 text-forest-800"><MailCheck class="size-8" aria-hidden="true" /></span>
      <p class="mt-4 text-[0.95rem] leading-relaxed">
        تم إنشاء الحساب. إذا كانت خدمة البريد مهيأة، فسيصلك رابط التفعيل إلى
        <strong class="block break-all" dir="ltr">{{ registeredEmail }}</strong>
        افتح الرسالة واضغط على الرابط لتفعيل حسابك.
      </p>
    </div>
    <AppButton class="mt-5" block @click="router.push({ name: 'login', query: { registered: 1, email: registeredEmail } })">الانتقال إلى تسجيل الدخول</AppButton>
  </AuthLayout>

  <AuthLayout v-else title="إنشاء حساب جديد" subtitle="انضم إلى صراحة الآن" back="/welcome">
    <form class="space-y-4" novalidate @submit.prevent="onSubmit">
      <p v-if="serverError" class="rounded-control bg-terracotta-soft px-4 py-3 text-sm font-medium text-terracotta" role="alert">{{ serverError }}</p>

      <AppInput v-model="values.userName" label="اسم المستخدم" :icon="User" autocomplete="username" :maxlength="20"
                :error="errors.userName" @update:model-value="onInput('userName')" @blur="touch('userName')" />
      <AppInput v-model="values.email" label="البريد الإلكتروني" type="email" :icon="Mail" autocomplete="email" inputmode="email"
                :error="errors.email" @update:model-value="onInput('email')" @blur="touch('email')" />
      <AppInput v-model="values.phone" label="رقم الهاتف" type="tel" :icon="Phone" autocomplete="tel" inputmode="tel"
                :error="errors.phone" @update:model-value="onInput('phone')" @blur="touch('phone')" />
      <AppInput v-model="values.password" label="كلمة المرور" type="password" :icon="Lock" autocomplete="new-password"
                hint="من 8 إلى 72 حرفًا"
                :error="errors.password" @update:model-value="onInput('password'); onInput('confirmPassword')" @blur="touch('password')" />
      <AppInput v-model="values.confirmPassword" label="تأكيد كلمة المرور" type="password" :icon="Lock" autocomplete="new-password"
                :error="errors.confirmPassword" @update:model-value="onInput('confirmPassword')" @blur="touch('confirmPassword')" />

      <AppButton type="submit" block :loading="submitting">إنشاء الحساب</AppButton>
    </form>

    <template #footer>
      لديك حساب بالفعل؟ <RouterLink to="/login" class="font-bold text-forest-800 underline-offset-4 hover:underline">تسجيل الدخول</RouterLink>
    </template>
  </AuthLayout>
</template>
