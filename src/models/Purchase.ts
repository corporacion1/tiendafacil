import mongoose, { Schema, model, models } from 'mongoose';

const PurchaseItemSchema = new Schema({
  productId: String,
  productName: String,
  quantity: Number,
  cost: Number
}, { _id: false });

const PurchaseSchema = new Schema({
  id: { type: String, required: true },
  supplierId: String,
  supplierName: String,
  items: [PurchaseItemSchema],
  total: Number,
  date: String,
  documentNumber: String,
  responsible: String,
  storeId: String
}, { timestamps: true });

export const Purchase = models.Purchase || model('Purchase', PurchaseSchema);
