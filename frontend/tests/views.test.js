import { beforeEach, describe, expect, it } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createMemoryHistory, createRouter } from 'vue-router'
import SendMessageView from '@/views/messages/SendMessageView.vue'
import LoginView from '@/views/auth/LoginView.vue'
import { apiError, mockApi, networkDown } from './helpers'

const ME = 'a'.repeat(24)
const OTHER = 'b'.repeat(24)
const GHOST = 'c'.repeat(24)
const stub = { template: '<div />' }

async function mountView(component, { path = '/', props = {} } = {}) {
  const pinia = createPinia()
  setActivePinia(pinia)
  const router = createRouter({
    history: createMemoryHistory(),
    routes: ['/', '/login', '/outbox', '/profile', '/welcome', '/forgot-password', '/register'].map((p) => ({ path: p, component: stub })),
  })
  router.push(path)
  await router.isReady()
  const wrapper = mount(component, { props, global: { plugins: [pinia, router] } })
  await flushPromises()
  return wrapper
}
const alertText = (w) => w.find('[role="alert"]').text()
const fillAndSubmit = async (w, { recipient, content }) => {
  if (recipient !== undefined) await w.find('input').setValue(recipient)
  await w.find('textarea').setValue(content)
  await w.find('form').trigger('submit')
  await flushPromises()
}

beforeEach(() => localStorage.clear())

describe('SendMessageView', () => {
  it('self message: backend rejects (400 SELF_MESSAGE) and the page shows the exact Arabic text', async () => {
    const calls = mockApi((c) => c.url.includes('/user/profile/') ? { status: 200, data: { user: { _id: ME, userName: 'me' } } } : apiError(400, 'SELF_MESSAGE', 'You cannot send a message to yourself'))
    const w = await mountView(SendMessageView, { props: { recipientId: ME } })
    await fillAndSubmit(w, { content: 'hello' })
    expect(alertText(w)).toBe('مينفعش تبعت رسالة لنفسك.')
    expect(w.text()).not.toContain('You cannot')
    expect(w.text()).not.toContain('تم إرسال الرسالة بنجاح')
    expect(calls.filter((c) => c.url === '/message/sendMessage')).toHaveLength(1)
  })
  it('nonexistent profile in the shared link is reported as soon as the page opens', async () => {
    const calls = mockApi(() => apiError(404, 'USER_NOT_FOUND'))
    const w = await mountView(SendMessageView, { props: { recipientId: GHOST } })
    expect(alertText(w)).toBe('الحساب ده غير موجود.')
    expect(calls[0].url).toBe(`/user/profile/${GHOST}`)
  })
  it('existing profile shows the recipient name', async () => {
    mockApi(() => ({ status: 200, data: { user: { _id: OTHER, userName: 'sara' } } }))
    const w = await mountView(SendMessageView, { props: { recipientId: OTHER } })
    expect(w.text()).toContain('إلى: sara')
  })
  it('empty message is blocked client-side with the expected text and sends nothing', async () => {
    const calls = mockApi(() => ({ status: 200, data: { user: { _id: OTHER, userName: 'sara' } } }))
    const w = await mountView(SendMessageView, { props: { recipientId: OTHER } })
    const before = calls.length
    await fillAndSubmit(w, { content: '   ' })
    expect(w.text()).toContain('اكتب رسالتك الأول.')
    expect(calls.length).toBe(before)
  })
  it('over-long message is blocked client-side; backend MESSAGE_TOO_LONG is also rendered correctly', async () => {
    const calls = mockApi((c) => c.url.includes('/user/profile/') ? { status: 200, data: { user: { _id: OTHER, userName: 'sara' } } } : apiError(400, 'MESSAGE_TOO_LONG'))
    const w = await mountView(SendMessageView, { props: { recipientId: OTHER } })
    await fillAndSubmit(w, { content: 'x'.repeat(501) })
    expect(w.text()).toContain('الرسالة أطول من الحد المسموح.')
    expect(calls.some((c) => c.url === '/message/sendMessage')).toBe(false)
    await fillAndSubmit(w, { content: 'x'.repeat(10) }) // server-side rule still surfaces its own Arabic text
    expect(alertText(w)).toBe('الرسالة أطول من الحد المسموح.')
  })
  it('network outage while sending shows the offline message (and not a success screen)', async () => {
    let first = true
    mockApi(() => { if (first) { first = false; return { status: 200, data: { user: { _id: OTHER, userName: 'sara' } } } } return networkDown() })
    const w = await mountView(SendMessageView, { props: { recipientId: OTHER } })
    await fillAndSubmit(w, { content: 'hi' })
    expect(alertText(w)).toBe('مفيش اتصال بالإنترنت، حاول تاني.')
    expect(w.text()).not.toContain('تم إرسال الرسالة بنجاح')
  })
  it('server crash while sending shows an honest server-error message', async () => {
    mockApi((c) => c.url.includes('/user/profile/') ? { status: 200, data: { user: { _id: OTHER, userName: 'sara' } } } : { status: 500, data: apiError(500, 'INTERNAL_ERROR').data })
    const w = await mountView(SendMessageView, { props: { recipientId: OTHER } })
    await fillAndSubmit(w, { content: 'hi' })
    expect(alertText(w)).toBe('حصل خطأ في السيرفر مش بسببك. حاول تاني بعد شوية.')
  })
  it('success shows the confirmation only after the backend confirmed', async () => {
    mockApi((c) => c.url.includes('/user/profile/')
      ? { status: 200, data: { user: { _id: OTHER, userName: 'sara' } } }
      : { status: 201, data: { result: 'message Added Successfully', message: { _id: 'm1' } } })
    const w = await mountView(SendMessageView, { props: { recipientId: OTHER } })
    await fillAndSubmit(w, { content: 'hi' })
    expect(w.text()).toContain('تم إرسال الرسالة بنجاح')
  })
})

describe('LoginView', () => {
  const login = async (w) => { const inputs = w.findAll('input'); await inputs[0].setValue('a@b.co'); await inputs[1].setValue('password1'); await w.find('form').trigger('submit'); await flushPromises() }
  it('wrong credentials -> Arabic message from code', async () => {
    mockApi(() => apiError(401, 'INVALID_CREDENTIALS', 'Invalid email or password'))
    const w = await mountView(LoginView, { path: '/login' })
    await login(w)
    expect(alertText(w)).toBe('الإيميل أو كلمة السر مش صح.')
  })
  it('server unreachable -> offline message; rate limited -> RATE_LIMITED message', async () => {
    mockApi(networkDown)
    let w = await mountView(LoginView, { path: '/login' })
    await login(w)
    expect(alertText(w)).toBe('مفيش اتصال بالإنترنت، حاول تاني.')
    mockApi(() => apiError(429, 'RATE_LIMITED'))
    w = await mountView(LoginView, { path: '/login' })
    await login(w)
    expect(alertText(w)).toBe('محاولات كتير، استنى شوية وحاول تاني.')
  })
})
