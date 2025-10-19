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
  createdAt: String
}, { timestamps: true });

export const Ad = models.Ad || model('Ad', AdSchema);
