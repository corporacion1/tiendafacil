

export type Product = {
  id: string;
  name: string;
  sku: string;
  stock: number;
  price: number;
  wholesalePrice: number;
  cost: number;
  status: 'active' | 'inactive';
  tax1: boolean;
  tax2: boolean;
  unit?: string;
  family?: string;
  warehouse?: string;
  description?: string;
  imageUrl?: string;
  imageHint?: string;
};

export type CartItem = {
  product: Product;
  quantity: number;
  price: number;
};

export type InventoryMovement = {
  id: string;
  productName: string;
  type: 'sale' | 'purchase' | 'adjustment';
  quantity: number;
  date: string;
};

export type Payment = {
    id: string;
    amount: number;
    date: string;
}

export type Sale = {
  id: string;
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
  paymentMethod?: string;
  status: 'paid' | 'unpaid';
  paidAmount: number;
  payments?: Payment[];
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
