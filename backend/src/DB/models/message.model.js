import mongoose, { Schema } from 'mongoose'

const messageSchema = new Schema({
  content: { type: String, required: true, trim: true, minlength: 1, maxlength: 500 },
  sender: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  reciever: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
}, { timestamps: true })

messageSchema.index({ reciever: 1, createdAt: -1 })
messageSchema.index({ sender: 1, createdAt: -1 })
export const messageModel = mongoose.models.Message || mongoose.model('Message', messageSchema)
