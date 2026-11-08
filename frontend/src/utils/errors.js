// The backend answers every failure with { statusCode, status, code, message, details? }.
// Codes are the contract: the frontend maps them to Arabic here (kept identical to backend/src/utils/errorCatalog.js,
// which a test enforces), so no UI text depends on parsing English or free-form server strings.
export const CODE_MESSAGES = {
  VALIDATION_ERROR: 'البيانات المدخلة غير صحيحة.',
  INVALID_JSON: 'البيانات المبعوتة مش مقروءة، حاول تاني.',
  MESSAGE_EMPTY: 'اكتب رسالتك الأول.',
  MESSAGE_TOO_LONG: 'الرسالة أطول من الحد المسموح.',
  SELF_MESSAGE: 'مينفعش تبعت رسالة لنفسك.',
  PASSWORD_MISMATCH: 'كلمتا السر مش متطابقتين.',
  PASSWORD_SAME_AS_OLD: 'كلمة السر الجديدة لازم تختلف عن الحالية.',
  CURRENT_PASSWORD_WRONG: 'كلمة السر الحالية غلط.',
  ACTIVATION_LINK_INVALID: 'رابط التفعيل غير صالح أو انتهت صلاحيته.',
  RESET_LINK_INVALID: 'رابط استعادة كلمة السر غير صالح أو انتهت صلاحيته.',
  IMAGE_REQUIRED: 'اختار صورة الأول.',
  IMAGE_INVALID: 'الملف ده مش صورة مدعومة. استخدم JPG أو PNG أو WEBP أو GIF.',
  AUTH_REQUIRED: 'لازم تسجل دخولك الأول.',
  TOKEN_EXPIRED: 'انتهت صلاحية تسجيل الدخول، سجل دخولك مرة تانية.',
  TOKEN_INVALID: 'جلسة الدخول مش صالحة، سجل دخولك مرة تانية.',
  INVALID_CREDENTIALS: 'الإيميل أو كلمة السر مش صح.',
  FORBIDDEN: 'معندكش صلاحية لتنفيذ العملية دي.',
  USER_NOT_FOUND: 'الحساب ده غير موجود.',
  MESSAGE_NOT_FOUND: 'الرسالة دي مش موجودة أو اتحذفت.',
  ROUTE_NOT_FOUND: 'الرابط المطلوب مش موجود.',
  EMAIL_EXISTS: 'الإيميل ده مسجل قبل كده.',
  PAYLOAD_TOO_LARGE: 'حجم البيانات المبعوتة أكبر من المسموح.',
  IMAGE_TOO_LARGE: 'حجم الصورة أكبر من الحد المسموح (5 ميجا).',
  RATE_LIMITED: 'محاولات كتير، استنى شوية وحاول تاني.',
  INTERNAL_ERROR: 'حصل خطأ في السيرفر مش بسببك. حاول تاني بعد شوية.',
  EMAIL_SERVICE_UNAVAILABLE: 'خدمة الإيميل مش متاحة دلوقتي، حاول بعد شوية.',
  EMAIL_SEND_FAILED: 'معرفناش نبعت الإيميل، حاول تاني بعد شوية.',
  SERVICE_UNAVAILABLE: 'الخدمة مش متاحة دلوقتي، حاول بعد شوية.',
}

// Failures that never reach the backend's JSON error handler (offline, timeout, proxy/gateway down).
export const NETWORK_MESSAGE = 'مفيش اتصال بالإنترنت، حاول تاني.'
export const TIMEOUT_MESSAGE = 'السيرفر اتأخر في الرد، حاول تاني.'
export const SERVER_DOWN_MESSAGE = 'السيرفر مش متاح دلوقتي، حاول بعد شوية.'
export const SERVER_ERROR_MESSAGE = CODE_MESSAGES.INTERNAL_ERROR
// Only used when the cause really is unknown (unexpected status with no code).
export const GENERIC_MESSAGE = 'حصل خطأ مش متوقع. حاول تاني.'

export const SESSION_CODES = ['AUTH_REQUIRED', 'TOKEN_EXPIRED', 'TOKEN_INVALID']

/** Error thrown by the API layer. `message` is always safe, Arabic and user-facing; `code` is machine-readable. */
export class ApiError extends Error {
  constructor(message, { status = 0, code = 'API_ERROR', raw = null } = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code // a backend code, or NETWORK | TIMEOUT | SERVER_DOWN | API_ERROR (client-side)
    this.raw = raw
  }
}

const hasArabic = (s) => typeof s === 'string' && /[؀-ۿ]/.test(s)

/** Builds the user-facing error from an HTTP failure. */
export function fromHttpFailure(status, body) {
  const data = body && typeof body === 'object' ? body : null
  const code = data?.code
  if (code && CODE_MESSAGES[code]) {
    // Field-level validation: the backend already names the exact field in Arabic, which is more useful than the generic line.
    const message = code === 'VALIDATION_ERROR' && hasArabic(data.message) ? data.message : CODE_MESSAGES[code]
    return new ApiError(message, { status, code, raw: data })
  }
  if (hasArabic(data?.message)) return new ApiError(data.message, { status, code: code || 'API_ERROR', raw: data })
  // No usable code: derive the honest, status-level explanation.
  if (status === 401) return new ApiError(CODE_MESSAGES.TOKEN_INVALID, { status, code: 'TOKEN_INVALID', raw: data })
  if (status === 403) return new ApiError(CODE_MESSAGES.FORBIDDEN, { status, code: 'FORBIDDEN', raw: data })
  if (status === 404) return new ApiError('المطلوب مش موجود.', { status, code: 'NOT_FOUND', raw: data })
  if (status === 413) return new ApiError(CODE_MESSAGES.PAYLOAD_TOO_LARGE, { status, code: 'PAYLOAD_TOO_LARGE', raw: data })
  if (status === 429) return new ApiError(CODE_MESSAGES.RATE_LIMITED, { status, code: 'RATE_LIMITED', raw: data })
  // Our backend always answers with a JSON body carrying a code, so a code-less 5xx came from a proxy/gateway (backend down).
  if (status >= 500) return new ApiError(SERVER_DOWN_MESSAGE, { status, code: 'SERVER_DOWN', raw: data })
  return new ApiError(GENERIC_MESSAGE, { status, code: 'API_ERROR', raw: data })
}

export const errorMessage = (e) => (e instanceof ApiError ? e.message : GENERIC_MESSAGE)
