import test, { before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import supertest from 'supertest';
import { connect, disconnect, resetDb, makeUser, PASSWORD } from './helpers.js';

const { createApp } = await import('../src/app.js');
const { userModel } = await import('../src/DB/models/user.model.js');
const { messageModel } = await import('../src/DB/models/message.model.js');
const { ERRORS } = await import('../src/utils/errorCatalog.js');

let request;
before(async () => { await connect(); request = supertest(createApp({ limits: false })); });
after(async () => { await disconnect(); });
beforeEach(resetDb);

/** Every error must carry status, a catalog code and the catalog's Arabic message — never raw/English text. */
const expectError = (res, code, extra = {}) => {
  const [status, message] = ERRORS[code];
  assert.equal(res.status, status, `status for ${code}: ${JSON.stringify(res.body)}`);
  assert.equal(res.body.code, code);
  assert.equal(res.body.statusCode, status);
  if (!extra.keepMessage) assert.equal(res.body.message, message);
  assert.match(res.body.message, /[؀-ۿ]/, 'message must be Arabic');
  assert.doesNotMatch(JSON.stringify(res.body), /stack|node_modules|mongo|ECONN|at .*\(/i);
};
const send = (u, reciever, content) => request.post('/message/sendMessage').set(u.auth).send({ reciever, content });

// ───────────────────────── Registration & login ─────────────────────────
test('register: creates user, hides password, encrypts phone, hashes password', async () => {
  const res = await request.post('/auth/register').send({ userName: 'Alice', email: 'ALICE@Example.com', password: PASSWORD, confirmPassword: PASSWORD, phone: '+201000000000' });
  assert.equal(res.status, 201);
  assert.equal(res.body.user.email, 'alice@example.com');
  assert.equal(res.body.user.phone, '+201000000000');
  assert.equal('password' in res.body.user, false);
  const raw = await userModel.findOne({ email: 'alice@example.com' }).select('+password');
  assert.notEqual(raw.password, PASSWORD);
  assert.ok(await bcrypt.compare(PASSWORD, raw.password));
  assert.notEqual(raw.phone, '+201000000000');
});
test('register: duplicate email -> 409 EMAIL_EXISTS (case-insensitive)', async () => {
  await makeUser(request, { email: 'dup@example.com' });
  const res = await request.post('/auth/register').send({ userName: 'other', email: 'DUP@example.com', password: PASSWORD, confirmPassword: PASSWORD, phone: '+201000000000' });
  expectError(res, 'EMAIL_EXISTS');
  assert.equal(await userModel.countDocuments({ email: 'dup@example.com' }), 1);
});
test('register: password mismatch -> PASSWORD_MISMATCH; missing field -> Arabic VALIDATION_ERROR', async () => {
  const mismatch = await request.post('/auth/register').send({ userName: 'bob', email: 'b@example.com', password: PASSWORD, confirmPassword: 'different-1', phone: '+201000000000' });
  expectError(mismatch, 'PASSWORD_MISMATCH');
  const missing = await request.post('/auth/register').send({ userName: 'bob', password: PASSWORD, confirmPassword: PASSWORD, phone: '+201000000000' });
  expectError(missing, 'VALIDATION_ERROR', { keepMessage: true });
  assert.equal(missing.body.message, 'الإيميل مطلوب.');
  const short = await request.post('/auth/register').send({ userName: 'ab', email: 'b@example.com', password: PASSWORD, confirmPassword: PASSWORD, phone: '+201000000000' });
  assert.equal(short.body.message, 'اسم المستخدم لازم يكون 3 حروف على الأقل.');
  assert.equal(await userModel.countDocuments(), 0);
});
test('register: unknown/extra fields (mass assignment like role=admin) are rejected', async () => {
  const res = await request.post('/auth/register').send({ userName: 'evil', email: 'e@example.com', password: PASSWORD, confirmPassword: PASSWORD, phone: '+201000000000', role: 'admin' });
  assert.equal(res.status, 400);
  assert.equal(await userModel.countDocuments(), 0);
});
test('register: concurrent duplicate registrations never produce a 500', async () => {
  const body = { userName: 'racer', email: 'race@example.com', password: PASSWORD, confirmPassword: PASSWORD, phone: '+201000000000' };
  const results = await Promise.all([1, 2, 3].map(() => request.post('/auth/register').send(body)));
  assert.equal(results.filter((r) => r.status === 201).length, 1);
  for (const r of results.filter((x) => x.status !== 201)) expectError(r, 'EMAIL_EXISTS');
});
test('login: success returns JWT with 1h expiry; wrong password and unknown email are indistinguishable', async () => {
  const u = await makeUser(request, { email: 'login@example.com' });
  const ok = await request.post('/auth/login').send({ email: 'LOGIN@example.com', password: PASSWORD });
  assert.equal(ok.status, 200);
  const { exp, iat } = jwt.decode(ok.body.Token);
  assert.equal(exp - iat, 3600);
  const wrong = await request.post('/auth/login').send({ email: u.email, password: 'wrong-password' });
  const unknown = await request.post('/auth/login').send({ email: 'nobody@example.com', password: 'wrong-password' });
  expectError(wrong, 'INVALID_CREDENTIALS');
  expectError(unknown, 'INVALID_CREDENTIALS');
  assert.deepEqual(wrong.body, unknown.body);
});
test('login: NoSQL operator injection is rejected', async () => {
  await makeUser(request);
  const res = await request.post('/auth/login').send({ email: { $ne: null }, password: { $ne: null } });
  assert.equal(res.status, 400);
  assert.equal(res.body.code, 'VALIDATION_ERROR');
  const res2 = await request.post('/auth/login').send({ email: 'x@example.com', password: { $gt: '' } });
  assert.equal(res2.status, 400);
});

// ───────────────────────── Tokens & access control ─────────────────────────
const PROTECTED = [['get', '/user/getUser'], ['get', '/message/getMessages?flag=inbox'], ['post', '/message/sendMessage'], ['get', '/message/getMessage/507f1f77bcf86cd799439011'], ['delete', '/message/deleteMessage/507f1f77bcf86cd799439011'], ['patch', '/user/updateProfile'], ['patch', '/user/changePassword'], ['post', '/user/upload'], ['get', '/user/profile/507f1f77bcf86cd799439011']];
test('protected endpoints: no token -> 401 AUTH_REQUIRED', async () => {
  for (const [m, url] of PROTECTED) expectError(await request[m](url), 'AUTH_REQUIRED');
});
test('protected endpoints: malformed / wrong-key / alg=none tokens -> 401 TOKEN_INVALID', async () => {
  const u = await makeUser(request);
  const forged = jwt.sign({ id: u.id, tokenVersion: 0 }, 'not-the-server-key');
  const none = `${Buffer.from('{"alg":"none","typ":"JWT"}').toString('base64url')}.${Buffer.from(JSON.stringify({ id: u.id, tokenVersion: 0 })).toString('base64url')}.`;
  for (const t of ['garbage', forged, none]) expectError(await request.get('/user/getUser').set('Authorization', t), 'TOKEN_INVALID');
});
test('protected endpoints: expired token -> 401 TOKEN_EXPIRED; Bearer prefix accepted', async () => {
  const u = await makeUser(request);
  const expired = jwt.sign({ id: u.id, tokenVersion: 0 }, process.env.token_user_key, { expiresIn: -10 });
  expectError(await request.get('/user/getUser').set('Authorization', expired), 'TOKEN_EXPIRED');
  assert.equal((await request.get('/user/getUser').set('Authorization', `Bearer ${u.token}`)).status, 200);
});
test('token of a deleted user is rejected', async () => {
  const u = await makeUser(request);
  await userModel.deleteOne({ _id: u.id });
  expectError(await request.get('/user/getUser').set(u.auth), 'TOKEN_INVALID');
});
test('getUser never exposes password or tokenVersion', async () => {
  const u = await makeUser(request);
  const res = await request.get('/user/getUser').set(u.auth);
  assert.equal(res.status, 200);
  assert.equal(res.body.user.password, undefined);
  assert.equal(res.body.user.tokenVersion, undefined);
  assert.equal(res.body.user.phone, '+201000000000');
});

// ───────────────────────── Messaging business rules ─────────────────────────
test('send: delivers a message to another user (stored once, correct owners)', async () => {
  const a = await makeUser(request), b = await makeUser(request);
  const res = await send(a, b.id, '  مرحبا بك  ');
  assert.equal(res.status, 201);
  const stored = await messageModel.find();
  assert.equal(stored.length, 1);
  assert.equal(stored[0].content, 'مرحبا بك');
  assert.equal(String(stored[0].sender), a.id);
  assert.equal(String(stored[0].reciever), b.id);
});
test('send: message to oneself -> 400 SELF_MESSAGE, exact Arabic text, nothing saved', async () => {
  const a = await makeUser(request);
  const res = await send(a, a.id, 'hello me');
  expectError(res, 'SELF_MESSAGE');
  assert.equal(res.body.message, 'مينفعش تبعت رسالة لنفسك.');
  assert.equal(await messageModel.countDocuments(), 0);
});
test('send: nonexistent or malformed recipient -> 404 USER_NOT_FOUND, nothing saved', async () => {
  const a = await makeUser(request);
  const ghost = await send(a, '507f1f77bcf86cd799439011', 'hi');
  expectError(ghost, 'USER_NOT_FOUND');
  assert.equal(ghost.body.message, 'الحساب ده غير موجود.');
  expectError(await send(a, 'not-an-id', 'hi'), 'USER_NOT_FOUND');
  expectError(await send(a, undefined, 'hi'), 'USER_NOT_FOUND');
  assert.equal(await messageModel.countDocuments(), 0);
});
test('send: empty / whitespace / missing content -> MESSAGE_EMPTY', async () => {
  const a = await makeUser(request), b = await makeUser(request);
  for (const content of ['', '   \n\t ', undefined]) {
    const res = await send(a, b.id, content);
    expectError(res, 'MESSAGE_EMPTY');
    assert.equal(res.body.message, 'اكتب رسالتك الأول.');
  }
  assert.equal(await messageModel.countDocuments(), 0);
});
test('send: 500 chars accepted, 501 -> MESSAGE_TOO_LONG, non-string content rejected', async () => {
  const a = await makeUser(request), b = await makeUser(request);
  assert.equal((await send(a, b.id, 'x'.repeat(500))).status, 201);
  const long = await send(a, b.id, 'x'.repeat(501));
  expectError(long, 'MESSAGE_TOO_LONG');
  assert.equal(long.body.message, 'الرسالة أطول من الحد المسموح.');
  assert.equal((await send(a, b.id, { $ne: 1 })).status, 400);
  assert.equal((await send(a, b.id, ['a'])).status, 400);
  assert.equal(await messageModel.countDocuments(), 1);
});
test('send: client cannot spoof the sender field', async () => {
  const a = await makeUser(request), b = await makeUser(request), c = await makeUser(request);
  const res = await request.post('/message/sendMessage').set(a.auth).send({ reciever: b.id, content: 'x', sender: c.id });
  assert.equal(res.status, 400);
  assert.equal(await messageModel.countDocuments(), 0);
});
test('inbox hides the sender; outbox shows recipient name only (no email/phone)', async () => {
  const a = await makeUser(request), b = await makeUser(request);
  await send(a, b.id, 'secret hello');
  const inbox = await request.get('/message/getMessages?flag=inbox').set(b.auth);
  assert.equal(inbox.body.message.length, 1);
  assert.equal(inbox.body.message[0].sender, undefined);
  const detail = await request.get(`/message/getMessage/${inbox.body.message[0]._id}`).set(b.auth);
  assert.equal(detail.body.message.sender, undefined);
  const outbox = await request.get('/message/getMessages?flag=outbox').set(a.auth);
  assert.equal(outbox.body.message[0].reciever.userName, b.userName);
  assert.equal(outbox.body.message[0].reciever.email, undefined);
  assert.equal((await request.get('/message/getMessages?flag=inbox').set(a.auth)).body.message.length, 0);
});
test('getMessages: invalid or missing flag -> VALIDATION_ERROR', async () => {
  const a = await makeUser(request);
  assert.equal((await request.get('/message/getMessages?flag=all').set(a.auth)).body.code, 'VALIDATION_ERROR');
  assert.equal((await request.get('/message/getMessages').set(a.auth)).body.code, 'VALIDATION_ERROR');
});
test('IDOR: a third user cannot read or delete someone else\'s message', async () => {
  const a = await makeUser(request), b = await makeUser(request), c = await makeUser(request);
  await send(a, b.id, 'private');
  const id = String((await messageModel.findOne())._id);
  expectError(await request.get(`/message/getMessage/${id}`).set(c.auth), 'MESSAGE_NOT_FOUND');
  expectError(await request.delete(`/message/deleteMessage/${id}`).set(c.auth), 'MESSAGE_NOT_FOUND');
  assert.equal(await messageModel.countDocuments(), 1);
  assert.equal((await request.get(`/message/getMessage/${id}`).set(a.auth)).status, 200);
});
test('delete: participant deletes; second delete and malformed id -> MESSAGE_NOT_FOUND', async () => {
  const a = await makeUser(request), b = await makeUser(request);
  await send(a, b.id, 'bye');
  const id = String((await messageModel.findOne())._id);
  assert.equal((await request.delete(`/message/deleteMessage/${id}`).set(b.auth)).status, 200);
  assert.equal(await messageModel.countDocuments(), 0);
  expectError(await request.delete(`/message/deleteMessage/${id}`).set(b.auth), 'MESSAGE_NOT_FOUND');
  expectError(await request.get('/message/getMessage/xyz').set(b.auth), 'MESSAGE_NOT_FOUND');
});

// ───────────────────────── Profiles ─────────────────────────
test('public profile: returns only id/userName/image; unknown or malformed id -> USER_NOT_FOUND', async () => {
  const a = await makeUser(request), b = await makeUser(request);
  const res = await request.get(`/user/profile/${b.id}`).set(a.auth);
  assert.equal(res.status, 200);
  assert.deepEqual(Object.keys(res.body.user).sort(), ['_id', 'userName']);
  expectError(await request.get('/user/profile/507f1f77bcf86cd799439011').set(a.auth), 'USER_NOT_FOUND');
  expectError(await request.get('/user/profile/not-an-id').set(a.auth), 'USER_NOT_FOUND');
});
test('updateProfile: name change ok; email taken -> EMAIL_EXISTS; email change without SMTP -> 503 and email untouched', async () => {
  const a = await makeUser(request), b = await makeUser(request);
  const ok = await request.patch('/user/updateProfile').set(a.auth).send({ email: a.email, userName: 'newname' });
  assert.equal(ok.status, 200);
  assert.equal(ok.body.updatedUser.userName, 'newname');
  expectError(await request.patch('/user/updateProfile').set(a.auth).send({ email: b.email, userName: 'newname' }), 'EMAIL_EXISTS');
  expectError(await request.patch('/user/updateProfile').set(a.auth).send({ email: 'fresh@example.com', userName: 'newname' }), 'EMAIL_SERVICE_UNAVAILABLE');
  assert.equal((await userModel.findById(a.id)).email, a.email);
});
test('changePassword: wrong current -> 400 CURRENT_PASSWORD_WRONG (not a session error); same password rejected', async () => {
  const a = await makeUser(request);
  expectError(await request.patch('/user/changePassword').set(a.auth).send({ currentPassword: 'nope-nope-1', newPassword: 'Another!Pass-2', confirmPassword: 'Another!Pass-2' }), 'CURRENT_PASSWORD_WRONG');
  expectError(await request.patch('/user/changePassword').set(a.auth).send({ currentPassword: PASSWORD, newPassword: PASSWORD, confirmPassword: PASSWORD }), 'PASSWORD_SAME_AS_OLD');
  expectError(await request.patch('/user/changePassword').set(a.auth).send({ currentPassword: PASSWORD, newPassword: 'Another!Pass-2', confirmPassword: 'x' }), 'PASSWORD_MISMATCH');
});
test('changePassword: success invalidates old tokens and new password works', async () => {
  const a = await makeUser(request);
  const res = await request.patch('/user/changePassword').set(a.auth).send({ currentPassword: PASSWORD, newPassword: 'Another!Pass-2', confirmPassword: 'Another!Pass-2' });
  assert.equal(res.status, 200);
  expectError(await request.get('/user/getUser').set(a.auth), 'TOKEN_INVALID');
  assert.equal((await request.post('/auth/login').send({ email: a.email, password: 'Another!Pass-2' })).status, 200);
  expectError(await request.post('/auth/login').send({ email: a.email, password: PASSWORD }), 'INVALID_CREDENTIALS');
});

// ───────────────────────── Activation / password reset ─────────────────────────
test('activation: valid token activates; invalid, expired and wrong-purpose tokens -> ACTIVATION_LINK_INVALID', async () => {
  const a = await makeUser(request);
  const good = jwt.sign({ email: a.email, purpose: 'activation' }, process.env.email_token, { expiresIn: '1h' });
  assert.equal((await request.get(`/auth/activate_account/${good}`)).status, 200);
  assert.equal((await userModel.findById(a.id)).confirmEmail, true);
  expectError(await request.get('/auth/activate_account/garbage'), 'ACTIVATION_LINK_INVALID');
  const expired = jwt.sign({ email: a.email, purpose: 'activation' }, process.env.email_token, { expiresIn: -5 });
  expectError(await request.get(`/auth/activate_account/${expired}`), 'ACTIVATION_LINK_INVALID');
  const reset = jwt.sign({ email: a.email, purpose: 'password-reset', tokenVersion: 0 }, process.env.email_token);
  expectError(await request.get(`/auth/activate_account/${reset}`), 'ACTIVATION_LINK_INVALID');
  const legacy = jwt.sign({ email: a.email }, process.env.email_token);
  expectError(await request.get(`/auth/activate_account/${legacy}`), 'ACTIVATION_LINK_INVALID');
});
test('password reset: works once, token reuse and wrong-purpose tokens -> RESET_LINK_INVALID', async () => {
  const a = await makeUser(request);
  const token = jwt.sign({ email: a.email, purpose: 'password-reset', tokenVersion: 0 }, process.env.email_token, { expiresIn: '15m' });
  const body = { newPassword: 'Brand!New-Pass3', confirmPassword: 'Brand!New-Pass3' };
  assert.equal((await request.post(`/auth/reset-password/${token}`).send(body)).status, 200);
  expectError(await request.post(`/auth/reset-password/${token}`).send(body), 'RESET_LINK_INVALID');
  expectError(await request.post('/auth/reset-password/garbage').send(body), 'RESET_LINK_INVALID');
  const activation = jwt.sign({ email: a.email, purpose: 'activation' }, process.env.email_token);
  expectError(await request.post(`/auth/reset-password/${activation}`).send(body), 'RESET_LINK_INVALID');
  expectError(await request.get('/user/getUser').set(a.auth), 'TOKEN_INVALID');
  assert.equal((await request.post('/auth/login').send({ email: a.email, password: 'Brand!New-Pass3' })).status, 200);
});
test('forgot-password: SMTP missing -> 503 EMAIL_SERVICE_UNAVAILABLE; known and unknown emails get identical responses when SMTP fails', async () => {
  const a = await makeUser(request);
  expectError(await request.post('/auth/forgot-password').send({ email: a.email }), 'EMAIL_SERVICE_UNAVAILABLE');
  Object.assign(process.env, { SMTP_HOST: '127.0.0.1', SMTP_PORT: '1', SMTP_USER: 'u', SMTP_PASS: 'p' });
  try {
    const known = await request.post('/auth/forgot-password').send({ email: a.email });
    const unknown = await request.post('/auth/forgot-password').send({ email: 'ghost@example.com' });
    assert.equal(known.status, 200);
    assert.deepEqual(known.body, unknown.body);
  } finally { for (const k of ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS']) delete process.env[k]; }
});

// ───────────────────────── Upload ─────────────────────────
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64');
test('upload: valid PNG stored; non-image, spoofed mimetype, missing file, oversized -> coded errors', async () => {
  const a = await makeUser(request);
  const ok = await request.post('/user/upload').set(a.auth).attach('image', PNG, { filename: 'a.png', contentType: 'image/png' });
  assert.equal(ok.status, 200);
  const stored = `uploads/${ok.body.image.split('/').pop()}`;
  assert.ok(fs.existsSync(stored));
  fs.unlinkSync(stored);
  expectError(await request.post('/user/upload').set(a.auth).attach('image', Buffer.from('hello'), { filename: 'a.txt', contentType: 'text/plain' }), 'IMAGE_INVALID');
  const before = fs.readdirSync('uploads').length;
  expectError(await request.post('/user/upload').set(a.auth).attach('image', Buffer.from('<script>alert(1)</script>'), { filename: 'a.png', contentType: 'image/png' }), 'IMAGE_INVALID');
  assert.equal(fs.readdirSync('uploads').length, before, 'rejected upload must be deleted from disk');
  expectError(await request.post('/user/upload').set(a.auth), 'IMAGE_REQUIRED');
  expectError(await request.post('/user/upload').set(a.auth).attach('image', Buffer.alloc(5 * 1024 * 1024 + 10), { filename: 'big.png', contentType: 'image/png' }), 'IMAGE_TOO_LARGE');
});

// ───────────────────────── Platform behaviour ─────────────────────────
test('unknown route -> 404 ROUTE_NOT_FOUND', async () => expectError(await request.get('/nope'), 'ROUTE_NOT_FOUND'));
test('malformed JSON -> 400 INVALID_JSON without leaking parser details; oversized body -> 413', async () => {
  const bad = await request.post('/auth/login').set('Content-Type', 'application/json').send('{"email": ');
  expectError(bad, 'INVALID_JSON');
  assert.doesNotMatch(JSON.stringify(bad.body), /Unexpected|JSON at position/);
  const big = await request.post('/auth/login').send({ email: 'a@b.co', password: 'x'.repeat(200_000) });
  expectError(big, 'PAYLOAD_TOO_LARGE');
});
test('unexpected exceptions return a generic coded 500 and never leak internals', async () => {
  const original = userModel.findOne;
  userModel.findOne = () => { throw new Error('boom /etc/secret.txt password=hunter2 at Object.<anonymous> (/srv/app.js:1:1)'); };
  try {
    const res = await request.post('/auth/login').send({ email: 'a@example.com', password: 'whatever1' });
    expectError(res, 'INTERNAL_ERROR');
    assert.doesNotMatch(JSON.stringify(res.body), /secret|hunter2|boom|srv/);
  } finally { userModel.findOne = original; }
});
test('database outage maps to 503 SERVICE_UNAVAILABLE', async () => {
  const original = userModel.findOne;
  userModel.findOne = () => { const e = new Error('connect ECONNREFUSED 10.0.0.5:27017'); e.name = 'MongoNetworkError'; throw e; };
  try { expectError(await request.post('/auth/login').send({ email: 'a@example.com', password: 'whatever1' }), 'SERVICE_UNAVAILABLE'); }
  finally { userModel.findOne = original; }
});
test('security headers present and X-Powered-By removed', async () => {
  const res = await request.get('/health');
  assert.equal(res.headers['x-content-type-options'], 'nosniff');
  assert.equal(res.headers['x-frame-options'], 'DENY');
  assert.equal(res.headers['referrer-policy'], 'no-referrer');
  assert.equal(res.headers['x-powered-by'], undefined);
});
test('CORS: allowed origin echoed, foreign origin gets no CORS headers', async () => {
  const ok = await request.options('/auth/login').set('Origin', 'http://localhost:5173');
  assert.equal(ok.status, 204);
  assert.equal(ok.headers['access-control-allow-origin'], 'http://localhost:5173');
  const evil = await request.get('/health').set('Origin', 'https://evil.example');
  assert.equal(evil.headers['access-control-allow-origin'], undefined);
});
test('health reports database connectivity', async () => {
  const res = await request.get('/health');
  assert.equal(res.status, 200);
  assert.equal(res.body.database, 'connected');
});

// ───────────────────────── Rate limiting ─────────────────────────
test('rate limiting: login and message sending are throttled with 429 RATE_LIMITED + Retry-After', async () => {
  const limited = supertest(createApp({ limits: { login: { max: 3 }, send: { max: 2 } } }));
  const u = await makeUser(limited);
  const b = await makeUser(limited);
  // makeUser consumed 1 login hit; two more bad attempts reach the cap.
  await limited.post('/auth/login').send({ email: u.email, password: 'bad-password' });
  await limited.post('/auth/login').send({ email: u.email, password: 'bad-password' });
  const blocked = await limited.post('/auth/login').send({ email: u.email, password: PASSWORD });
  expectError(blocked, 'RATE_LIMITED');
  assert.ok(Number(blocked.headers['retry-after']) > 0);
  await send2(limited, u, b.id); await send2(limited, u, b.id);
  expectError(await send2(limited, u, b.id), 'RATE_LIMITED');
  assert.equal(await messageModel.countDocuments(), 2);
});
const send2 = (app, u, id) => app.post('/message/sendMessage').set(u.auth).send({ reciever: id, content: 'hi' });
