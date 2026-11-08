import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { onUnauthorized } from './services/http'
import { onSessionExpired, useAuthStore } from './stores/auth'
import { useToastStore } from './stores/toast'
import './styles/main.css'

const app = createApp(App)
app.use(createPinia())
app.use(router)

// Backend rejected the JWT (expired after 1h / invalid): drop the session and return to login.
onUnauthorized((err) => handleSessionEnd(err?.message))

function handleSessionEnd(message = 'انتهت صلاحية تسجيل الدخول، سجل دخولك مرة تانية.') {
  const auth = useAuthStore()
  if (!auth.token) return
  auth.logout()
  useToastStore().error(message)
  const current = router.currentRoute.value
  router.replace({ name: 'login', query: current.matched.some((r) => r.meta.requiresAuth) ? { redirect: current.fullPath } : {} })
}

// Same handling when the 1-hour JWT runs out locally (no request needed).
onSessionExpired(() => handleSessionEnd())

app.mount('#app')
