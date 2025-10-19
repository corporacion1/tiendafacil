import mongoose, { Schema, model, models } from 'mongoose';

const WarehouseSchema = new Schema({
  id: { type: String, required: true },
  name: String,
  storeId: String
}, { timestamps: true });

export const Warehouse = models.Warehouse || model('Warehouse', WarehouseSchema);
