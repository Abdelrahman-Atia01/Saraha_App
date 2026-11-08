import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useToastStore } from '@/stores/toast'

export function useLogout() {
  const auth = useAuthStore()
  const router = useRouter()
  const toast = useToastStore()
  const confirming = ref(false)

  async function logout() {
    confirming.value = false
    auth.logout() // clears token, user and cached messages
    toast.info('تم تسجيل الخروج.')
    await router.replace('/welcome')
  }
  return { confirming, logout }
}
