import mongoose, { Schema, model, models } from 'mongoose';

const AdSchema = new Schema({
  id: { type: String, required: true },
  sku: String,
  name: String,
  description: String,
  price: Number,
  imageUrl: String,
  imageHint: String,
  views: Number,
  status: String,
  targetBusinessTypes: [String],
  expiryDate: String,
  createdAt: String,
  storeId: { type: String, required: true, index: true }
}, { timestamps: true });

// Índice compuesto para optimización
AdSchema.index({ storeId: 1, status: 1 });

export const Ad = models.Ad || model('Ad', AdSchema);
