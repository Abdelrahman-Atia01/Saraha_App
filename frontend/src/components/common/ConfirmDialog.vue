<script setup>
import { nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { TriangleAlert } from 'lucide-vue-next'
import AppButton from './AppButton.vue'

const props = defineProps({
  open: Boolean,
  title: { type: String, required: true },
  description: { type: String, default: '' },
  confirmLabel: { type: String, default: 'تأكيد' },
  cancelLabel: { type: String, default: 'إلغاء' },
  loading: Boolean,
})
const emit = defineEmits(['confirm', 'cancel'])
const panel = ref(null)
let previouslyFocused = null

function onKey(e) {
  if (e.key === 'Escape' && !props.loading) emit('cancel')
  if (e.key === 'Tab' && panel.value) {
    const f = [...panel.value.querySelectorAll('button:not([disabled])')]
    if (!f.length) return
    const first = f[0], last = f[f.length - 1]
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
  }
}

watch(() => props.open, async (open) => {
  if (open) {
    previouslyFocused = document.activeElement
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    await nextTick()
    panel.value?.querySelector('[data-cancel]')?.focus()
  } else {
    document.removeEventListener('keydown', onKey)
    document.body.style.overflow = ''
    previouslyFocused?.focus?.()
  }
})
onBeforeUnmount(() => { document.removeEventListener('keydown', onKey); document.body.style.overflow = '' })
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="open" class="fixed inset-0 z-50 grid place-items-center bg-charcoal/55 p-5" @click.self="!loading && emit('cancel')">
        <Transition name="rise" appear>
          <div ref="panel" role="alertdialog" aria-modal="true" aria-labelledby="dlg-title" aria-describedby="dlg-desc"
               class="w-full max-w-sm rounded-card bg-cream p-6 text-center shadow-xl">
            <span class="mx-auto grid size-14 place-items-center rounded-full bg-terracotta-soft text-terracotta">
              <TriangleAlert class="size-7" aria-hidden="true" />
            </span>
            <h2 id="dlg-title" class="mt-4 text-lg font-extrabold">{{ title }}</h2>
            <p id="dlg-desc" class="mt-1 text-sm text-muted">{{ description }}</p>
            <div class="mt-6 grid gap-2.5">
              <AppButton variant="danger" block :loading="loading" @click="emit('confirm')">{{ confirmLabel }}</AppButton>
              <AppButton variant="outline" block :disabled="loading" data-cancel @click="emit('cancel')">{{ cancelLabel }}</AppButton>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>
