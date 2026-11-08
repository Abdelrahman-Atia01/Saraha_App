import mongoose, { Schema } from 'mongoose';
const userSchema = new Schema({
  userName: { type: String, required: true, trim: true, minlength: 3, maxlength: 20, lowercase: true },
  email: { type: String, required: true, trim: true, lowercase: true, unique: true, match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
  confirmEmail: { type: Boolean, default: false },
  password: { type: String, required: true, select: false },
  gender: { type: String, enum: ['male', 'female', 'not specified'], default: 'not specified' },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  tokenVersion: { type: Number, default: 0, select: false },
  BOD: String, adress: String, phone: String, image: String,
}, { timestamps: true });
export const userModel = mongoose.models.User || mongoose.model('User', userSchema);
