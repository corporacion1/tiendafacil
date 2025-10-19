import mongoose, { Schema, model, models } from 'mongoose';

const PaymentMethodSchema = new Schema({
  id: { type: String, required: true },
  name: String,
  requiresRef: Boolean,
  storeId: String
}, { timestamps: true });

export const PaymentMethod = models.PaymentMethod || model('PaymentMethod', PaymentMethodSchema);
