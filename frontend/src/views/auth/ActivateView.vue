<script setup>
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { CircleCheck, CircleX, LoaderCircle } from 'lucide-vue-next'
import AppButton from '@/components/common/AppButton.vue'
import { authService } from '@/services/auth.service'

const route = useRoute()
const state = ref('loading') // loading | success | failed
const reason = ref('')

onMounted(async () => {
  try {
    await authService.activate(route.params.token)
    state.value = 'success'
  } catch (e) {
    reason.value = e.message || ''
    state.value = 'failed'
  }
})
</script>

<template>
  <main id="main" class="grid min-h-dvh place-items-center bg-ivory px-5">
    <div class="w-full max-w-sm rounded-card bg-cream p-8 text-center shadow-soft">
      <template v-if="state === 'loading'">
        <LoaderCircle class="mx-auto size-12 animate-spin text-forest-600" aria-hidden="true" />
        <p class="mt-4 font-semibold" role="status">جارٍ تفعيل حسابك…</p>
      </template>
      <template v-else-if="state === 'success'">
        <span class="mx-auto grid size-16 place-items-center rounded-full bg-forest-800 text-white"><CircleCheck class="size-9" aria-hidden="true" /></span>
        <h1 class="mt-5 text-xl font-extrabold">تم تفعيل حسابك</h1>
        <p class="mt-1 text-sm text-muted">أكّد الخادم تفعيل بريدك الإلكتروني.</p>
        <AppButton to="/login" class="mt-6" block>تسجيل الدخول</AppButton>
      </template>
      <template v-else>
        <span class="mx-auto grid size-16 place-items-center rounded-full bg-terracotta-soft text-terracotta"><CircleX class="size-9" aria-hidden="true" /></span>
        <h1 class="mt-5 text-xl font-extrabold">تعذّر تفعيل الحساب</h1>
        <p class="mt-1 text-sm text-muted">{{ reason || 'رابط التفعيل غير صالح أو منتهي. سجّل الدخول وتأكد من حالة حسابك.' }}</p>
        <AppButton to="/login" variant="outline" class="mt-6" block>تسجيل الدخول</AppButton>
      </template>
    </div>
  </main>
</template>
