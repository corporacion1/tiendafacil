import mongoose, { Schema, model, models } from 'mongoose';

const BusinessCategorySchema = new Schema({
  name: String,
  storeId: String
}, { timestamps: true });

export const BusinessCategory = models.BusinessCategory || model('BusinessCategory', BusinessCategorySchema);
