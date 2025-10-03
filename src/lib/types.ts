

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
  unit?: string;
  family?: string;
  warehouse?: string;
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

export const initialUnits: Unit[] = [
    { id: 'u1', name: 'Pieza' },
    { id: 'u2', name: 'Kg' },
    { id: 'u3', name: 'Litro' },
    { id: 'u4', name: 'Caja' },
];

export const initialFamilies: Family[] = [
    { id: 'f1', name: 'Electrónica' },
    { id: 'f2', name: 'Computadoras' },
    { id: 'f3', name: 'Periféricos' },
    { id: 'f4', name: 'Monitores' },
    { id: 'f5', name: 'Accesorios' },
];

export const initialWarehouses: Warehouse[] = [
    { id: 'w1', name: 'Principal' },
    { id: 'w2', name: 'Secundario' },
    { id: 'w3', name: 'Bodega Central' },
];

    