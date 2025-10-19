import mongoose, { Schema, model, models } from 'mongoose';

const PendingOrderItemSchema = new Schema({
  productId: String,
  productName: String,
  quantity: Number,
  price: Number
}, { _id: false });

const PendingOrderSchema = new Schema({
  id: { type: String, required: true },
  date: String,
  customerName: String,
  customerPhone: String,
  customerEmail: String,
  items: [PendingOrderItemSchema],
  total: Number,
  storeId: String
}, { timestamps: true });

export const PendingOrder = models.PendingOrder || model('PendingOrder', PendingOrderSchema);
