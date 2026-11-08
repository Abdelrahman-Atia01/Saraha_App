// Real-browser end-to-end check. Requires: backend running, frontend preview/dev server running, and `playwright` installed.
//   BASE_URL=http://localhost:4173 node e2e/saraha.e2e.mjs
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright');
import assert from 'node:assert/strict';

const BASE = process.env.BASE_URL || 'http://localhost:4173';
const PASS = 'Str0ng!Pass-1';
const run = Math.random().toString(36).slice(2, 8);
const users = { a: { name: `alice${run}`, email: `alice_${run}@example.com` }, b: { name: `bob${run}`, email: `bob_${run}@example.com` } };
const results = [];
const step = async (name, fn) => { try { await fn(); results.push(['PASS', name]); } catch (e) { results.push(['FAIL', name, e.message.split('\n')[0]]); } };

const browser = await chromium.launch();
const ctx = await browser.newContext({ locale: 'ar-EG', viewport: { width: 420, height: 900 } });
const page = await ctx.newPage();
const alertText = async () => (await page.locator('[role="alert"], [role="status"]').filter({ hasText: /\S/ }).first().innerText()).trim();
const toastOrAlert = (text) => page.getByText(text).first().waitFor({ timeout: 8000 });

async function register(u) {
  await page.goto(`${BASE}/register`);
  await page.getByLabel('اسم المستخدم').fill(u.name);
  await page.getByLabel('البريد الإلكتروني').fill(u.email);
  await page.getByLabel('رقم الهاتف').fill('+201000000000');
  await page.getByLabel('كلمة المرور', { exact: true }).fill(PASS);
  await page.getByLabel('تأكيد كلمة المرور').fill(PASS);
  await page.getByRole('button', { name: 'إنشاء الحساب', exact: true }).click();
  await page.getByText('تم إنشاء حسابك بنجاح').waitFor({ timeout: 10000 });
}
async function login(u, password = PASS) {
  await page.goto(`${BASE}/login`);
  await page.getByLabel('البريد الإلكتروني').fill(u.email);
  await page.getByLabel('كلمة المرور', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'تسجيل الدخول', exact: true }).click();
}
const userId = async () => page.evaluate(async () => (await (await fetch('/api/user/getUser', { headers: { authorization: localStorage.getItem('saraha.token') } })).json()).user._id);

