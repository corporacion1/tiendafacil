import mongoose, { Schema, model, models } from 'mongoose';

// Esquema para imágenes individuales
const ProductImageSchema = new Schema({
  id: { type: String, required: true },
  url: { type: String, required: true },
  thumbnailUrl: String,
  alt: String,
  order: { type: Number, required: true },
  uploadedAt: { type: String, required: true },
  size: Number,
  dimensions: {
    width: Number,
    height: Number
  },
  // DEPRECATED: Path en Supabase (legacy). Se mantiene en el modelo por compatibilidad
  // con datos antiguos. No se utiliza para nuevas cargas; las imágenes ahora se
  // guardan en MongoDB GridFS y se referencian via `/api/images/:id`.
  supabasePath: String
}, { _id: false });

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
  imageUrl: String, // Mantener para compatibilidad
  imageHint: String, // Mantener para compatibilidad
  createdAt: String,
  
  // Nuevos campos para múltiples imágenes
  images: [ProductImageSchema],
  primaryImageIndex: { type: Number, default: 0 },
  
  // Campos para tipo de producto
  type: { type: String, enum: ['product', 'service'], default: 'product' },
  affectsInventory: { type: Boolean, default: true }
}, { timestamps: true });

// Índice único compuesto para prevenir duplicados
ProductSchema.index({ id: 1, storeId: 1 }, { 
  unique: true, 
  background: true
});

export const Product = models.Product || model('Product', ProductSchema);
