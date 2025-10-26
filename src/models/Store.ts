import mongoose, { Schema, model, models } from 'mongoose';

const UserRoleSchema = new Schema({
  uid: { type: String, required: true },
  role: { type: String, required: true }
}, { _id: false });

const StoreSchema = new Schema({
  id: { type: String },
  storeId: { type: String, required: true },
  name: { type: String, required: true, maxlength: 100 },
  ownerIds: { type: [String], default: [] },
  userRoles: { type: [UserRoleSchema], default: [] },
  address: String,
  businessType: String,
  phone: String,
  taxId: String, // Identificación fiscal (RIF, NIT, etc.)
  slogan: String,
  logoUrl: String,
  meta: String,
  primaryCurrencyName: String,
  primaryCurrencySymbol: String,
  secondaryCurrencyName: String,
  secondaryCurrencySymbol: String,
  saleSeries: String,
  saleCorrelative: Number,
  tax1: Number,
  tax2: Number,
  whatsapp: String,
  tiktok: String,
  useDemoData: Boolean,
  status: { type: String, enum: ['active', 'inactive'], default: 'active' }
}, { timestamps: true });

export const Store = models.Store || model('Store', StoreSchema);
