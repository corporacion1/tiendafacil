import { FieldValue } from 'firebase/firestore';

export type UserRole = 'superAdmin' | 'admin' | 'user';
export type UserStatus = 'active' | 'disabled';

export type UserProfile = {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  role: UserRole;
  status: UserStatus;
  storeId?: string; // The store this user owns/manages (if role is 'admin')
  storeRequest?: boolean; // Flag to indicate a user wants a store
  createdAt: FieldValue;
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
  createdAt: string;
};

export type CartItem = {
  product: Product;
  quantity: number;
  price: number;
};

export type PendingOrder = {
  id: string;
  date: string;
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
};

export type InventoryMovement = {
  id: string;
  productName: string;
  type: 'sale' | 'purchase' | 'adjustment';
  quantity: number;
  date: string;
  responsible?: string;
};

export type Payment = {
    id: string;
    amount: number;
    date: string;
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
  date: string;
  transactionType: 'contado' | 'credito';
  status: 'paid' | 'unpaid';
  paidAmount: number;
  payments: Payment[];
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
    date: string;
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
    date: string;
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

export interface Settings {
  storeName: string;
  storeAddress: string;
  storePhone: string;
  storeSlogan: string;
  storeWhatsapp: string;
  storeTiktok: string;
  storeMeta: string;
  saleSeries: string;
  saleCorrelative: number;
  primaryCurrencyName: string;
  primaryCurrencySymbol: string;
  secondaryCurrencyName: string;
  secondaryCurrencySymbol: string;
  tax1: number;
  tax2: number;
  businessType: string;
}
