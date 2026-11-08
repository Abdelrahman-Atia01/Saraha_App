<script setup>
import { computed, onMounted, ref } from 'vue'
import { Camera, Mail, Pencil, Settings, User } from 'lucide-vue-next'
import PageBody from '@/components/common/PageBody.vue'
import UserAvatar from '@/components/common/UserAvatar.vue'
import AppButton from '@/components/common/AppButton.vue'
import AppInput from '@/components/common/AppInput.vue'
import StatTile from '@/components/profile/StatTile.vue'
import ShareLinkCard from '@/components/profile/ShareLinkCard.vue'
import ActivationBanner from '@/components/profile/ActivationBanner.vue'
import { useForm } from '@/composables/useForm'
import { useAuthStore } from '@/stores/auth'
import { useMessagesStore } from '@/stores/messages'
import { useToastStore } from '@/stores/toast'
import { validateEmail, validateUserName } from '@/utils/validators'
import { usersService } from '@/services/users.service'
import { formatDate, toArabicNumber } from '@/utils/format'
import { errorMessage } from '@/utils/errors'

const auth = useAuthStore()
const messages = useMessagesStore()
const toast = useToastStore()
const editing = ref(false)
const serverError = ref('')
const imageInput = ref(null)
const uploadingImage = ref(false)

const { values, errors, submitting, touch, onInput, submit } = useForm(
  { userName: '', email: '' },
  { userName: validateUserName, email: validateEmail },
)

const inbox = messages.inbox
const outbox = messages.outbox
const memberSince = computed(() => (auth.user?.createdAt ? formatDate(auth.user.createdAt) : '—'))

onMounted(() => {
  messages.load('inbox').catch(() => {})
  messages.load('outbox').catch(() => {})
})

async function onImageSelected(event) {
  const file = event.target.files?.[0]
  event.target.value = ''
  if (!file) return
  if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type) || file.size > 5 * 1024 * 1024) {
    toast.error('اختر صورة JPEG أو PNG أو WEBP أو GIF بحجم لا يتجاوز 5 ميجابايت.')
    return
  }
  uploadingImage.value = true
  try {
    await usersService.uploadImage(file)
    await auth.fetchUser()
    toast.success('تم تحديث الصورة الشخصية.')
  } catch (error) { toast.error(errorMessage(error)) }
  finally { uploadingImage.value = false }
}

function startEdit() {
  values.userName = auth.user.userName
  values.email = auth.user.email
  errors.userName = errors.email = serverError.value = ''
  editing.value = true
}

const onSave = () => submit(async (v) => {
  serverError.value = ''
  const next = { userName: v.userName.trim(), email: v.email.trim() }
  if (next.userName === auth.user.userName && next.email === auth.user.email) {
    editing.value = false
    return
  }
  try {
    await auth.updateProfile(next)
    toast.success('تم تحديث الملف الشخصي.')
    editing.value = false
  } catch (e) {
    serverError.value = errorMessage(e)
  }
})
</script>

<template>
  <header class="bg-forest-800 text-white lg:bg-transparent lg:text-charcoal">
    <div class="mx-auto max-w-2xl px-4 pb-14 pt-[max(1.25rem,env(safe-area-inset-top))] lg:max-w-3xl lg:px-8 lg:pb-2 lg:pt-8">
      <div class="flex items-center justify-between">
        <h1 class="text-xl font-extrabold lg:text-2xl">ملفي الشخصي</h1>
        <RouterLink to="/settings" class="grid size-10 place-items-center rounded-full bg-white/10 hover:bg-white/20 lg:bg-sand lg:hover:bg-sand-dark/60" aria-label="الإعدادات"><Settings class="size-5" /></RouterLink>
      </div>
      <div class="mt-5 flex flex-col items-center text-center lg:hidden">
        <UserAvatar :src="auth.user?.image" tone="dark" size="size-24" />
        <p class="mt-3 text-xl font-extrabold">{{ auth.user?.userName }}</p>
        <p class="text-sm text-white/70" dir="ltr">{{ auth.user?.email }}</p>
      </div>
    </div>
  </header>

  <PageBody>
    <div class="space-y-5">
      <div class="hidden items-center gap-4 rounded-card bg-cream p-5 shadow-soft lg:flex">
        <UserAvatar :src="auth.user?.image" size="size-20" />
        <div>
          <p class="text-xl font-extrabold">{{ auth.user?.userName }}</p>
          <p class="text-sm text-muted" dir="ltr">{{ auth.user?.email }}</p>
        </div>
      </div>

      <div class="flex flex-wrap items-center gap-3">
        <input ref="imageInput" type="file" accept="image/jpeg,image/png,image/webp,image/gif" class="sr-only" @change="onImageSelected" />
        <AppButton variant="soft" size="sm" :loading="uploadingImage" @click="imageInput?.click()"><Camera class="size-4" aria-hidden="true" />تغيير الصورة الشخصية</AppButton>
      </div>

      <ActivationBanner />

      <div class="grid grid-cols-3 gap-3">
        <StatTile :value="toArabicNumber(inbox.items.length)" label="رسالة واردة" :loading="inbox.loading && !inbox.loaded" />
        <StatTile :value="toArabicNumber(outbox.items.length)" label="رسالة صادرة" :loading="outbox.loading && !outbox.loaded" />
        <StatTile small :value="memberSince" label="تاريخ الانضمام" />
      </div>

      <form v-if="editing" class="space-y-4 rounded-card bg-cream p-5 shadow-soft" novalidate @submit.prevent="onSave">
        <h2 class="font-extrabold">تعديل الملف الشخصي</h2>
        <p v-if="serverError" class="rounded-control bg-terracotta-soft px-4 py-3 text-sm font-medium text-terracotta" role="alert">{{ serverError }}</p>
        <AppInput v-model="values.userName" label="اسم المستخدم" :icon="User" :maxlength="20" :error="errors.userName" @update:model-value="onInput('userName')" @blur="touch('userName')" />
        <AppInput v-model="values.email" label="البريد الإلكتروني" type="email" :icon="Mail" inputmode="email" :error="errors.email" @update:model-value="onInput('email')" @blur="touch('email')" />
        <div class="grid grid-cols-2 gap-3">
          <AppButton type="submit" :loading="submitting">حفظ</AppButton>
          <AppButton variant="outline" :disabled="submitting" @click="editing = false">إلغاء</AppButton>
        </div>
      </form>
      <AppButton v-else variant="soft" block @click="startEdit"><Pencil class="size-[18px]" aria-hidden="true" />تعديل الملف الشخصي</AppButton>

      <ShareLinkCard />
    </div>
  </PageBody>
</template>
