// Technical details stay in server logs only. Request bodies, tokens and passwords are never logged.
export const logError = (err, req) => {
  if (process.env.LOG_LEVEL === 'silent') return;
  const where = req ? `${req.method} ${String(req.originalUrl || '').split('?')[0]}` : '';
  console.error(`[error] ${where} ${err?.name || 'Error'}: ${err?.message || err}${err?.stack ? `\n${err.stack}` : ''}`);
};
