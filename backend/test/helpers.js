import crypto from 'node:crypto';
import mongoose from 'mongoose';

// Isolated test database: the host comes from TEST_MONGO_URI, the database name is ALWAYS a fresh random
// "saraha_test_*" name that is dropped afterwards, so production data can never be touched.
export const TEST_HOST = process.env.TEST_MONGO_URI || 'mongodb://127.0.0.1:27017';
const dbName = `saraha_test_${crypto.randomBytes(6).toString('hex')}`;

process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = process.env.LOG_LEVEL || 'silent';
process.env.token_user_key = crypto.randomBytes(32).toString('hex');
process.env.email_token = crypto.randomBytes(32).toString('hex');
process.env.phone_private_key = crypto.randomBytes(32).toString('hex');
process.env.salt_rounds_password = '4';
process.env.FRONTEND_ORIGIN = 'http://localhost:5173';
process.env.FRONTEND_URL = 'http://localhost:5173';
for (const k of ['SMTP_HOST', 'SMTP_USER', 'SMTP_PASS']) delete process.env[k];

export async function connect() {
  await mongoose.connect(`${TEST_HOST.replace(/\/+$/, '')}/${dbName}`, { serverSelectionTimeoutMS: 5000 });
  if (!mongoose.connection.name.startsWith('saraha_test_')) throw new Error('Refusing to run tests against a non-test database');
}
export async function disconnect() {
  if (mongoose.connection.readyState === 1) {
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
  }
}
export const resetDb = async () => { for (const c of Object.values(mongoose.connection.collections)) await c.deleteMany({}); };

export const PASSWORD = 'Str0ng!Pass-1';
let n = 0;
/** Registers + logs in a user through the real API. Returns { id, token, email, userName }. */
export async function makeUser(request, overrides = {}) {
  n += 1;
  const email = overrides.email || `user${n}_${crypto.randomBytes(3).toString('hex')}@example.com`;
  const userName = overrides.userName || `user${n}${crypto.randomBytes(2).toString('hex')}`.slice(0, 20);
  const reg = await request.post('/auth/register').send({ userName, email, password: PASSWORD, confirmPassword: PASSWORD, phone: '+201000000000' });
  if (reg.status !== 201) throw new Error(`register failed: ${reg.status} ${JSON.stringify(reg.body)}`);
  const login = await request.post('/auth/login').send({ email, password: PASSWORD });
  return { id: reg.body.user._id, token: login.body.Token, email, userName, auth: { Authorization: login.body.Token } };
}
