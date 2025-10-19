import mongoose from 'mongoose';

export enum OrderStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  PROCESSED = 'processed',
  CANCELLED = 'cancelled',
  EXPIRED = 'expired'
}

const OrderSchema = new mongoose.Schema({
  orderId: { 
    type: String, 
    required: true, 
    unique: true,
    index: true 
  },
  customerName: { 
    type: String, 
    required: true 
  },
  customerPhone: { 
    type: String, 
    required: true,
    index: true 
  },
  customerEmail: { 
    type: String 
  },
  items: [{
    productId: { type: String, required: true },
    productName: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true, min: 0 }
  }],
  total: { 
    type: Number, 
    required: true,
    min: 0 
  },
  storeId: { 
    type: String, 
    required: true,
    index: true 
  },
  status: { 
    type: String, 
    enum: Object.values(OrderStatus),
    default: OrderStatus.PENDING,
    index: true 
  },
  // Campos de procesamiento
  processedAt: { 
    type: Date 
  },
  processedBy: { 
    type: String 
  },
  saleId: { 
    type: String,
    index: true 
  },
  // Campos de auditoría
  notes: { 
    type: String 
  },
  createdAt: { 
    type: Date, 
    default: Date.now,
    index: true 
  },
  updatedAt: { 
    type: Date, 
    default: Date.now 
  }
}, {
  timestamps: true // Esto actualiza automáticamente updatedAt
});

// Índices compuestos para optimización
OrderSchema.index({ storeId: 1, status: 1 });
OrderSchema.index({ storeId: 1, createdAt: -1 });
OrderSchema.index({ customerPhone: 1, status: 1 });

export default mongoose.models.Order || mongoose.model('Order', OrderSchema);