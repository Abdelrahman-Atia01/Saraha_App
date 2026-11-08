import nodemailer from 'nodemailer';
const sendEmail = async (to, mailSubject, html) => {
  const { SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASS, SMTP_FROM } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) throw new Error('SMTP is not configured');
  const transporter = nodemailer.createTransport({ host: SMTP_HOST, port: Number(SMTP_PORT) || 587, secure: SMTP_SECURE === 'true', auth: { user: SMTP_USER, pass: SMTP_PASS } });
  const info = await transporter.sendMail({ from: SMTP_FROM || SMTP_USER, to, subject: mailSubject, html });
  return info.rejected.length === 0;
};
export const subject = { register: 'Activate your Saraha account', reset: 'Reset your password' };
export default sendEmail;
