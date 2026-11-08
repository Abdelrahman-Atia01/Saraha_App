import { Router } from 'express';
import * as AUC from './Auth.controller.js';
import * as USC from './Auth.validation.js';
import validation from '../../middleWares/validation.middle.js';
export default function authRouter(limits) {
  const router = Router();
  router.post('/register', limits.register, validation(USC.registerSchema), AUC.register);
  router.post('/login', limits.login, validation(USC.loginSchema), AUC.login);
  router.post('/forgot-password', limits.recovery, validation(USC.forgotPasswordSchema), AUC.forgotPassword);
  router.post('/reset-password/:resetToken', limits.recovery, validation(USC.resetPasswordSchema), AUC.resetPassword);
  router.get('/activate_account/:emailToken', limits.recovery, AUC.activate_account);
  return router;
}
