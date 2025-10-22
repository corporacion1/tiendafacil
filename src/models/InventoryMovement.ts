import mongoose, { Schema, model, models } from 'mongoose';

// Enums para tipos de movimiento
export enum MovementType {
  INITIAL_STOCK = 'initial_stock',
  PURCHASE = 'purchase',
  SALE = 'sale',
  ADJUSTMENT = 'adjustment',
  TRANSFER_OUT = 'transfer_out',
  TRANSFER_IN = 'transfer_in',
  RETURN = 'return',
  DAMAGE = 'damage',
  EXPIRY = 'expiry'
}

export enum ReferenceType {
  PRODUCT_CREATION = 'product_creation',
  PURCHASE_ORDER = 'purchase_order',
  SALE_TRANSACTION = 'sale_transaction',
  MANUAL_ADJUSTMENT = 'manual_adjustment',
  WAREHOUSE_TRANSFER = 'warehouse_transfer',
  CUSTOMER_RETURN = 'customer_return',
  SUPPLIER_RETURN = 'supplier_return'
}

const InventoryMovementSchema = new Schema({
  productId: { 
    type: String, 
    required: true,
    index: true 
  },
  warehouseId: { 
    type: String, 
    required: true,
    index: true 
  },
  movementType: { 
    type: String, 
    enum: Object.values(MovementType),
    required: true,
    index: true
  },
  quantity: { 
    type: Number, 
    required: true 
  },
  unitCost: { 
    type: Number,
    default: 0 
  },
  totalValue: { 
    type: Number,
    default: 0 
  },
  referenceType: { 
    type: String,
    enum: Object.values(ReferenceType),
    required: true,
    index: true
  },
  referenceId: { 
    type: String, 
    required: true,
    index: true 
  },
  batchId: { 
    type: String
  },
  previousStock: { 
    type: Number, 
    required: true,
    default: 0 
  },
  newStock: { 
    type: Number, 
    required: true,
    default: 0 
  },
  userId: { 
    type: String, 
    required: true,
    index: true 
  },
  notes: { 
    type: String 
  },
  storeId: { 
    type: String, 
    required: true,
    index: true 
  }
}, { 
  timestamps: true,
  collection: 'inventory_movements'
});

// Índices compuestos para optimización
InventoryMovementSchema.index({ productId: 1, warehouseId: 1 });
InventoryMovementSchema.index({ referenceType: 1, referenceId: 1 });
InventoryMovementSchema.index({ storeId: 1, createdAt: -1 });
InventoryMovementSchema.index({ batchId: 1 }, { sparse: true });

// Índice para consultas de consistencia
InventoryMovementSchema.index({ 
  productId: 1, 
  warehouseId: 1, 
  storeId: 1, 
  createdAt: 1 
});

export const InventoryMovement = models.InventoryMovement || model('InventoryMovement', InventoryMovementSchema);