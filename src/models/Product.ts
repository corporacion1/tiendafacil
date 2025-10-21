import mongoose, { Schema, model, models } from 'mongoose';

const ProductSchema = new Schema({
  id: { type: String, required: true },
  storeId: { type: String, required: true, index: true },
  name: { type: String, required: true },
  sku: { type: String, required: true },
  stock: Number,
  price: Number,
  wholesalePrice: Number,
  cost: Number,
  status: String,
  tax1: Boolean,
  tax2: Boolean,
  unit: String,
  family: String,
  warehouse: String,
  description: String,
  imageUrl: String,
  imageHint: String,
  createdAt: String
}, { timestamps: true });

// Índice único compuesto para prevenir duplicados
ProductSchema.index({ id: 1, storeId: 1 }, { 
  unique: true, 
  background: true
});

export const Product = models.Product || model('Product', ProductSchema);
