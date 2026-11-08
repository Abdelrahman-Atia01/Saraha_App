<script setup>
import BrandMark from '@/components/common/BrandMark.vue'
import AppButton from '@/components/common/AppButton.vue'
</script>

<template>
  <div class="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-forest-800 px-6 text-center text-white">
    <svg class="absolute inset-x-0 bottom-0 w-full text-forest-700/70" viewBox="0 0 600 240" preserveAspectRatio="none" aria-hidden="true">
      <path fill="currentColor" d="M0 130C100 60 180 80 270 120s200 50 330-40V240H0z" />
    </svg>
    <svg class="absolute inset-x-0 top-0 w-full text-forest-700/40" viewBox="0 0 600 200" preserveAspectRatio="none" aria-hidden="true">
      <path fill="currentColor" d="M0 0h600v70C480 130 380 40 260 70S90 110 0 60z" />
    </svg>

    <main id="main" class="relative z-10 flex w-full max-w-sm flex-col items-center">
      <BrandMark :size="112" />
      <h1 class="mt-6 text-6xl font-extrabold">صراحة</h1>
      <p class="mt-3 text-lg text-white/80">قل ما تريد .. بكل خصوصية</p>
      <p class="mt-5 max-w-xs text-[0.95rem] leading-relaxed text-white/65">
        مساحة آمنة تستقبل فيها رسائل صادقة من أصدقائك دون أن تُكشف هويتهم.
      </p>

      <div class="mt-10 grid w-full gap-3">
        <AppButton to="/register" variant="onDark" block>ابدأ الآن</AppButton>
        <AppButton to="/login" variant="outline" block class="!border-white/70 !text-white hover:!bg-white/10">تسجيل الدخول</AppButton>
      </div>
    </main>
  </div>
</template>
