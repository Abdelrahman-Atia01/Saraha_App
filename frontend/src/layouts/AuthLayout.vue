<script setup>
import { ChevronRight } from 'lucide-vue-next'
import BrandMark from '@/components/common/BrandMark.vue'

defineProps({ title: String, subtitle: String, back: { type: [String, Object], default: null }, showMark: Boolean })
</script>

<template>
  <div class="min-h-dvh lg:grid lg:grid-cols-2">
    <!-- Desktop brand panel -->
    <aside class="relative hidden overflow-hidden bg-forest-800 text-white lg:flex lg:flex-col lg:items-center lg:justify-center lg:p-12">
      <svg class="absolute inset-x-0 bottom-0 w-full text-forest-700/70" viewBox="0 0 600 220" preserveAspectRatio="none" aria-hidden="true">
        <path fill="currentColor" d="M0 120C90 60 170 70 260 110s190 50 340-30V220H0z" />
      </svg>
      <BrandMark :size="120" />
      <p class="mt-6 text-6xl font-extrabold">صراحة</p>
      <p class="mt-3 text-lg text-white/75">قل ما تريد .. بكل خصوصية</p>
    </aside>

    <div class="flex min-h-dvh flex-col px-5 pb-8 pt-[max(1.25rem,env(safe-area-inset-top))] lg:items-center lg:justify-center lg:px-12">
      <div class="mx-auto flex w-full max-w-sm flex-1 flex-col lg:flex-none">
        <RouterLink v-if="back" :to="back" class="-ms-2 grid size-10 place-items-center rounded-full text-forest-800 hover:bg-sand" aria-label="رجوع">
          <ChevronRight class="size-6" />
        </RouterLink>
        <div v-else class="h-10" />

        <div class="mt-2 text-center sm:mt-6">
          <BrandMark v-if="showMark" :size="64" tone="dark" class="mx-auto mb-2" />
          <h1 class="text-[1.65rem] font-extrabold leading-tight">{{ title }}</h1>
          <p v-if="subtitle" class="mt-1.5 text-muted">{{ subtitle }}</p>
        </div>

        <div class="mt-8"><slot /></div>
        <div class="mt-auto pt-8 text-center text-sm text-muted lg:mt-6 lg:pt-0"><slot name="footer" /></div>
      </div>
    </div>
  </div>
</template>
