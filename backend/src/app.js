import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import mongoose from 'mongoose';
import authRouter from './modules/Auth/Auth.router.js';
import userRouter from './modules/users/user.router.js';
import messageRouter from './modules/messages/message.router.js';
import { notFound, errorHandler } from './middleWares/error.middle.js';
import { rateLimit, passthrough } from './middleWares/rateLimit.middle.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MIN = 60 * 1000;

// `limits: false` disables rate limiting (used by tests that are not about throttling); an object overrides the defaults.
export function createApp({ limits = {} } = {}) {
  const app = express();
  app.disable('x-powered-by');
  if (process.env.TRUST_PROXY) app.set('trust proxy', process.env.TRUST_PROXY === 'true' ? 1 : process.env.TRUST_PROXY);

  const make = (name, defaults, key) => limits === false ? passthrough : rateLimit({ ...defaults, ...(limits[name] || {}), ...(key ? { key } : {}) });
  const rl = {
    global: make('global', { windowMs: MIN, max: 300 }),
    login: make('login', { windowMs: 15 * MIN, max: 10 }),
    register: make('register', { windowMs: 60 * MIN, max: 10 }),
    recovery: make('recovery', { windowMs: 15 * MIN, max: 10 }),
    password: make('password', { windowMs: 15 * MIN, max: 10 }, (req) => `u:${req.user?._id}`),
    send: make('send', { windowMs: MIN, max: 20 }, (req) => `u:${req.user?._id}`),
  };

  const allowedOrigins = (process.env.FRONTEND_ORIGIN || 'http://localhost:5173,http://localhost:4173').split(',').map((v) => v.trim()).filter(Boolean);
  app.set('allowedOrigins', allowedOrigins);
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
    if (process.env.NODE_ENV === 'production') res.setHeader('Strict-Transport-Security', 'max-age=15552000; includeSubDomains');
    const origin = req.headers.origin;
    if (origin && allowedOrigins.includes(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Vary', 'Origin');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,DELETE,OPTIONS');
      res.setHeader('Access-Control-Max-Age', '600');
    }
    if (req.method === 'OPTIONS') return res.sendStatus(204);
    next();
  });
  app.use(rl.global);
  app.use(express.json({ limit: '100kb' }));
  app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads'), { dotfiles: 'deny', index: false }));
  app.get('/health', (_req, res) => {
    const connected = mongoose.connection.readyState === 1;
    res.status(connected ? 200 : 503).json({ status: connected ? 'ok' : 'degraded', database: connected ? 'connected' : 'disconnected' });
  });
  app.use('/auth', authRouter(rl));
  app.use('/user', userRouter(rl));
  app.use('/message', messageRouter(rl));
  app.use(notFound);
  app.use(errorHandler);
  return app;
}