await step('register two users through the UI', async () => { await register(users.a); await register(users.b); });
await step('duplicate registration shows EMAIL_EXISTS text', async () => {
  await page.goto(`${BASE}/register`);
  await page.getByLabel('اسم المستخدم').fill(users.a.name);
  await page.getByLabel('البريد الإلكتروني').fill(users.a.email);
  await page.getByLabel('رقم الهاتف').fill('+201000000000');
  await page.getByLabel('كلمة المرور', { exact: true }).fill(PASS);
  await page.getByLabel('تأكيد كلمة المرور').fill(PASS);
  await page.getByRole('button', { name: 'إنشاء الحساب', exact: true }).click();
  await toastOrAlert('الإيميل ده مسجل قبل كده.');
});
await step('wrong password shows INVALID_CREDENTIALS text', async () => { await login(users.a, 'wrong-Password-9'); await toastOrAlert('الإيميل أو كلمة السر مش صح.'); });
let aId, bId;
await step('login A succeeds and share link carries A\'s id', async () => { await login(users.a); await page.waitForURL(`${BASE}/`, { timeout: 10000 }); aId = await userId(); assert.match(aId, /^[a-f0-9]{24}$/); });
await step('logout A, login B', async () => { await page.evaluate(() => localStorage.clear()); await login(users.b); await page.waitForURL(`${BASE}/`, { timeout: 10000 }); bId = await userId(); });
await step('B opens A\'s link: recipient name is shown; B sends a message', async () => {
  await page.goto(`${BASE}/send/${aId}`);
  await page.getByText(`إلى: ${users.a.name}`).waitFor({ timeout: 8000 });
  await page.locator('textarea').fill('رسالة اختبار من E2E');
  await page.getByRole('button', { name: 'إرسال', exact: true }).click();
  await page.getByText('تم إرسال الرسالة بنجاح').waitFor({ timeout: 8000 });
});
await step('B sends to himself -> exact SELF_MESSAGE text, no success screen', async () => {
  await page.goto(`${BASE}/send/${bId}`);
  await page.locator('textarea').fill('hello me');
  await page.getByRole('button', { name: 'إرسال', exact: true }).click();
  await toastOrAlert('مينفعش تبعت رسالة لنفسك.');
  assert.equal(await page.getByText('تم إرسال الرسالة بنجاح').count(), 0);
});
await step('nonexistent profile link -> الحساب ده غير موجود.', async () => { await page.goto(`${BASE}/send/${'0'.repeat(24)}`); await toastOrAlert('الحساب ده غير موجود.'); });
await step('empty message -> اكتب رسالتك الأول.', async () => {
  await page.goto(`${BASE}/send/${aId}`);
  await page.locator('textarea').fill('   ');
  await page.getByRole('button', { name: 'إرسال', exact: true }).click();
  await toastOrAlert('اكتب رسالتك الأول.');
});
await step('501-char message -> الرسالة أطول من الحد المسموح.', async () => {
  await page.locator('textarea').fill('x'.repeat(501));
  await page.getByRole('button', { name: 'إرسال', exact: true }).click();
  await toastOrAlert('الرسالة أطول من الحد المسموح.');
});
await step('network offline while sending -> no-internet text', async () => {
  await page.locator('textarea').fill('offline test');
  await ctx.setOffline(true);
  await page.getByRole('button', { name: 'إرسال', exact: true }).click();
  await toastOrAlert('مفيش اتصال بالإنترنت، حاول تاني.');
  await ctx.setOffline(false);
});
await step('A sees the message in the inbox without the sender identity', async () => {
  await page.evaluate(() => localStorage.clear()); await login(users.a); await page.waitForURL(`${BASE}/`, { timeout: 10000 });
  await page.goto(`${BASE}/inbox`);
  await page.getByText('رسالة اختبار من E2E').first().waitFor({ timeout: 8000 });
  const body = await page.locator('body').innerText();
  assert.ok(!body.includes(users.b.name) && !body.includes(users.b.email));
});
await step('garbage stored token -> session dropped and redirected to login', async () => {
  await page.evaluate(() => localStorage.setItem('saraha.token', 'garbage.token.value'));
  await page.goto(`${BASE}/inbox`);
  await page.waitForURL(/\/login/, { timeout: 10000 });
});
await step('token invalidated server-side (password changed elsewhere) -> session-ended text', async () => {
  await login(users.a); await page.waitForURL(`${BASE}/`, { timeout: 10000 });
  const old = await page.evaluate(() => localStorage.getItem('saraha.token'));
  const res = await page.evaluate(async ({ old, p }) => (await fetch('/api/user/changePassword', { method: 'PATCH', headers: { 'content-type': 'application/json', authorization: old }, body: JSON.stringify({ currentPassword: p, newPassword: p + 'x', confirmPassword: p + 'x' }) })).status, { old, p: PASS });
  assert.equal(res, 200);
  await page.getByRole('link', { name: /الرسائل الواردة|واردة/ }).first().click().catch(() => page.goto(`${BASE}/inbox`));
  await page.getByText('جلسة الدخول مش صالحة، سجل دخولك مرة تانية.').first().waitFor({ timeout: 8000 });
  await page.waitForURL(/\/login/, { timeout: 8000 });
});

await browser.close();
for (const r of results) console.log(r.join(' | '));
const failed = results.filter((r) => r[0] === 'FAIL').length;
console.log(`\n${results.length - failed}/${results.length} passed`);
process.exit(failed ? 1 : 0);
