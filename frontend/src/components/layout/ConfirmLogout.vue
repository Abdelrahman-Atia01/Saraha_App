<script setup>
import { LogOut } from 'lucide-vue-next'
import AppButton from '@/components/common/AppButton.vue'
defineProps({ open: Boolean })
defineEmits(['confirm', 'cancel'])
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="open" class="fixed inset-0 z-50 grid place-items-center bg-charcoal/55 p-5" @click.self="$emit('cancel')" @keydown.esc="$emit('cancel')">
        <div role="alertdialog" aria-modal="true" aria-labelledby="lo-title" class="w-full max-w-sm rounded-card bg-cream p-6 text-center shadow-xl">
          <span class="mx-auto grid size-14 place-items-center rounded-full bg-sand text-forest-800"><LogOut class="size-7" aria-hidden="true" /></span>
          <h2 id="lo-title" class="mt-4 text-lg font-extrabold">تسجيل الخروج</h2>
          <p class="mt-1 text-sm text-muted">هل تريد إنهاء الجلسة الحالية؟</p>
          <div class="mt-6 grid gap-2.5">
            <AppButton block @click="$emit('confirm')">تسجيل الخروج</AppButton>
            <AppButton variant="outline" block autofocus @click="$emit('cancel')">إلغاء</AppButton>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
