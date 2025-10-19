import mongoose, { Schema, model, models } from 'mongoose';

const FamilySchema = new Schema({
  id: { type: String, required: true },
  name: String,
  storeId: String
}, { timestamps: true });

export const Family = models.Family || model('Family', FamilySchema);
