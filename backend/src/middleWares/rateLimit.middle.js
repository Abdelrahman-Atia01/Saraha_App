import ApiError from '../utils/ApiError.js';

/** Small fixed-window in-memory limiter (single-instance). Use a shared store if you scale horizontally. */
export const rateLimit = ({ windowMs, max, key = (req) => req.ip }) => {
  const hits = new Map();
  setInterval(() => { const now = Date.now(); for (const [k, v] of hits) if (v.reset <= now) hits.delete(k); }, windowMs).unref();
  return (req, res, next) => {
    const now = Date.now();
    const k = String(key(req));
    let entry = hits.get(k);
    if (!entry || entry.reset <= now) { entry = { count: 0, reset: now + windowMs }; hits.set(k, entry); }
    if (++entry.count > max) {
      res.setHeader('Retry-After', Math.ceil((entry.reset - now) / 1000));
      return next(new ApiError('RATE_LIMITED'));
    }
    next();
  };
};
export const passthrough = (_req, _res, next) => next();
