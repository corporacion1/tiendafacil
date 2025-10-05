

import type { Product, InventoryMovement, Sale, Unit, Family, Warehouse, Customer, Purchase, Supplier, CurrencyRate } from '@/lib/types';

export const initialUnits: Unit[] = [];

export const initialFamilies: Family[] = [];

export const initialWarehouses: Warehouse[] = [];

export let mockProducts: Product[] = [];

export let mockInventoryMovements: InventoryMovement[] = [];

export const monthlySalesData = [
  { month: "Jan", sales: Math.floor(Math.random() * 5000) + 1000 },
  { month: "Feb", sales: Math.floor(Math.random() * 5000) + 1000 },
  { month: "Mar", sales: Math.floor(Math.random() * 5000) + 1000 },
  { month: "Apr", sales: Math.floor(Math.random() * 5000) + 1000 },
  { month: "May", sales: Math.floor(Math.random() * 5000) + 1000 },
  { month: "Jun", sales: Math.floor(Math.random() * 5000) + 1000 },
  { month: "Jul", sales: Math.floor(Math.random() * 5000) + 1000 },
  { month: "Aug", sales: Math.floor(Math.random() * 5000) + 1000 },
  { month: "Sep", sales: Math.floor(Math.random() * 5000) + 1000 },
  { month: "Oct", sales: Math.floor(Math.random() * 5000) + 1000 },
  { month: "Nov", sales: Math.floor(Math.random() * 5000) + 1000 },
  { month: "Dec", sales: Math.floor(Math.random() * 5000) + 1000 },
];

export const categorySalesData = [
  { category: 'Electronics', sales: 400, fill: 'var(--color-electronics)' },
  { category: 'Accessories', sales: 300, fill: 'var(--color-accessories)' },
  { category: 'Monitors', sales: 200, fill: 'var(--color-monitors)' },
  { category: 'Peripherals', sales: 278, fill: 'var(--color-peripherals)' },
];

export let mockSales: Sale[] = [];

export let mockPurchases: Purchase[] = [];

export const initialCustomers: Customer[] = [
    { id: 'eventual', name: 'Cliente Eventual' },
    { id: 'johndoe', name: 'John Doe', phone: '555-1234', address: '123 Fake St' },
    { id: 'janesmith', name: 'Jane Smith', phone: '555-5678', address: '456 Oak Ave' }
];

export const initialSuppliers: Supplier[] = [
    { id: 'sup-1', name: 'TechSupplier Inc.', phone: '111-222-3333', address: '789 Tech Rd' },
    { id: 'sup-2', name: 'AccessoryWorld', phone: '444-555-6666', address: '101 Peripherals Ave' },
    { id: 'sup-3', name: 'PC Parts Direct', phone: '777-888-9999', address: '202 Component Dr' },
];

export let mockCurrencyRates: CurrencyRate[] = [];
