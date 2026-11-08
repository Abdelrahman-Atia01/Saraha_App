<script setup>
import { CircleAlert, CircleCheck, Info, X } from 'lucide-vue-next'
import { useToastStore } from '@/stores/toast'

const toast = useToastStore()
const icons = { success: CircleCheck, error: CircleAlert, info: Info }
const tones = {
  success: 'bg-forest-800 text-white',
  error: 'bg-terracotta text-white',
  info: 'bg-charcoal text-white',
}
</script>

<template>
  <div class="pointer-events-none fixed inset-x-0 top-0 z-[60] flex flex-col items-center gap-2 px-4 pt-4" aria-live="polite">
    <TransitionGroup name="rise">
      <div
        v-for="t in toast.toasts"
        :key="t.id"
        class="pointer-events-auto flex w-full max-w-md items-start gap-3 rounded-2xl px-4 py-3 text-sm font-medium shadow-lg"
        :class="tones[t.type]"
        :role="t.type === 'error' ? 'alert' : 'status'"
      >
        <component :is="icons[t.type]" class="mt-0.5 size-5 shrink-0" aria-hidden="true" />
        <p class="flex-1 leading-relaxed">{{ t.message }}</p>
        <button type="button" class="-m-1 rounded-lg p-1 opacity-80 hover:opacity-100" aria-label="إغلاق" @click="toast.dismiss(t.id)">
          <X class="size-4" />
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>
