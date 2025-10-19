import mongoose, { Schema, model, models } from 'mongoose';

const UnitSchema = new Schema({
  id: { type: String, required: true },
  name: String,
  storeId: String
}, { timestamps: true });

export const Unit = models.Unit || model('Unit', UnitSchema);
