import { messageModel } from '../../DB/models/message.model.js';
import { userModel } from '../../DB/models/user.model.js';
import ApiError from '../../utils/ApiError.js';
export const createMessage = async (req, res, next) => {
  try {
    const { reciever: receiverId, content } = req.validated;
    if (String(req.user._id) === String(receiverId)) throw new ApiError('SELF_MESSAGE');
    if (!await userModel.exists({ _id: receiverId })) throw new ApiError('USER_NOT_FOUND');
    const message = await messageModel.create({ content, sender: req.user._id, reciever: receiverId });
    req.app.get('io')?.to(`user:${receiverId}`).emit('message:new', { messageId: String(message._id) });
    req.app.get('io')?.to(`user:${req.user._id}`).emit('message:sent', { messageId: String(message._id) });
    return res.status(201).json({ result: 'message Added Successfully', message });
  } catch (err) { return next(err); }
};
export const getMessage = async (req, res, next) => {
  try {
    const message = await messageModel.findOne({ _id: req.validated.messageId, $or: [{ sender: req.user._id }, { reciever: req.user._id }] });
    if (!message) throw new ApiError('MESSAGE_NOT_FOUND');
    if (String(message.sender) === String(req.user._id)) await message.populate({ path: 'reciever', select: 'userName' });
    else message.set('sender', undefined, { strict: false });
    return res.json({ result: 'get message successfully', message });
  } catch (err) { return next(err); }
};
export const getAllMessages = async (req, res, next) => {
  try {
    const { flag } = req.validated;
    const filter = flag === 'inbox' ? { reciever: req.user._id } : { sender: req.user._id };
    let query = messageModel.find(filter).sort({ createdAt: -1 }).limit(200);
    if (flag === 'outbox') query = query.populate({ path: 'reciever', select: 'userName' });
    const messages = await query;
    const safeMessages = messages.map(message => {
      const item = message.toObject();
      if (flag === 'inbox') delete item.sender;
      return item;
    });
    return res.json({ result: 'get all messages successfully', message: safeMessages });
  } catch (err) { return next(err); }
};
export const deleteMessage = async (req, res, next) => {
  try {
    const message = await messageModel.findOneAndDelete({ _id: req.validated.messageId, $or: [{ sender: req.user._id }, { reciever: req.user._id }] });
    if (!message) throw new ApiError('MESSAGE_NOT_FOUND');
    const io = req.app.get('io');
    const payload = { messageId: String(message._id) };
    io?.to(`user:${message.sender}`).emit('message:deleted', payload);
    io?.to(`user:${message.reciever}`).emit('message:deleted', payload);
    return res.json({ message: 'message deleted successfully' });
  } catch (err) { return next(err); }
};
