import { useToastStore } from '@/stores/toast'

export function useCopy() {
  const toast = useToastStore()
  return async function copy(text, okMessage = 'تم النسخ') {
    try {
      await navigator.clipboard.writeText(text)
      toast.success(okMessage)
    } catch {
      // Clipboard API unavailable (insecure context): fall back to a temporary textarea.
      const ta = Object.assign(document.createElement('textarea'), { value: text })
      ta.style.position = 'fixed'; ta.style.opacity = '0'
      document.body.appendChild(ta); ta.select()
      const ok = document.execCommand?.('copy')
      ta.remove()
      ok ? toast.success(okMessage) : toast.error('تعذّر النسخ. انسخ الرابط يدويًا.')
    }
  }
}
