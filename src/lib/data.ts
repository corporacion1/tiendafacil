

import type { Product, InventoryMovement, Sale, Unit, Family, Warehouse, Customer, Purchase, Supplier, CurrencyRate } from '@/lib/types';

export const defaultCustomers: Customer[] = [
    { id: 'eventual', name: 'Cliente Eventual' },
];

export const defaultSuppliers: Supplier[] = [];

export let initialUnits: Unit[] = [];

export let initialFamilies: Family[] = [];

export let initialWarehouses: Warehouse[] = [];

// These arrays are now empty as data will come from Firestore
export let mockProducts: Product[] = [];
export let mockInventoryMovements: InventoryMovement[] = [];
export let mockSales: Sale[] = [];
export let mockPurchases: Purchase[] = [];
export let initialCustomers: Customer[] = [];
export let initialSuppliers: Supplier[] = [];
export let mockCurrencyRates: CurrencyRate[] = [];


export function factoryReset() {
    console.log("Performing factory reset...");
    
    // Clear transactional data (if any was loaded into memory)
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

    console.log("Factory reset complete. Data in Firestore is not affected by this mock data reset.");
}
