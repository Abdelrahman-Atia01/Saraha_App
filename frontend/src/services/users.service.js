import { http } from './http'
import { ApiError } from '@/utils/errors'

export const usersService = {
  /** GET /user/getUser (auth) → { user } – phone already decrypted by the backend. */
  async getMe() {
    const { data } = await http.get('/user/getUser')
    if (!data?.user?._id) throw new ApiError('تعذّر تحميل بيانات الحساب.', { raw: data })
    return data.user
  },

  /** GET /user/profile/:id (auth) → { _id, userName, image }; 404 USER_NOT_FOUND when the account does not exist. */
  async getPublicProfile(id) {
    const { data } = await http.get(`/user/profile/${encodeURIComponent(id)}`)
    if (!data?.user?._id) throw new ApiError('تعذّر تحميل بيانات الحساب.', { raw: data })
    return data.user
  },

  /** PATCH /user/updateProfile → body is { email, userName }; the server derives the account id from the authenticated token. */
  async updateProfile({ email, userName }) {
    const { data } = await http.patch('/user/updateProfile', { email, userName })
    if (data?.message !== 'user updated successfully') throw new ApiError('لم يؤكد الخادم تحديث الملف الشخصي.', { raw: data })
    return data.updatedUser
  },

  /** POST /user/upload (multipart/form-data) → profile image URL. */
  async uploadImage(file) {
    const form = new FormData()
    form.append('image', file)
    const { data } = await http.post('/user/upload', form)
    if (!data?.image) throw new ApiError('لم يؤكد الخادم رفع الصورة.', { raw: data })
    return data.image
  },

  /** PATCH /user/changePassword → { currentPassword, newPassword, confirmPassword } */
  async changePassword({ currentPassword, newPassword, confirmPassword }) {
    const { data } = await http.patch('/user/changePassword', { currentPassword, newPassword, confirmPassword })
    if (data?.message !== 'user password changed successfully') throw new ApiError('لم يؤكد الخادم تغيير كلمة المرور.', { raw: data })
    return true
  },
}
