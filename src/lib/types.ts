
import { Timestamp } from 'firebase/firestore';

export type Product = {
  id: string;
  name: string;
  sku: string;
  stock: number;
  price: number;
  wholesalePrice: number;
  cost: number;
  status: 'active' | 'inactive' | 'promotion';
  tax1: boolean;
  tax2: boolean;
  unit?: string;
  family?: string;
  warehouse?: string;
  description?: string;
  imageUrl?: string;
  imageHint?: string;
  storeId: string;
  createdAt: string;
};

export type CartItem = {
  product: Product;
  quantity: number;
  price: number;
};

export type PendingOrder = {
  id: string;
  date: Timestamp | string;
  customerName: string;
  customerPhone: string;
  items: {
      productId: string;
      productName: string;
      quantity: number;
      price: number;
  }[];
  total: number;
};

export type InventoryMovement = {
  id: string;
  productName: string;
  type: 'sale' | 'purchase' | 'adjustment';
  quantity: number;
  date: Timestamp | string; // Support both for optimistic updates
  responsible?: string;
};

export type Payment = {
    id: string;
    amount: number;
    date: Timestamp | string;
    method: string;
    reference?: string;
}

export type Sale = {
  id: string;
  customerId: string;
  customerName: string;
  items: {
    productId: string;
    productName: string;
    quantity: number;
    price: number;
  }[];
  total: number;
  date: Timestamp | string;
  transactionType: 'contado' | 'credito';
  paymentMethod?: string; // Kept for simple legacy sales, but new ones will use payments array
  status: 'paid' | 'unpaid';
  paidAmount: number;
  payments: Payment[]; // Now this will hold all payment info
};

export type PurchaseItem = {
  productId: string;
  productName: string;
  quantity: number;
  cost: number;
};

export type Purchase = {
    id: string;
    supplierId: string;
    supplierName: string;
    items: PurchaseItem[];
    total: number;
    date: Timestamp | string;
    documentNumber?: string;
    responsible?: string;
};

export type Customer = {
    id: string;
    name: string;
    phone?: string;
    address?: string;
}

export type Supplier = {
    id: string;
    name: string;
    phone?: string;
    address?: string;
}

export type Unit = {
    id: string;
    name: string;
};

export type Family = {
    id: string;
    name: string;
};

export type Warehouse = {
    id: string;
    name: string;
};

export type CurrencyRate = {
    id: string;
    rate: number;
    date: Timestamp | string;
};

export type Store = {
    id: string;
    name: string;
    status: 'active' | 'inactive';
    businessType: string;
};

export type Ad = {
  id: string;
  sku: string;
  name: string;
  description?: string;
  price: number; // For promotional price display
  imageUrl: string;
  imageHint?: string;
  views: number;
  status: 'active' | 'inactive';
  targetBusinessTypes: string[];
  expiryDate?: string;
  createdAt: string;
};

export type AdClick = {
    id: string;
    adId: string;
    timestamp: string;
    userAgent: string;
    // In a real app, you might capture IP and other details on the server side
};
