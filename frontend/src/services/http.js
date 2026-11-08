import axios from 'axios'
import { storage, TOKEN_KEY } from '@/utils/storage'
import { ApiError, NETWORK_MESSAGE, SESSION_CODES, TIMEOUT_MESSAGE, fromHttpFailure } from '@/utils/errors'

export const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 20000,
})

let unauthorizedHandler = null
export const onUnauthorized = (fn) => { unauthorizedHandler = fn }

// The backend accepts the raw JWT in the Authorization header (a "Bearer " prefix is accepted too).
http.interceptors.request.use((config) => {
  const token = storage.get(TOKEN_KEY)
  if (token) config.headers.authorization = token
  return config
})

// Responses that were requested as text (account activation) still carry JSON error bodies.
const parseBody = (data) => {
  if (typeof data !== 'string') return data
  try { return JSON.parse(data) } catch { return null }
}

http.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error instanceof ApiError) throw error
    if (!error.response) {
      const timedOut = error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT'
      throw new ApiError(timedOut ? TIMEOUT_MESSAGE : NETWORK_MESSAGE, { code: timedOut ? 'TIMEOUT' : 'NETWORK', raw: error.message })
    }
    const apiError = fromHttpFailure(error.response.status, parseBody(error.response.data))
    // A rejected session on an authenticated call ends the session. Wrong credentials at login are NOT a session error.
    const isCredentialCall = /\/auth\/(login|register)/.test(error.config?.url || '')
    if (SESSION_CODES.includes(apiError.code) && !isCredentialCall && storage.get(TOKEN_KEY)) unauthorizedHandler?.(apiError)
    throw apiError
  },
)
