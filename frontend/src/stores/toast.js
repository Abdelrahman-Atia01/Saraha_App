import { defineStore } from 'pinia'
import { ref } from 'vue'

let seq = 0
export const useToastStore = defineStore('toast', () => {
  const toasts = ref([])

  function dismiss(id) {
    toasts.value = toasts.value.filter((t) => t.id !== id)
  }
  function push(type, message, duration = 4500) {
    const id = ++seq
    toasts.value.push({ id, type, message })
    if (duration) setTimeout(() => dismiss(id), duration)
    return id
  }
  return {
    toasts, push, dismiss,
    success: (m) => push('success', m),
    error: (m) => push('error', m, 6500),
    info: (m) => push('info', m),
  }
})
