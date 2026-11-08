import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { authService } from '@/services/auth.service'
import { usersService } from '@/services/users.service'
import { storage, TOKEN_KEY } from '@/utils/storage'
import { getTokenExpiry, isTokenExpired } from '@/utils/jwt'
import { useMessagesStore } from './messages'
import { connectRealtime, disconnectRealtime } from '@/services/realtime'

let sessionExpiredHandler = null
export const onSessionExpired = (fn) => { sessionExpiredHandler = fn }

export const useAuthStore = defineStore('auth', () => {
  const token = ref(storage.get(TOKEN_KEY))
  const user = ref(null)
  const ready = ref(false) // true once the stored session has been checked against the backend
  let pendingInit = null
  if (token.value) queueMicrotask(() => scheduleExpiry(token.value))

  const isAuthenticated = computed(() => !!token.value && !isTokenExpired(token.value))
  const isActivated = computed(() => !!user.value?.confirmEmail)

  // The backend JWT lives for 1 hour. Fire a callback when it runs out so an idle tab is signed out.
  let expiryTimer = null
  function scheduleExpiry(value) {
    clearTimeout(expiryTimer)
    const exp = value ? getTokenExpiry(value) : null
    if (!exp) return
    const delay = exp - Date.now()
    if (delay > 0 && delay < 2 ** 31 - 1) expiryTimer = setTimeout(() => sessionExpiredHandler?.(), delay)
  }

  function setToken(value) {
    token.value = value
    if (value) storage.set(TOKEN_KEY, value)
    else storage.remove(TOKEN_KEY)
    scheduleExpiry(value)
  }

  function clearSession() {
    disconnectRealtime()
    setToken(null)
    user.value = null
    useMessagesStore().reset()
  }

  async function fetchUser() {
    user.value = await usersService.getMe()
    return user.value
  }

  /** Validates a stored token once per page load (one network call, shared by concurrent callers). */
  function init() {
    if (ready.value) return Promise.resolve()
    if (pendingInit) return pendingInit
    pendingInit = (async () => {
      try {
        if (token.value && !isTokenExpired(token.value)) {
          await fetchUser()
          await startRealtime()
        }
        else if (token.value) clearSession()
      } catch {
        // Any failure to load the account (expired, invalid, backend unreachable) leaves no usable session.
        clearSession()
      } finally {
        ready.value = true
        pendingInit = null
      }
    })()
    return pendingInit
  }

  async function startRealtime() {
    try {
      await connectRealtime(token.value, {
        onNewMessage: () => useMessagesStore().load('inbox', { force: true }).catch(() => {}),
        onSentMessage: () => useMessagesStore().load('outbox', { force: true }).catch(() => {}),
        onDeletedMessage: () => {
          const store = useMessagesStore()
          store.load('inbox', { force: true }).catch(() => {})
          store.load('outbox', { force: true }).catch(() => {})
        },
      })
    } catch (error) {
      // HTTP remains authoritative; a temporary realtime outage must not block sign-in.
      console.warn('Realtime connection unavailable')
    }
  }

  async function login(credentials) {
    const newToken = await authService.login(credentials)
    setToken(newToken)
    try {
      await fetchUser()
      await startRealtime()
    } catch (e) {
      clearSession()
      throw e
    }
    ready.value = true
  }

  const register = (payload) => authService.register(payload)

  function logout() {
    clearSession()
  }

  async function updateProfile({ userName, email }) {
    await usersService.updateProfile({ _id: user.value._id, userName, email })
    await fetchUser() // canonical state (decrypted phone etc.)
  }

  const changePassword = ({ currentPassword, newPassword, confirmPassword }) =>
    usersService.changePassword({ email: user.value.email, currentPassword, newPassword, confirmPassword })

  return { token, user, ready, isAuthenticated, isActivated, init, login, register, logout, fetchUser, updateProfile, changePassword }
})
