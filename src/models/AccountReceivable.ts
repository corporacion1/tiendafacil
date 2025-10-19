import mongoose, { Schema, model, models } from 'mongoose';

// Enums para estados y tipos de pago
export enum AccountStatus {
  PENDING = 'pending',
  PARTIAL = 'partial',
  PAID = 'paid',
  OVERDUE = 'overdue',
  CANCELLED = 'cancelled'
}

export enum PaymentType {
  PAYMENT = 'payment',
  ADJUSTMENT = 'adjustment',
  DISCOUNT = 'discount',
  REFUND = 'refund'
}

// Schema para registros de pago (compatible con el Payment existente)
const PaymentRecordSchema = new Schema({
  id: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  paymentMethod: {
    type: String,
    required: true
  },
  reference: {
    type: String
  },
  type: {
    type: String,
    enum: Object.values(PaymentType),
    default: PaymentType.PAYMENT
  },
  notes: {
    type: String
  },
  processedBy: {
    type: String,
    required: true
  },
  processedAt: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

// Schema principal para cuentas por cobrar
const AccountReceivableSchema = new Schema({
  id: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  saleId: {
    type: String,
    required: true,
    index: true
  },
  customerId: {
    type: String,
    required: true,
    index: true
  },
  customerName: {
    type: String,
    required: true
  },
  customerPhone: {
    type: String,
    index: true
  },
  storeId: {
    type: String,
    required: true,
    index: true
  },
  
  // Montos financieros
  originalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  paidAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  remainingBalance: {
    type: Number,
    required: true,
    min: 0
  },
  
  // Fechas importantes
  saleDate: {
    type: Date,
    required: true
  },
  dueDate: {
    type: Date,
    required: true,
    index: true
  },
  lastPaymentDate: {
    type: Date
  },
  
  // Estado y control
  status: {
    type: String,
    enum: Object.values(AccountStatus),
    default: AccountStatus.PENDING,
    index: true
  },
  
  // Historial de pagos
  payments: [PaymentRecordSchema],
  
  // Información adicional
  notes: {
    type: String
  },
  
  // Días de crédito otorgados
  creditDays: {
    type: Number,
    default: 30
  },
  
  // Auditoría
  createdBy: {
    type: String,
    required: true
  },
  updatedBy: {
    type: String
  }
}, {
  timestamps: true,
  collection: 'accounts_receivable'
});

// Índices compuestos para optimización de consultas
AccountReceivableSchema.index({ storeId: 1, status: 1 });
AccountReceivableSchema.index({ customerId: 1, status: 1 });
AccountReceivableSchema.index({ storeId: 1, dueDate: 1 });
AccountReceivableSchema.index({ storeId: 1, saleDate: -1 });

// Middleware para calcular automáticamente el balance restante y actualizar estado
AccountReceivableSchema.pre('save', function(next) {
  if (this.payments && this.payments.length > 0) {
    // Calcular total pagado basado en el tipo de pago
    const totalPaid = this.payments.reduce((sum, payment) => {
      if (payment.type === PaymentType.PAYMENT) {
        return sum + payment.amount;
      } else if (payment.type === PaymentType.ADJUSTMENT || payment.type === PaymentType.DISCOUNT) {
        return sum + payment.amount;
      } else if (payment.type === PaymentType.REFUND) {
        return sum - payment.amount;
      }
      return sum;
    }, 0);
    
    this.paidAmount = Math.max(0, totalPaid);
    this.remainingBalance = Math.max(0, this.originalAmount - this.paidAmount);
    
    // Actualizar estado automáticamente basado en el balance
    if (this.remainingBalance === 0) {
      this.status = AccountStatus.PAID;
    } else if (this.paidAmount > 0) {
      this.status = AccountStatus.PARTIAL;
    } else if (new Date() > this.dueDate) {
      this.status = AccountStatus.OVERDUE;
    } else {
      this.status = AccountStatus.PENDING;
    }
    
    // Actualizar fecha del último pago
    if (this.payments.length > 0) {
      const lastPayment = this.payments[this.payments.length - 1];
      this.lastPaymentDate = lastPayment.processedAt;
    }
  }
  
  next();
});

// Método estático para crear cuenta desde venta existente
AccountReceivableSchema.statics.createFromSale = function(sale: any, creditDays: number = 30, createdBy: string) {
  const saleDate = new Date(sale.date);
  const dueDate = new Date(saleDate);
  dueDate.setDate(dueDate.getDate() + creditDays);
  
  return new this({
    id: `ar_${Date.now()}`,
    saleId: sale.id,
    customerId: sale.customerId,
    customerName: sale.customerName,
    customerPhone: sale.customerPhone,
    storeId: sale.storeId,
    originalAmount: sale.total,
    paidAmount: sale.paidAmount || 0,
    remainingBalance: sale.total - (sale.paidAmount || 0),
    saleDate,
    dueDate,
    creditDays,
    createdBy,
    payments: sale.payments ? sale.payments.map((p: any) => ({
      id: p.id,
      amount: p.amount,
      paymentMethod: p.method,
      reference: p.reference,
      type: PaymentType.PAYMENT,
      processedBy: p.receivedBy,
      processedAt: new Date(p.date)
    })) : []
  });
};

export const AccountReceivable = models.AccountReceivable || model('AccountReceivable', AccountReceivableSchema);