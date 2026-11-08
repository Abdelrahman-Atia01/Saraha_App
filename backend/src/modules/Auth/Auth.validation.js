import Joi from 'joi';
const password = Joi.string().min(8).max(72).required();
export const registerSchema = Joi.object({ userName: Joi.string().trim().min(3).max(20).required(), email: Joi.string().email().lowercase().required(), password, confirmPassword: Joi.string().valid(Joi.ref('password')).required(), phone: Joi.string().trim().min(5).max(25).required() }).required();
export const loginSchema = Joi.object({ email: Joi.string().email().lowercase().required(), password: Joi.string().required() }).required();

export const forgotPasswordSchema = Joi.object({ email: Joi.string().email().lowercase().required() }).required();
export const resetPasswordSchema = Joi.object({ resetToken: Joi.string().required(), newPassword: password, confirmPassword: Joi.string().valid(Joi.ref('newPassword')).required() }).required();
