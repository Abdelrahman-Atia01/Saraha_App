import jwt from 'jsonwebtoken';
import { userModel } from '../DB/models/user.model.js';
import ApiError from '../utils/ApiError.js';

export const authMiddle = async (req, _res, next) => {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : header;
    if (!token) throw new ApiError('AUTH_REQUIRED');
    let payload;
    try { payload = jwt.verify(token, process.env.token_user_key, { algorithms: ['HS256'] }); }
    catch (e) { throw new ApiError(e?.name === 'TokenExpiredError' ? 'TOKEN_EXPIRED' : 'TOKEN_INVALID'); }
    const user = await userModel.findById(payload.id).select('-password -__v +tokenVersion');
    if (!user || (user.tokenVersion || 0) !== (payload.tokenVersion || 0)) throw new ApiError('TOKEN_INVALID');
    req.user = user;
    next();
  } catch (err) { next(err); }
};
