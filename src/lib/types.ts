

import { FieldValue } from 'firebase/firestore';

export type UserRole = 'su' | 'admin' | 'user' | 'seller' | 'depositary';
export type UserStatus = 'active' | 'disabled';

export type UserProfile = {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  password?: string; // Hashed password for authentication
  role: UserRole;
  status: UserStatus;
  storeId?: string; // The store this user owns/manages (if role is 'admin')
  storeRequest?: boolean; // Flag to indicate a user wants a store
  createdAt: string;
  phone?: string | null;
};

// This is the main settings/configuration object for a store
export type Store = {
    id: string;
    storeId: string;
    name: string; // This will be used as storeName
    ownerIds: string[]; // UIDs of the store owners
    userRoles?: Array<{ uid: string; role: UserRole }>; // Array format to match MongoDB model
    status: 'active' | 'inactive';
    businessType: string;
    address?: string;
    phone?: string | null;
    slogan?: string | null;
    logoUrl?: string;
    whatsapp?: string;
    tiktok?: string;
    meta?: string;
    saleSeries?: string;
    saleCorrelative?: number;
    primaryCurrencyName?: string;
    primaryCurrencySymbol?: string;
    secondaryCurrencyName?: string;
    secondaryCurrencySymbol?: string;
    tax1?: number;
    tax2?: number;
    useDemoData?: boolean;
};

// The Settings type is now an alias for Store for consistency in the context
export type Settings = Store;


export type Product = {
  id: string;
  name: string;
  sku: string;
  barcode?: string;
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
  storeId: string;
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
  storeId: string;
};

export type InventoryMovement = {
  id: string;
  productName: string;
  type: 'sale' | 'purchase' | 'adjustment';
  quantity: number;
  date: string;
  responsible?: string;
  storeId: string;
};

export type Payment = {
    id: string;
    amount: number;
    date: string;
    method: string;
    reference?: string;
    receivedBy?: string;
}

export type Sale = {
  id: string;
  customerId: string;
  customerName: string;
  customerPhone?: string;
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
  storeId: string;
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
    storeId: string;
};

export type Customer = {
    id: string;
    name: string;
    phone?: string;
    address?: string;
    storeId: string;
}

export type Supplier = {
    id: string;
    name: string;
    phone?: string;
    address?: string;
    storeId: string;
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
    date: string;
    storeId: string;
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
  status: 'active' | 'inactive' | 'paused';
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

export type CashSession = {
  id: string;
  storeId: string;
  openingDate: string;
  closingDate: string | null;
  openingBalance: number;
  closingBalance: number | null;
  calculatedCash: number;
  difference: number;
  status: 'open' | 'closed';
  openedBy: string;
  closedBy: string | null;
  salesIds: string[];
  transactions: Record<string, number>;
};

// Stores Administration Types
export type StoreWithStats = Store & {
  userCount: number;
  adminName: string;
  adminContact: string;
  lastActivity: Date;
  salesCount?: number;
  productsCount?: number;
  isProduction: boolean;
};

export type StoreFilters = {
  search: string;
  status: 'all' | 'active' | 'inactive' | 'production';
  dateRange: {
    from: Date | null;
    to: Date | null;
  };
  sortBy: 'name' | 'createdAt' | 'userCount';
  sortOrder: 'asc' | 'desc';
};

export type StoresAdminResponse = {
  stores: StoreWithStats[];
  statistics: {
    total: number;
    active: number;
    inactive: number;
    production: number;
  };
  pagination?: {
    page: number;
    limit: number;
    totalPages: number;
    total: number;
  };
};

export type StoreStatsResponse = {
  total: number;
  active: number;
  inactive: number;
  production: number;
  totalUsers: number;
  recentActivity: Array<{
    storeId: string;
    storeName: string;
    adminName: string;
    createdAt: string;
    status: string;
    isProduction: boolean;
  }>;
  lastUpdated: string;
};

export type DashboardCard = {
  title: string;
  value: number;
  icon: string;
  description: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
};

export type StoreStatusUpdateRequest = {
  storeId: string;
  newStatus: 'active' | 'inactive';
  reason?: string;
};

export type StoreStatusUpdateResponse = {
  success: boolean;
  store: {
    storeId: string;
    name: string;
    status: string;
    updatedAt: Date;
  };
  message: string;
};

export type StoreDetailedInfo = Store & {
  adminInfo: {
    uid: string;
    email: string;
    displayName: string;
    phone: string;
    role: UserRole;
    createdAt: string;
  } | null;
  userCount: number;
  activeUsers: number;
  usersByRole: Record<string, number>;
  userRoles: Array<{
    uid: string;
    role: UserRole;
    userInfo: {
      email: string;
      displayName: string;
      phone: string;
      status: UserStatus;
      createdAt: string;
    } | null;
  }>;
  isProduction: boolean;
  lastActivity: Date;
  configuration: {
    primaryCurrency: {
      name: string;
      symbol: string;
    };
    secondaryCurrency: {
      name: string;
      symbol: string;
    };
    taxes: {
      tax1: number;
      tax2: number;
    };
    business: {
      type: string;
      address: string;
      phone: string;
      whatsapp: string;
      tiktok: string;
    };
  };
};
