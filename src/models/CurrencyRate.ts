import mongoose, { Schema, model, models } from 'mongoose';

const CurrencyRateSchema = new Schema({
  id: { type: String, required: true },
  rate: { type: Number, required: true },
  date: { type: String },
  storeId: { type: String, required: true },
  createdBy: { type: String, default: 'system' },
  active: { type: Boolean, default: true }
}, { timestamps: true });

export const CurrencyRate = models.CurrencyRate || model('CurrencyRate', CurrencyRateSchema);
