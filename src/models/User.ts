import mongoose, { Schema, model, models } from 'mongoose';

const UserSchema = new Schema({
  uid: { type: String, required: true },
  email: { type: String, required: true },
  password: { type: String, required: true },
  displayName: String,
  photoURL: String,
  role: { type: String, default: 'user' },
  status: { type: String, default: 'active' },
  storeId: String,
  storeRequest: { type: Boolean, default: false },
  createdAt: String,
  phone: String
}, { timestamps: true });

export const User = models.User || model('User', UserSchema);
