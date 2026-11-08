import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import CryptoJS from 'crypto-js';
import { userModel } from '../../DB/models/user.model.js';
import ApiError from '../../utils/ApiError.js';
import { logError } from '../../utils/logger.js';
import sendEmail, { subject } from '../../utils/sendingEmail.js';
import { sendEmail_templete } from '../../utils/sendEmail_templete.js';
import { acctivateSuccess } from '../../utils/activatesuccess.js';
import { frontendBaseUrl } from '../../utils/frontendUrl.js';

const rounds = () => Number(process.env.salt_rounds_password) || 12;
// A phone that cannot be decrypted (rotated key, corrupted value) must not break login or profile loading.
export const decryptPhone = (value) => {
  if (!value) return '';
  try { return CryptoJS.AES.decrypt(value, process.env.phone_private_key).toString(CryptoJS.enc.Utf8); } catch { return ''; }
};
const safeUser = (user) => ({ _id: user._id, userName: user.userName, email: user.email, confirmEmail: user.confirmEmail, role: user.role, createdAt: user.createdAt, phone: decryptPhone(user.phone) });
// Used when the email is unknown so that response time does not reveal whether an account exists.
const DUMMY_HASH = bcrypt.hashSync('saraha-dummy-password', 4);
const smtpConfigured = () => !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);

export const register = async (req, res, next) => {
  try {
    const { userName, email, password, phone } = req.validated;
    if (await userModel.exists({ email })) throw new ApiError('EMAIL_EXISTS');
    const hashed = await bcrypt.hash(password, rounds());
    const encryptedPhone = CryptoJS.AES.encrypt(phone, process.env.phone_private_key).toString();
    const user = await userModel.create({ userName, email, password: hashed, phone: encryptedPhone });
    if (process.env.email_token && smtpConfigured()) {
      const token = jwt.sign({ email: user.email, purpose: 'activation' }, process.env.email_token, { expiresIn: '24h' });
      const link = `${frontendBaseUrl()}/activate/${encodeURIComponent(token)}`;
      try { await sendEmail(user.email, subject.register, sendEmail_templete(link)); }
      catch (e) { logError(e); }
    }
    return res.status(201).json({ message: 'User created successfully', user: safeUser(user) });
  } catch (err) { return next(err); }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.validated;
    const user = await userModel.findOne({ email }).select('+password +tokenVersion');
    const ok = await bcrypt.compare(password, user ? user.password : DUMMY_HASH);
    if (!user || !ok) throw new ApiError('INVALID_CREDENTIALS');
    const Token = jwt.sign({ id: user._id, tokenVersion: user.tokenVersion || 0 }, process.env.token_user_key, { expiresIn: '1h', algorithm: 'HS256' });
    return res.json({ message: 'login success', Token, user: safeUser(user) });
  } catch (err) { return next(err); }
};

export const activate_account = async (req, res, next) => {
  try {
    if (!process.env.email_token) throw new ApiError('EMAIL_SERVICE_UNAVAILABLE');
    let payload;
    try { payload = jwt.verify(req.params.emailToken, process.env.email_token, { algorithms: ['HS256'] }); }
    catch { throw new ApiError('ACTIVATION_LINK_INVALID'); }
    if (payload.purpose !== 'activation' || !payload.email) throw new ApiError('ACTIVATION_LINK_INVALID');
    const { matchedCount } = await userModel.updateOne({ email: payload.email }, { confirmEmail: true });
    if (!matchedCount) throw new ApiError('USER_NOT_FOUND');
    return res.status(200).send(acctivateSuccess());
  } catch (err) { return next(err); }
};

export const forgotPassword = async (req, res, next) => {
  try {
    if (!process.env.email_token || !smtpConfigured()) throw new ApiError('EMAIL_SERVICE_UNAVAILABLE');
    const { email } = req.validated;
    const user = await userModel.findOne({ email }).select('+tokenVersion');
    // Identical response for known and unknown accounts (no account enumeration); delivery failures are only logged.
    if (user) {
      const token = jwt.sign({ email, purpose: 'password-reset', tokenVersion: user.tokenVersion || 0 }, process.env.email_token, { expiresIn: '15m' });
      const link = `${frontendBaseUrl()}/reset-password/${encodeURIComponent(token)}`;
      try { await sendEmail(email, subject.reset, `<p>لإعادة تعيين كلمة المرور، افتح الرابط التالي خلال 15 دقيقة:</p><p><a href="${link}">إعادة تعيين كلمة المرور</a></p>`); }
      catch (e) { logError(e); }
    }
    return res.json({ message: 'إذا كان الإيميل مسجل، هتوصلك رسالة لاستعادة كلمة السر.' });
  } catch (err) { return next(err); }
};

export const resetPassword = async (req, res, next) => {
  try {
    if (!process.env.email_token) throw new ApiError('EMAIL_SERVICE_UNAVAILABLE');
    let payload;
    try { payload = jwt.verify(req.params.resetToken, process.env.email_token, { algorithms: ['HS256'] }); }
    catch { throw new ApiError('RESET_LINK_INVALID'); }
    if (payload.purpose !== 'password-reset' || !payload.email) throw new ApiError('RESET_LINK_INVALID');
    const user = await userModel.findOne({ email: payload.email }).select('+password +tokenVersion');
    if (!user || (user.tokenVersion || 0) !== (payload.tokenVersion || 0)) throw new ApiError('RESET_LINK_INVALID');
    user.password = await bcrypt.hash(req.validated.newPassword, rounds());
    user.tokenVersion = (user.tokenVersion || 0) + 1;
    await user.save();
    req.app.get('io')?.in(`user:${user._id}`).disconnectSockets(true);
    return res.json({ message: 'Password reset successfully' });
  } catch (err) { return next(err); }
};
