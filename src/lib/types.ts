
export type Product = {
  id: string;
  name: string;
  sku: string;
  stock: number;
  price: number;
  wholesalePrice: number;
  cost: number;
  category: string;
  status: 'active' | 'inactive';
  imageUrl: string;
  imageHint: string;
  tax1: boolean;
  tax2: boolean;
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
};

export type Purchase = {
    id: string;
    supplier: string;
    items: {
        productId: string;
        productName: string;
        quantity: number;
        cost: number;
    }[];
    total: number;
    date: string;
};

export type Customer = {
    id: string;
    name: string;
    phone?: string;
    address?: string;
}

    
    