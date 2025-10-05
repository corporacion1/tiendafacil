

import type { Product, InventoryMovement, Sale, Unit, Family, Warehouse, Customer, Purchase, Supplier, CurrencyRate } from '@/lib/types';

export const defaultCustomers: Customer[] = [
    { id: 'eventual', name: 'Cliente Eventual' },
    { id: 'johndoe', name: 'John Doe', phone: '555-1234', address: '123 Fake St' },
    { id: 'janesmith', name: 'Jane Smith', phone: '555-5678', address: '456 Oak Ave' }
];

export const defaultSuppliers: Supplier[] = [
    { id: 'sup-1', name: 'TechSupplier Inc.', phone: '111-222-3333', address: '789 Tech Rd' },
    { id: 'sup-2', name: 'AccessoryWorld', phone: '444-555-6666', address: '101 Peripherals Ave' },
    { id: 'sup-3', name: 'PC Parts Direct', phone: '777-888-9999', address: '202 Component Dr' },
];

export let initialUnits: Unit[] = [];

export let initialFamilies: Family[] = [];

export let initialWarehouses: Warehouse[] = [];

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

export let initialCustomers: Customer[] = [...defaultCustomers];

export let initialSuppliers: Supplier[] = [...defaultSuppliers];

export let mockCurrencyRates: CurrencyRate[] = [];


export function factoryReset() {
    console.log("Performing factory reset...");
    
    // Clear transactional data
    mockProducts.length = 0;
    mockInventoryMovements.length = 0;
    mockSales.length = 0;
    mockPurchases.length = 0;
    mockCurrencyRates.length = 0;
    
    // Clear classification data
    initialUnits.length = 0;
    initialFamilies.length = 0;
    initialWarehouses.length = 0;
    
    // Reset customers and suppliers to their default state
    initialCustomers.length = 0;
    initialCustomers.push(...defaultCustomers);

    initialSuppliers.length = 0;
    initialSuppliers.push(...defaultSuppliers);

    // This won't reset settings in localStorage, but it's a good place to mention it.
    // The actual settings reset will be handled in the component.
    console.log("Factory reset complete. Please also clear settings from localStorage if needed.");
}
