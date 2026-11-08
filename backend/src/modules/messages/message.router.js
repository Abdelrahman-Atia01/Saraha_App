import { Router } from 'express';
import * as MEC from './message.controller.js';
import * as MEVA from './message.validation.js';
import validation from '../../middleWares/validation.middle.js';
import { authMiddle } from '../../middleWares/auth.middle.js';
export default function messageRouter(limits) {
  const router = Router();
  router.use(authMiddle);
  router.post('/sendMessage', limits.send, validation(MEVA.createMessageSchema), MEC.createMessage);
  router.get('/getMessages', validation(MEVA.AllMessagesSchema), MEC.getAllMessages);
  router.get('/getMessage/:messageId', validation(MEVA.getMessageSchema), MEC.getMessage);
  router.delete('/deleteMessage/:messageId', validation(MEVA.getMessageSchema), MEC.deleteMessage);
  return router;
}
