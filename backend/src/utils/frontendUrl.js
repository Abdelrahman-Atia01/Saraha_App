export const frontendBaseUrl = () => {
  const configured = process.env.FRONTEND_URL || process.env.FRONTEND_ORIGIN || 'http://localhost:5173';
  return configured.split(',')[0].trim().replace(/\/+$/, '');
};
