import 'dotenv/config';
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import DB_Connection from './src/DB/DB_Connection.js';
import { createApp } from './src/app.js';
import { userModel } from './src/DB/models/user.model.js';

for (const key of ['token_user_key', 'email_token', 'phone_private_key']) {
  if (!process.env[key] || process.env[key].startsWith('replace_with_')) throw new Error(`${key} must be configured before starting Saraha.`);
}

const app = createApp();
const allowedOrigins = app.get('allowedOrigins');

const server = app.listen(Number(process.env.PORT) || 5000, async () => {
  console.log(`Saraha API listening on port ${Number(process.env.PORT) || 5000}`);
  try { await DB_Connection(); } catch (e) { console.error(`Database connection failed (${e?.name}); verify MONGO_URI and MongoDB availability.`); }
});
const io = new Server(server, { cors: { origin: allowedOrigins, methods: ['GET', 'POST'] } });
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('Authentication required'));
    const { id, tokenVersion = 0, exp } = jwt.verify(token, process.env.token_user_key, { algorithms: ['HS256'] });
    const user = await userModel.findById(id).select('_id +tokenVersion');
    if (!user || (user.tokenVersion || 0) !== tokenVersion) return next(new Error('Invalid session'));
    socket.userId = String(user._id);
    if (exp) socket.expiryTimer = setTimeout(() => socket.disconnect(true), Math.max(0, exp * 1000 - Date.now()));
    next();
  } catch { next(new Error('Invalid session')); }
});
io.on('connection', socket => {
  socket.join(`user:${socket.userId}`);
  socket.on('disconnect', () => clearTimeout(socket.expiryTimer));
});
app.set('io', io);

const shutdown = async () => { server.close(); const mongoose = await import('mongoose'); await mongoose.default.disconnect(); process.exit(0); };
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
