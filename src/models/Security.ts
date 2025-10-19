import { Schema, model, models } from 'mongoose';
import bcrypt from 'bcryptjs';

const SecuritySchema = new Schema({
  userId: {
    type: String,
    required: true,
    unique: true
  },
  pin: {
    type: String,
    required: true,
    select: false
  },
  attempts: {
    type: Number,
    default: 0,
    max: 5
  },
  lockedUntil: {
    type: Date,
    default: null
  },
  lastChanged: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Encriptar PIN antes de guardar
SecuritySchema.pre('save', async function(next) {
  if (this.isModified('pin')) {
    const salt = await bcrypt.genSalt(12);
    this.pin = await bcrypt.hash(this.pin, salt);
  }
  next();
});

// Método para comparar PIN
SecuritySchema.methods.comparePin = async function(pin: string) {
  return await bcrypt.compare(pin, this.pin);
};

export default models?.Security || model('Security', SecuritySchema);