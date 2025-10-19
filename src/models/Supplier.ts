import mongoose, { Schema, model, models } from 'mongoose';

const SupplierSchema = new Schema({
  id: { type: String, required: true },
  name: String,
  phone: String,
  address: String,
  storeId: String
}, { timestamps: true });

export const Supplier = models.Supplier || model('Supplier', SupplierSchema);
