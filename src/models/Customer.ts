import mongoose, { Schema, model, models } from 'mongoose';

const CustomerSchema = new Schema({
  id: { type: String, required: true },
  name: String,
  phone: String,
  address: String,
  storeId: String
}, { timestamps: true });

export const Customer = models.Customer || model('Customer', CustomerSchema);
