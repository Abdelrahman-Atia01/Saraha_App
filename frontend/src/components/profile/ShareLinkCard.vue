<script setup>
import { computed } from 'vue'
import { Copy, Link2 } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'
import { useCopy } from '@/composables/useCopy'

const auth = useAuthStore()
const copy = useCopy()
const link = computed(() => `${window.location.origin}/send/${auth.user?._id}`)
</script>

<template>
  <section class="rounded-card bg-cream p-4 shadow-soft" aria-labelledby="share-title">
    <div class="flex items-center gap-2 text-forest-800">
      <Link2 class="size-5" aria-hidden="true" />
      <h2 id="share-title" class="font-extrabold">رابط استقبال الرسائل</h2>
    </div>
    <p class="mt-1 text-sm text-muted">شاركه مع أصدقائك ليرسلوا لك رسائل. يحتاج المرسل إلى حساب.</p>
    <div class="mt-3 flex items-center gap-2 rounded-control bg-sand p-1.5 ps-3">
      <span class="min-w-0 flex-1 truncate text-xs text-charcoal/80" dir="ltr">{{ link }}</span>
      <button type="button" class="grid size-10 shrink-0 place-items-center rounded-xl bg-forest-800 text-white transition hover:bg-forest-700" aria-label="نسخ الرابط" @click="copy(link, 'تم نسخ الرابط')">
        <Copy class="size-[18px]" />
      </button>
    </div>
  </section>
</template>
