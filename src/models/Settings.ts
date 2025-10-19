import { Schema, model, models } from 'mongoose';

const SettingsSchema = new Schema({
  storeId: { 
    type: String, 
    required: true,
    unique: true
  },
  name: String,
  phone: String,
  businessType: String,
  address: String,
  slogan: String,
  logoUrl: String,
  whatsapp: String,
  meta: String,
  saleSeries: String,
  tax1: Number,
  tax2: Number,
  primaryCurrencyName: String,
  primaryCurrencySymbol: String,
  secondaryCurrencyName: String,
  secondaryCurrencySymbol: String
}, { 
  timestamps: true 
});

// Usa el modelo existente o crea uno nuevo
export default models?.Settings || model('Settings', SettingsSchema);