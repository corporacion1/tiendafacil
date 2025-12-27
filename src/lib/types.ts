// User Roles and Statuses

export type UserRole = 'su' | 'admin' | 'user' | 'pos' | 'depositary';
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
  userRoles?: Array<{ uid: string; role: UserRole }>;
  status: 'active' | 'inactive';
  businessType: string;
  address?: string;
  phone?: string | null;
  taxId?: string | null; // Identificación fiscal (RIF, NIT, etc.)
  nitId?: string | null; // Alias for taxId
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
  colorPalette?: 'blue-orange' | 'purple-pink' | 'green-teal' | 'red-yellow' | 'indigo-cyan' | 'slate-amber';
  createdAt?: string; // ISO date string for store creation date
  updatedAt?: string; // ISO date string for last update
};

// The Settings type is now an alias for Store for consistency in the context
export type Settings = Store;


export type ProductImage = {
  id: string; // ID único de la imagen
  url: string; // URL de la imagen original
  thumbnailUrl?: string; // URL del thumbnail generado
  alt?: string; // Texto alternativo
  order: number; // Orden de la imagen (0 = principal)
  uploadedAt: string; // Fecha de subida
  size?: number; // Tamaño del archivo en bytes
  dimensions?: {
    width: number;
    height: number;
  };
  // DEPRECATED: supabasePath is a legacy field referencing Supabase storage.
  // Kept for backward compatibility only. New images use GridFS and local API
  // endpoints (`/api/images/:id`).
  supabasePath?: string;
};

export type Product = {
  id: string;
  name: string;
  sku: string;
  barcode?: string;
  stock: number;
  price: number;
  wholesalePrice: number;
  cost: number;
  status: 'active' | 'inactive' | 'promotion' | 'hidden';
  tax1: boolean;
  tax2: boolean;
  unit?: string;
  family?: string;
  warehouse?: string;
  description?: string;
  imageUrl?: string; // Mantener para compatibilidad (será la imagen principal)
  imageHint?: string; // Mantener para compatibilidad

  // Nuevos campos para múltiples imágenes
  images?: ProductImage[]; // Array de imágenes del producto
  primaryImageIndex?: number; // Índice de la imagen principal (default: 0)

  createdAt: string;
  storeId: string;
  // Tipo: Producto Simple o Servicio/Fabricación
  type: 'product' | 'service';
  affectsInventory: boolean;
};

export type CartItem = {
  product: Product;
  quantity: number;
  price: number;
};

export type Order = {
  orderId: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  items: {
    productId: string;
    productName: string;
    quantity: number;
    price: number;
  }[];
  total: number;
  storeId: string;
  status: 'pending' | 'processing' | 'processed' | 'cancelled' | 'expired';
  processedAt?: string;
  processedBy?: string;
  saleId?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  latitude?: number;
  longitude?: number;
  customerAddress?: string;
};

// Alias para compatibilidad con código existente
export type PendingOrder = Order;

export type InventoryMovement = {
  id: string;
  productId: string;
  warehouseId: string;
  movementType: string;
  quantity: number;
  date: string;
  referenceType: string;
  referenceId: string;
  userId: string;
  previousStock: number;
  newStock: number;
  unitCost?: number;
  totalValue?: number;
  batchId?: string;
  createdAt: string;
  updatedAt: string;
  responsible?: string;
  storeId: string;
  productName?: string;
  type?: string;
};

export type SalePayment = {
  id: string;
  amount: number;
  date: string;
  method: string;
  reference?: string;
  receivedBy?: string;
}

export type Sale = {
  id: string;
  customerId: string | null;
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
  payments: SalePayment[];
  storeId: string;
  creditDays?: number;
  creditDueDate?: string;
  series?: string | null; // Serie del punto de venta
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
  email?: string;
  address?: string;
  rif_nit?: string;
  storeId: string;
  createdAt?: string;
}

export type Supplier = {
  id: string;
  name: string;
  phone?: string;
  address?: string;
  storeId: string;
}

// Expense Payment Types
export type PaymentCategory = 'rent' | 'fuel' | 'consumables' | 'raw_materials' | 'utilities' | 'spare_parts' | 'repairs' | 'travel_expenses' | 'other';
export type PaymentMethod = 'cash' | 'transfer' | 'card' | 'check' | 'other';

export type ExpensePayment = {
  id: string;
  storeId: string;
  recipientName: string;
  recipientId?: string;
  recipientPhone?: string;
  category: PaymentCategory;
  amount: number;
  currency?: string;
  documentNumber?: string;
  paymentMethod?: PaymentMethod;
  notes?: string;
  responsible: string;
  paymentDate: string;
  createdAt?: string;
  updatedAt?: string;
};

export type PaymentRecipient = {
  id: string;
  storeId: string;
  name: string;
  taxId?: string;
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type Unit = {
  id: string;
  name: string;
  description?: string;
  storeId: string;
  createdAt?: string;
};

export type Family = {
  id: string;
  name: string;
  description?: string;
  storeId: string;
  createdAt?: string;
};

export type Warehouse = {
  id: string;
  name: string;
  location?: string;
  storeId: string;
  createdAt?: string;
};

export type CurrencyRate = {
  id: string;
  rate: number;
  date: string;
  storeId: string;
  createdBy?: string;
  active?: boolean;
};

export type Ad = {
  id: string;
  storeId?: string;
  name: string;
  description?: string;
  imageUrl?: string;
  imageHint?: string;
  linkUrl?: string;
  views: number;
  status: 'active' | 'inactive' | 'paused';
  targetBusinessTypes: string[];
  expiryDate?: string;
  createdAt: string;
  price?: number;
  sku?: string;
};

export type AdClick = {
  id: string;
  adId: string;
  timestamp: string;
  userAgent: string;
};

export type CashSession = {
  // Identifiers
  id: string;
  storeId: string;
  store_id?: string;
  series?: string | null;

  // Status and Notes
  status: 'open' | 'closed';
  notes?: string;

  // User info (snake_case from DB, camelCase from mapped objects)
  opened_by: string;
  openedBy?: string;
  closed_by: string | null;
  closedBy?: string | null;

  // Timestamps
  opened_at: string; // Was incorrectly boolean
  opening_date?: string;
  openingDate?: string;

  closed_at: string | null; // Was incorrectly boolean
  closing_date?: string | null;
  closingDate?: string | null;

  // Financials
  opening_balance: number;
  openingBalance?: number;
  opening_amount?: number; // Legacy/DB alias

  closing_balance: number | null;
  closingBalance?: number | null;
  closing_amount?: number | null;

  calculated_cash: number;
  calculatedCash?: number;

  difference: number;

  // Relations
  transaction_count?: number;
  sales_ids?: string[];
  salesIds?: string[];
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

export type ImageDebugInfo = {
  productId: string;
  productName: string;
  environment: 'local' | 'production';
  issues: string[];
  details: {
    imageCount: number;
    primaryImageUrl: string | undefined;
    allImageUrls: string[];
    displayUrls: string[];
    hasMultipleImages: boolean;
  };
  timestamp: string;
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
