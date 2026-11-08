import Joi from 'joi';
export const udateProfileSchema = Joi.object({ email: Joi.string().email().lowercase().required(), userName: Joi.string().trim().min(3).max(20).required() }).required();
export const changePasswordSchema = Joi.object({ currentPassword: Joi.string().required(), newPassword: Joi.string().min(8).max(72).not(Joi.ref('currentPassword')).required(), confirmPassword: Joi.string().valid(Joi.ref('newPassword')).required() }).required();

export const publicProfileSchema = Joi.object({ userId: Joi.string().hex().length(24).required() }).required();
