import { userModel } from '../../DB/models/user.model.js';
import bcrypt from 'bcrypt';
import ApiError from '../../utils/ApiError.js';
import { logError } from '../../utils/logger.js';
import jwt from 'jsonwebtoken';
import sendEmail, { subject } from '../../utils/sendingEmail.js';
import { sendEmail_templete } from '../../utils/sendEmail_templete.js';
import { readFile, unlink } from 'node:fs/promises';
import path from 'node:path';
import { frontendBaseUrl } from '../../utils/frontendUrl.js';
import { decryptPhone } from '../Auth/Auth.controller.js';
const present = user => { const out = user.toObject ? user.toObject() : { ...user }; delete out.password; delete out.tokenVersion; out.phone = decryptPhone(out.phone); return out; };
export const getUser = async (req, res) => res.json({ message: 'get user success', user: present(req.user) });
export const getPublicProfile = async (req, res, next) => {
  try {
    const user = await userModel.findById(req.validated.userId).select('userName image');
    if (!user) throw new ApiError('USER_NOT_FOUND');
    return res.json({ message: 'get profile success', user: { _id: user._id, userName: user.userName, image: user.image } });
  } catch (err) { return next(err); }
};
export const updateProfile = async (req, res, next) => {
  try {
    const { email: normalizedEmail, userName } = req.validated;
    if (await userModel.exists({ email: normalizedEmail, _id: { $ne: req.user._id } })) throw new ApiError('EMAIL_EXISTS');
    const emailChanged = normalizedEmail !== req.user.email;
    if (emailChanged) {
      if (!process.env.email_token || !process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) throw new ApiError('EMAIL_SERVICE_UNAVAILABLE');
      const token = jwt.sign({ email: normalizedEmail, purpose: 'activation' }, process.env.email_token, { expiresIn: '24h' });
      const link = `${frontendBaseUrl()}/activate/${encodeURIComponent(token)}`;
      try { await sendEmail(normalizedEmail, subject.register, sendEmail_templete(link)); }
      catch (e) { logError(e); throw new ApiError('EMAIL_SEND_FAILED'); }
    }
    const update = { email: normalizedEmail, userName };
    if (emailChanged) update.confirmEmail = false;
    await userModel.updateOne({ _id: req.user._id }, update, { runValidators: true });
    const updatedUser = await userModel.findById(req.user._id).select('-password -__v');
    return res.json({ message: 'user updated successfully', updatedUser: present(updatedUser) });
  } catch (err) { return next(err); }
};
export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.validated;
    const user = await userModel.findById(req.user._id).select('+password +tokenVersion');
    if (!user || !(await bcrypt.compare(currentPassword, user.password))) throw new ApiError('CURRENT_PASSWORD_WRONG');
    user.password = await bcrypt.hash(newPassword, Number(process.env.salt_rounds_password) || 12);
    user.tokenVersion = (user.tokenVersion || 0) + 1;
    await user.save();
    req.app.get('io')?.in(`user:${user._id}`).disconnectSockets(true);
    return res.json({ message: 'user password changed successfully' });
  } catch (err) { return next(err); }
};
export const uploadImage = async (req, res, next) => {
  try {
    if (!req.file) throw new ApiError('IMAGE_REQUIRED');
    const bytes = await readFile(req.file.path);
    const isJpeg = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
    const isPng = bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
    const isGif = ['GIF87a', 'GIF89a'].includes(bytes.subarray(0, 6).toString('ascii'));
    const isWebp = bytes.subarray(0, 4).toString('ascii') === 'RIFF' && bytes.subarray(8, 12).toString('ascii') === 'WEBP';
    if (!(isJpeg || isPng || isGif || isWebp)) {
      await unlink(req.file.path).catch(() => {});
      throw new ApiError('IMAGE_INVALID');
    }
    const oldImage = req.user.image;
    req.user.image = `/uploads/${req.file.filename}`;
    await req.user.save();
    if (oldImage?.startsWith('/uploads/')) {
      const oldPath = path.join(process.cwd(), 'uploads', path.basename(oldImage));
      await unlink(oldPath).catch(() => {});
    }
    return res.json({ message: 'file uploaded successfully', image: req.user.image });
  } catch (err) {
    if (req.file?.path) await unlink(req.file.path).catch(() => {});
    return next(err);
  }
};
