<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { BadgeCheck, KeyRound, LogOut, MailWarning } from 'lucide-vue-next'
import PageHeader from '@/components/common/PageHeader.vue'
import PageBody from '@/components/common/PageBody.vue'
import AppInput from '@/components/common/AppInput.vue'
import AppButton from '@/components/common/AppButton.vue'
import ConfirmLogout from '@/components/layout/ConfirmLogout.vue'
import { useForm } from '@/composables/useForm'
import { useLogout } from '@/composables/useLogout'
import { useAuthStore } from '@/stores/auth'
import { useToastStore } from '@/stores/toast'
import { required, validateConfirm, validatePassword } from '@/utils/validators'
import { errorMessage } from '@/utils/errors'
import { formatDate } from '@/utils/format'

const auth = useAuthStore()
const router = useRouter()
const toast = useToastStore()
const { confirming, logout } = useLogout()
const serverError = ref('')

const { values, errors, submitting, touch, onInput, submit } = useForm(
  { currentPassword: '', newPassword: '', confirmPassword: '' },
  {
    currentPassword: required('كلمة المرور الحالية'),
    newPassword: (v, all) => validatePassword(v) || (v === all.currentPassword ? 'كلمة المرور الجديدة يجب أن تختلف عن الحالية' : ''),
    confirmPassword: (v, all) => validateConfirm(all.newPassword)(v),
  },
)

const onChangePassword = () => submit(async (v) => {
  serverError.value = ''
  try {
    await auth.changePassword(v)
    auth.logout()
    toast.success('تم تغيير كلمة المرور. سجّل الدخول بكلمة المرور الجديدة.')
    router.replace({ name: 'login', query: { reset: '1' } })
    values.currentPassword = values.newPassword = values.confirmPassword = ''
    for (const k of Object.keys(errors)) errors[k] = ''
  } catch (e) {
    serverError.value = errorMessage(e)
  }
})
</script>

<template>
  <PageHeader title="الإعدادات" back="/profile" />

  <PageBody>
    <div class="space-y-5">
      <section class="rounded-card bg-cream p-5 shadow-soft" aria-labelledby="acc-title">
        <h2 id="acc-title" class="font-extrabold">معلومات الحساب</h2>
        <dl class="mt-3 divide-y divide-sand/80 text-sm">
          <div class="flex items-center justify-between gap-4 py-3"><dt class="text-muted">اسم المستخدم</dt><dd class="font-semibold">{{ auth.user?.userName }}</dd></div>
          <div class="flex items-center justify-between gap-4 py-3"><dt class="text-muted">البريد الإلكتروني</dt><dd class="truncate font-semibold" dir="ltr">{{ auth.user?.email }}</dd></div>
          <div class="flex items-center justify-between gap-4 py-3"><dt class="text-muted">رقم الهاتف</dt><dd class="font-semibold" dir="ltr">{{ auth.user?.phone }}</dd></div>
          <div class="flex items-center justify-between gap-4 py-3">
            <dt class="text-muted">حالة التفعيل</dt>
            <dd class="flex items-center gap-1.5 font-semibold" :class="auth.isActivated ? 'text-forest-600' : 'text-terracotta'">
              <component :is="auth.isActivated ? BadgeCheck : MailWarning" class="size-4" aria-hidden="true" />{{ auth.isActivated ? 'مفعّل' : 'غير مفعّل' }}
            </dd>
          </div>
          <div class="flex items-center justify-between gap-4 py-3"><dt class="text-muted">تاريخ الانضمام</dt><dd class="font-semibold">{{ formatDate(auth.user?.createdAt) }}</dd></div>
        </dl>
        <p class="mt-1 text-xs text-muted">لتعديل الاسم أو البريد، استخدم صفحة <RouterLink to="/profile" class="font-bold text-forest-600 hover:underline">الملف الشخصي</RouterLink>.</p>
      </section>

      <form class="space-y-4 rounded-card bg-cream p-5 shadow-soft" novalidate aria-labelledby="pwd-title" @submit.prevent="onChangePassword">
        <h2 id="pwd-title" class="font-extrabold">تغيير كلمة المرور</h2>
        <p v-if="serverError" class="rounded-control bg-terracotta-soft px-4 py-3 text-sm font-medium text-terracotta" role="alert">{{ serverError }}</p>
        <AppInput v-model="values.currentPassword" label="كلمة المرور الحالية" type="password" :icon="KeyRound" autocomplete="current-password" :error="errors.currentPassword" @update:model-value="onInput('currentPassword')" @blur="touch('currentPassword')" />
        <AppInput v-model="values.newPassword" label="كلمة المرور الجديدة" type="password" :icon="KeyRound" autocomplete="new-password" hint="من 8 إلى 72 حرفًا" :error="errors.newPassword" @update:model-value="onInput('newPassword'); onInput('confirmPassword')" @blur="touch('newPassword')" />
        <AppInput v-model="values.confirmPassword" label="تأكيد كلمة المرور الجديدة" type="password" :icon="KeyRound" autocomplete="new-password" :error="errors.confirmPassword" @update:model-value="onInput('confirmPassword')" @blur="touch('confirmPassword')" />
        <AppButton type="submit" block :loading="submitting">تغيير كلمة المرور</AppButton>
      </form>

      <AppButton variant="dangerSoft" block @click="confirming = true"><LogOut class="size-5" aria-hidden="true" />تسجيل الخروج</AppButton>
    </div>
    <ConfirmLogout :open="confirming" @confirm="logout" @cancel="confirming = false" />
  </PageBody>
</template>
