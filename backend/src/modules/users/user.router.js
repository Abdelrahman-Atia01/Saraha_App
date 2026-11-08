import { Router } from 'express';
import { multerFun } from '../../../services/service.js';
import { authMiddle } from '../../middleWares/auth.middle.js';
import validation from '../../middleWares/validation.middle.js';
import * as USC from './user.controller.js';
import * as USV from './user.validation.js';
export default function userRouter(limits) {
  const router = Router();
  router.use(authMiddle);
  router.get('/getUser', USC.getUser);
  router.get('/profile/:userId', validation(USV.publicProfileSchema), USC.getPublicProfile);
  router.patch('/updateProfile', validation(USV.udateProfileSchema), USC.updateProfile);
  router.patch('/changePassword', limits.password, validation(USV.changePasswordSchema), USC.changePassword);
  router.post('/upload', multerFun().single('image'), USC.uploadImage);
  return router;
}
