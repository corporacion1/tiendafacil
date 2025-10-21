import mongoose, { Schema, model, models } from 'mongoose';

const SaleItemSchema = new Schema({
  productId: String,
  productName: String,
  quantity: Number,
  price: Number
}, { _id: false });

const PaymentSchema = new Schema({
  id: String,
  amount: Number,
  date: String,
  method: String,
  reference: String,
  receivedBy: String
}, { _id: false });

const SaleSchema = new Schema({
  id: { type: String, required: true },
  customerId: String,
  customerName: String,
  customerPhone: String, // Agregado para créditos
  items: [SaleItemSchema],
  total: Number,
  date: String,
  transactionType: String,
  status: String,
  paidAmount: Number,
  payments: [PaymentSchema],
  storeId: String,
  
  // Campos relacionados a créditos
  accountReceivableId: {
    type: String,
    index: true // Para búsquedas rápidas
  },
  creditTerms: {
    creditDays: {
      type: Number,
      default: 30
    },
    dueDate: {
      type: Date,
      index: true // Para consultas de vencimientos
    },
    creditLimit: {
      type: Number
    }
  }
}, { timestamps: true });

// Índices compuestos para optimización
SaleSchema.index({ storeId: 1, transactionType: 1 });
SaleSchema.index({ storeId: 1, status: 1 });
SaleSchema.index({ customerId: 1, transactionType: 1 });

// Middleware para calcular fechas de vencimiento automáticamente
SaleSchema.pre('save', function(next) {
  // Si es una venta a crédito y no tiene fecha de vencimiento
  if (this.transactionType === 'credito' && this.creditTerms && !this.creditTerms.dueDate && this.date) {
    const saleDate = new Date(this.date);
    const creditDays = this.creditTerms.creditDays || 30;
    const dueDate = new Date(saleDate);
    dueDate.setDate(dueDate.getDate() + creditDays);
    this.creditTerms.dueDate = dueDate;
  }
  
  next();
});

// Método estático para obtener ventas a crédito pendientes
SaleSchema.statics.getCreditSales = function(storeId: string, options: any = {}) {
  const query: any = { 
    storeId, 
    transactionType: 'credito' 
  };
  
  if (options.status) {
    query.status = options.status;
  }
  
  if (options.overdue) {
    query['creditTerms.dueDate'] = { $lt: new Date() };
    query.status = { $ne: 'paid' };
  }
  
  return this.find(query)
    .sort({ 'creditTerms.dueDate': 1, date: -1 })
    .limit(options.limit || 50);
};

// Método para verificar si una venta está vencida
SaleSchema.methods.isOverdue = function() {
  if (this.transactionType !== 'credito' || this.status === 'paid') {
    return false;
  }
  
  if (!this.creditTerms || !this.creditTerms.dueDate) {
    return false;
  }
  
  return new Date() > this.creditTerms.dueDate;
};

// Método para obtener días de vencimiento
SaleSchema.methods.getDaysOverdue = function() {
  if (!this.isOverdue()) {
    return 0;
  }
  
  const today = new Date();
  const dueDate = new Date(this.creditTerms.dueDate);
  const diffTime = today.getTime() - dueDate.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

export const Sale = models.Sale || model('Sale', SaleSchema);
