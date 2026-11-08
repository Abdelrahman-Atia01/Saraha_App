import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { ApiError, CODE_MESSAGES, GENERIC_MESSAGE, NETWORK_MESSAGE, errorMessage, fromHttpFailure } from '@/utils/errors'

describe('frontend/backend error contract', () => {
  it('every backend error code has an identical Arabic message in the frontend map (and vice versa)', () => {
    const file = path.resolve(__dirname, '../../backend/src/utils/errorCatalog.js')
    const source = fs.readFileSync(file, 'utf8')
    const backend = Object.fromEntries([...source.matchAll(/^\s*([A-Z_]+): \[(\d+), '(.+)'\],?$/gm)].map((m) => [m[1], m[3]]))
    expect(Object.keys(backend).length).toBeGreaterThan(20)
    for (const [code, message] of Object.entries(backend)) expect(CODE_MESSAGES[code], code).toBe(message)
    expect(Object.keys(CODE_MESSAGES).sort()).toEqual(Object.keys(backend).sort())
  })
})

describe('fromHttpFailure', () => {
  it('maps the documented example scenarios to the exact Arabic messages', () => {
    const cases = [
      [400, 'SELF_MESSAGE', 'مينفعش تبعت رسالة لنفسك.'],
      [404, 'USER_NOT_FOUND', 'الحساب ده غير موجود.'],
      [400, 'MESSAGE_EMPTY', 'اكتب رسالتك الأول.'],
      [400, 'MESSAGE_TOO_LONG', 'الرسالة أطول من الحد المسموح.'],
      [401, 'TOKEN_EXPIRED', 'انتهت صلاحية تسجيل الدخول، سجل دخولك مرة تانية.'],
      [403, 'FORBIDDEN', 'معندكش صلاحية لتنفيذ العملية دي.'],
    ]
    for (const [status, code, message] of cases) {
      const err = fromHttpFailure(status, { code, message: 'ignored english text' })
      expect(err).toBeInstanceOf(ApiError)
      expect([err.message, err.code, err.status]).toEqual([message, code, status])
    }
  })
  it('shows the backend\'s field-specific Arabic validation message', () => {
    expect(fromHttpFailure(400, { code: 'VALIDATION_ERROR', message: 'الإيميل مطلوب.' }).message).toBe('الإيميل مطلوب.')
    expect(fromHttpFailure(400, { code: 'VALIDATION_ERROR', message: 'English leak' }).message).toBe('البيانات المدخلة غير صحيحة.')
  })
  it('explains status-level failures honestly when no code is present', () => {
    expect(fromHttpFailure(502, '<html>Bad Gateway</html>').message).toBe('السيرفر مش متاح دلوقتي، حاول بعد شوية.')
    expect(fromHttpFailure(500, {}).code).toBe('SERVER_DOWN') // code-less 5xx = proxy/gateway, not our API
    expect(fromHttpFailure(429, null).code).toBe('RATE_LIMITED')
    expect(fromHttpFailure(401, null).code).toBe('TOKEN_INVALID')
  })
  it('never surfaces raw English server text or stack traces', () => {
    const err = fromHttpFailure(500, { message: 'MongoServerError: E11000 at /srv/app/x.js:10', stack: 'secret' })
    expect(err.message).not.toMatch(/Mongo|srv|secret/)
  })
  it('errorMessage: unknown (non-ApiError) failures use the generic message', () => {
    expect(errorMessage(new TypeError('x is undefined'))).toBe(GENERIC_MESSAGE)
    expect(errorMessage(new ApiError(NETWORK_MESSAGE))).toBe(NETWORK_MESSAGE)
  })
})
