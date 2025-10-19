// src/models/Setting.ts
import mongoose from 'mongoose';

const SettingSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  address: { type: String },
  phone: { type: String },
  email: { type: String },
  whatsapp: { type: String },
  meta: { type: String },
  slogan: { type: String },
  businessType: { type: String, default: 'retail' },
  currency: { type: String, default: 'USD' },
  tax1: { type: Number, default: 0 },
  tax2: { type: Number, default: 0 },
  logoUrl: { type: String },
  pin: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

export const Setting = mongoose.models.Setting || mongoose.model('Setting', SettingSchema);