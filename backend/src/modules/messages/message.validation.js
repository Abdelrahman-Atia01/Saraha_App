import Joi from 'joi';
import { Types } from 'mongoose';
const objectId = Joi.string().custom((v, h) => Types.ObjectId.isValid(v) ? v : h.error('any.invalid'));
export const flags = { inbox: 'inbox', outbox: 'outbox' };
export const createMessageSchema = Joi.object({ content: Joi.string().trim().min(1).max(500).required(), reciever: objectId.required() }).required();
export const getMessageSchema = Joi.object({ messageId: objectId.required() }).required();
export const AllMessagesSchema = Joi.object({ flag: Joi.string().valid(...Object.values(flags)).required() }).required();
