import { beforeEach, describe, expect, it, vi } from 'vitest'
import { http, onUnauthorized } from '@/services/http'
import { storage, TOKEN_KEY } from '@/utils/storage'
import { authService } from '@/services/auth.service'
import { messagesService } from '@/services/messages.service'
import { apiError, mockApi, networkDown, timeout } from './helpers'

const fail = async (p) => { try { await p } catch (e) { return e } throw new Error('expected failure') }
beforeEach(() => { localStorage.clear(); onUnauthorized(null) })

describe('http error interpretation', () => {
  it('network failure -> "no internet" message', async () => {
    mockApi(networkDown)
    const e = await fail(http.get('/x'))
    expect([e.code, e.message]).toEqual(['NETWORK', 'مفيش اتصال بالإنترنت، حاول تاني.'])
  })
  it('timeout -> distinct timeout message', async () => {
    mockApi(timeout)
    const e = await fail(http.get('/x'))
    expect([e.code, e.message]).toEqual(['TIMEOUT', 'السيرفر اتأخر في الرد، حاول تاني.'])
  })
  it('expired token on an authenticated call triggers session end exactly once with the right message', async () => {
    storage.set(TOKEN_KEY, 'tok')
    const handler = vi.fn()
    onUnauthorized(handler)
    mockApi(() => apiError(401, 'TOKEN_EXPIRED'))
    const e = await fail(messagesService.inbox())
    expect(e.message).toBe('انتهت صلاحية تسجيل الدخول، سجل دخولك مرة تانية.')
    expect(handler).toHaveBeenCalledTimes(1)
    expect(handler.mock.calls[0][0].code).toBe('TOKEN_EXPIRED')
  })
  it('wrong credentials at login are NOT treated as an expired session', async () => {
    storage.set(TOKEN_KEY, 'stale')
    const handler = vi.fn()
    onUnauthorized(handler)
    mockApi(() => apiError(401, 'INVALID_CREDENTIALS'))
    const e = await fail(authService.login({ email: 'a@b.co', password: 'x' }))
    expect(e.message).toBe('الإيميل أو كلمة السر مش صح.')
    expect(handler).not.toHaveBeenCalled()
  })
  it('self message -> SELF_MESSAGE text; unknown profile -> USER_NOT_FOUND text', async () => {
    mockApi(() => apiError(400, 'SELF_MESSAGE'))
    expect((await fail(messagesService.send({ content: 'hi', reciever: 'a'.repeat(24) }))).message).toBe('مينفعش تبعت رسالة لنفسك.')
    mockApi(() => apiError(404, 'USER_NOT_FOUND'))
    expect((await fail(messagesService.send({ content: 'hi', reciever: 'a'.repeat(24) }))).message).toBe('الحساب ده غير موجود.')
  })
  it('server crash and gateway failure produce honest, distinct messages', async () => {
    mockApi(() => ({ status: 500, data: apiError(500, 'INTERNAL_ERROR').data }))
    expect((await fail(http.get('/x'))).code).toBe('INTERNAL_ERROR')
    mockApi(() => ({ status: 502, data: '<html>Bad gateway</html>' }))
    expect((await fail(http.get('/x'))).message).toBe('السيرفر مش متاح دلوقتي، حاول بعد شوية.')
  })
  it('activation (text response type) still decodes the JSON error body', async () => {
    mockApi(() => ({ status: 400, data: JSON.stringify(apiError(400, 'ACTIVATION_LINK_INVALID').data) }))
    const e = await fail(authService.activate('bad'))
    expect(e.code).toBe('ACTIVATION_LINK_INVALID')
  })
  it('a 200 with an unexpected body is reported as an unconfirmed operation, not success', async () => {
    mockApi(() => ({ status: 200, data: { oops: true } }))
    const e = await fail(messagesService.send({ content: 'hi', reciever: 'a'.repeat(24) }))
    expect(e.message).toBe('لم يؤكد الخادم إرسال الرسالة.')
  })
})
