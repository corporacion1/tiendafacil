import mongoose, { Schema, model, models } from 'mongoose';

export enum SessionStatus {
  OPEN = 'open',
  CLOSED = 'closed',
  SUSPENDED = 'suspended'
}

const CashSessionSchema = new Schema({
  id: { 
    type: String, 
    required: true,
    unique: true,
    index: true 
  },
  storeId: { 
    type: String, 
    required: true,
    index: true 
  },
  openingDate: { 
    type: Date, 
    required: true,
    default: Date.now 
  },
  closingDate: { 
    type: Date,
    default: null 
  },
  openingBalance: { 
    type: Number, 
    required: true,
    min: 0,
    default: 0 
  },
  closingBalance: { 
    type: Number,
    min: 0,
    default: null 
  },
  calculatedCash: { 
    type: Number,
    default: 0 
  },
  difference: { 
    type: Number,
    default: 0 
  },
  status: { 
    type: String, 
    enum: Object.values(SessionStatus),
    required: true,
    default: SessionStatus.OPEN,
    index: true 
  },
  openedBy: { 
    type: String, 
    required: true 
  },
  closedBy: { 
    type: String,
    default: null 
  },
  salesIds: { 
    type: [String], 
    default: [] 
  },
  transactions: { 
    type: Map, 
    of: Number,
    default: new Map() 
  },
  xReports: { 
    type: Number, 
    default: 0 
  },
  notes: { 
    type: String,
    default: '' 
  }
}, { 
  timestamps: true,
  collection: 'cash_sessions'
});

// Índices compuestos para optimización
CashSessionSchema.index({ storeId: 1, status: 1 });
CashSessionSchema.index({ storeId: 1, openingDate: -1 });
CashSessionSchema.index({ openedBy: 1, status: 1 });

// Validación personalizada: solo una sesión abierta por tienda
CashSessionSchema.pre('save', async function(next) {
  if (this.isNew && this.status === SessionStatus.OPEN) {
    const existingOpenSession = await (this.constructor as any).findOne({
      storeId: this.storeId,
      status: SessionStatus.OPEN,
      _id: { $ne: this._id }
    });
    
    if (existingOpenSession) {
      const error = new Error('Ya existe una sesión de caja abierta para esta tienda');
      return next(error);
    }
  }
  next();
});

export const CashSession = models.CashSession || model('CashSession', CashSessionSchema);
