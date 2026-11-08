// Client-side rules mirror the backend's Joi schemas (Auth.validation.js / user.validation.js).
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
// Backend: 8–72 characters; symbols and spaces are supported.
const PASSWORD = /^.{8,72}$/s
export const OBJECT_ID = /^[a-f\d]{24}$/i

export const required = (label) => (v) => (String(v ?? '').trim() ? '' : `${label} مطلوب`)

export const validateUserName = (v) => {
  const s = String(v ?? '').trim()
  if (!s) return 'اسم المستخدم مطلوب'
  if (s.length < 3) return 'اسم المستخدم يجب ألا يقل عن 3 أحرف'
  if (s.length > 20) return 'اسم المستخدم يجب ألا يزيد على 20 حرفًا'
  return ''
}
export const validateEmail = (v) => {
  const s = String(v ?? '').trim()
  if (!s) return 'البريد الإلكتروني مطلوب'
  return EMAIL.test(s) ? '' : 'صيغة البريد الإلكتروني غير صحيحة'
}
export const validatePassword = (v) => {
  if (!v) return 'كلمة المرور مطلوبة'
  return PASSWORD.test(v) ? '' : 'كلمة المرور يجب أن تكون من 8 إلى 72 حرفًا'
}
export const validateConfirm = (password) => (v) => {
  if (!v) return 'تأكيد كلمة المرور مطلوب'
  return v === password ? '' : 'كلمتا المرور غير متطابقتين'
}
export const validatePhone = (v) => {
  const s = String(v ?? '').trim()
  if (!s) return 'رقم الهاتف مطلوب'
  return /^\+?[\d\s-]{7,16}$/.test(s) ? '' : 'رقم الهاتف غير صحيح'
}
export const validateRecipientId = (v) => {
  const s = String(v ?? '').trim()
  if (!s) return 'معرّف المستلم مطلوب'
  return OBJECT_ID.test(s) ? '' : 'معرّف المستلم غير صالح (24 خانة)'
}
export const MESSAGE_MAX = 500
export const validateMessage = (v) => {
  const s = String(v ?? '').trim()
  if (!s) return 'اكتب رسالتك الأول.'
  if (s.length > MESSAGE_MAX) return 'الرسالة أطول من الحد المسموح.'
  return ''
}
