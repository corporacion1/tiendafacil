import { Timestamp } from 'firebase/firestore';

export type UserRole = 'superAdmin' | 'admin' | 'user';

export type UserProfile = {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  role: UserRole;
  storeId?: string; // The store this user owns/manages (if role is 'admin')
  storeRequest?: boolean; // Flag to indicate a user wants a store
  createdAt: string;
  phone?: string;
};

export type Store = {
    id: string;
    name: string;
    ownerId: string; // UID of the admin user who owns it
    status: 'active' | 'inactive';
    businessType: string;
};

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
  storeId: string; // Each product belongs to a store
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
  customerEmail?: string; // Added email
  items: {
      productId: string;
      productName: string;
      quantity: number;
      price: number;
  }[];
  total: number;
  storeId: string; // Know which store this order belongs to
};

export type InventoryMovement = {
  id: string;
  productName: string;
  type: 'sale' | 'purchase' | 'adjustment';
  quantity: number;
  date: Timestamp | string;
  responsible?: string;
  storeId: string; // Each movement belongs to a store
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
  status: 'paid' | 'unpaid';
  paidAmount: number;
  payments: Payment[];
  storeId: string; // Each sale belongs to a store
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
    storeId: string; // Each purchase belongs to a store
};

export type Customer = {
    id: string;
    name: string;
    phone?: string;
    address?: string;
    storeId: string; // Each customer belongs to a store
}

export type Supplier = {
    id: string;
    name: string;
    phone?: string;
    address?: string;
    storeId: string; // Each supplier belongs to a store
}

export type Unit = {
    id: string;
    name: string;
    storeId: string;
};

export type Family = {
    id: string;
    name: string;
    storeId: string;
};

export type Warehouse = {
    id: string;
    name: string;
    storeId: string;
};

export type CurrencyRate = {
    id: string;
    rate: number;
    date: Timestamp | string;
};

export type Ad = {
  id: string;
  sku: string;
  name: string;
  description?: string;
  price: number;
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
};
