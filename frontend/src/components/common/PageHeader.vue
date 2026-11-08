<script setup>
import { ChevronRight } from 'lucide-vue-next'
import { useRouter } from 'vue-router'

const props = defineProps({
  title: { type: String, required: true },
  back: { type: [Boolean, String, Object], default: false }, // true = history back, or a route
  subtitle: { type: String, default: '' },
})
const router = useRouter()
function goBack() {
  if (typeof props.back === 'boolean') {
    if (window.history.state?.back) router.back()
    else router.push('/')
  } else router.push(props.back)
}
</script>

<template>
  <!-- Mobile/tablet: forest header with rounded bottom (matches the reference). Desktop: plain page title. -->
  <header class="bg-forest-800 text-white lg:bg-transparent lg:text-charcoal">
    <div class="mx-auto flex max-w-2xl items-center gap-3 px-4 pb-10 pt-[max(1.25rem,env(safe-area-inset-top))] lg:max-w-3xl lg:px-8 lg:pb-2 lg:pt-8">
      <button
        v-if="back"
        type="button"
        class="grid size-10 shrink-0 place-items-center rounded-full bg-white/10 transition hover:bg-white/20 lg:bg-sand lg:hover:bg-sand-dark/60"
        aria-label="رجوع"
        @click="goBack"
      >
        <ChevronRight class="size-5" />
      </button>
      <div class="min-w-0 flex-1">
        <h1 class="truncate text-xl font-extrabold lg:text-2xl">{{ title }}</h1>
        <p v-if="subtitle" class="truncate text-sm text-white/70 lg:text-muted">{{ subtitle }}</p>
      </div>
      <div class="flex items-center gap-1"><slot name="actions" /></div>
    </div>
  </header>
</template>
