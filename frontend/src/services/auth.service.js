import { http } from './http'
import { ApiError } from '@/utils/errors'

export const authService = {
  /** POST /auth/register  → { message, user } */
  async register({ userName, email, password, confirmPassword, phone }) {
    const { data } = await http.post('/auth/register', { userName, email, password, confirmPassword, phone })
    if (!data?.user?._id) throw new ApiError('لم يؤكد الخادم إنشاء الحساب.', { raw: data })
    return data.user
  },

  /** POST /auth/login → { message, Token } (JWT, 1 hour) */
  async login({ email, password }) {
    const { data } = await http.post('/auth/login', { email, password })
    if (!data?.Token) throw new ApiError('لم يُرجع الخادم رمز الدخول.', { raw: data })
    return data.Token
  },

  async forgotPassword(email) {
    const { data } = await http.post('/auth/forgot-password', { email })
    return data.message
  },

  async resetPassword(token, { newPassword, confirmPassword }) {
    const { data } = await http.post(`/auth/reset-password/${encodeURIComponent(token)}`, { newPassword, confirmPassword })
    if (data?.message !== 'Password reset successfully') throw new ApiError('لم يؤكد الخادم تغيير كلمة المرور.', { raw: data })
    return true
  },

  /**
   * GET /auth/activate/:emailToken
   * The backend answers with an HTML page on success and a 500 JSON on an invalid token.
   */
  async activate(emailToken) {
    const res = await http.get(`/auth/activate_account/${encodeURIComponent(emailToken)}`, {
      responseType: 'text',
      transformResponse: (d) => d,
    })
    if (res.status !== 200) throw new ApiError('معرفناش نفعّل الحساب، حاول تاني.', { status: res.status })
    return true
  },
}
