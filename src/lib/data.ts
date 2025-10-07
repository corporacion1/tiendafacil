
import type { Product, InventoryMovement, Sale, Unit, Family, Warehouse, Customer, Purchase, Supplier, CurrencyRate, Payment } from '@/lib/types';
import { PlaceHolderImages } from './placeholder-images';
import { subDays, subHours } from 'date-fns';

export const defaultCustomers: Customer[] = [
    { id: 'eventual', name: 'Cliente Eventual', phone: '', address: '' },
    { id: 'cust-1', name: 'John Doe', phone: '555-1234', address: '123 Main St' },
    { id: 'cust-2', name: 'Jane Smith', phone: '555-5678', address: '456 Oak Ave' },
];

export const defaultSuppliers: Supplier[] = [
    { id: 'sup-1', name: 'Distribuidora Alimentos Polar', phone: '111-2222', address: '789 Food Rd' },
    { id: 'sup-2', name: 'Coca-Cola FEMSA', phone: '333-4444', address: '101 Beverage Ln' },
    { id: 'sup-3', name: 'Procter & Gamble', phone: '555-5555', address: '202 Clean St' },
];

export let initialUnits: Unit[] = [
    { id: 'unit-1', name: 'Unidad' },
    { id: 'unit-2', name: 'Caja' },
    { id: 'unit-3', name: 'Paquete' },
    { id: 'unit-4', name: 'Kg' },
    { id: 'unit-5', name: 'Litro' },
];

export let initialFamilies: Family[] = [
    { id: 'fam-1', name: 'Bebidas' },
    { id: 'fam-2', name: 'Snacks' },
    { id: 'fam-3', name: 'Lácteos y Huevos' },
    { id: 'fam-4', name: 'Limpieza' },
    { id: 'fam-5', name: 'Panadería' },
    { id: 'fam-6', name: 'Viveres' },
    { id: 'fam-7', name: 'Cuidado Personal' },
];

export let initialWarehouses: Warehouse[] = [
    { id: 'wh-1', name: 'Almacén Principal' },
    { id: 'wh-2', name: 'Depósito Secundario' },
];

export const mockProducts: Product[] = [
  {
    id: "prod-1", name: "Refresco Coca-Cola 2L", sku: "CC-2L-001", stock: 50, price: 2.5, wholesalePrice: 2.2, cost: 1.8, status: "active", tax1: true, tax2: false, unit: "Unidad", family: "Bebidas", warehouse: "Almacén Principal",
    description: "Refresco carbonatado sabor cola, botella de 2 litros.",
    imageUrl: PlaceHolderImages.find(p => p.id === '1')?.imageUrl, imageHint: PlaceHolderImages.find(p => p.id === '1')?.imageHint,
  },
  {
    id: "prod-2", name: "Papas Fritas Lays 150g", sku: "LAYS-150G-002", stock: 120, price: 1.5, wholesalePrice: 1.2, cost: 0.9, status: "active", tax1: true, tax2: false, unit: "Unidad", family: "Snacks", warehouse: "Almacén Principal",
    description: "Papas fritas naturales en bolsa de 150g.",
    imageUrl: PlaceHolderImages.find(p => p.id === '2')?.imageUrl, imageHint: PlaceHolderImages.find(p => p.id === '2')?.imageHint,
  },
  {
    id: "prod-3", name: "Leche Completa 1L", sku: "LECHE-1L-003", stock: 80, price: 1.8, wholesalePrice: 1.6, cost: 1.2, status: "active", tax1: true, tax2: false, unit: "Litro", family: "Lácteos y Huevos", warehouse: "Almacén Principal",
    description: "Leche de vaca pasteurizada, cartón de 1 litro.",
    imageUrl: PlaceHolderImages.find(p => p.id === '3')?.imageUrl, imageHint: PlaceHolderImages.find(p => p.id === '3')?.imageHint,
  },
  {
    id: "prod-4", name: "Detergente en Polvo 1kg", sku: "DET-1KG-004", stock: 60, price: 4.5, wholesalePrice: 4.0, cost: 3.2, status: "active", tax1: true, tax2: false, unit: "Kg", family: "Limpieza", warehouse: "Almacén Principal",
    description: "Detergente en polvo para ropa, bolsa de 1 kilogramo.",
    imageUrl: PlaceHolderImages.find(p => p.id === '4')?.imageUrl, imageHint: PlaceHolderImages.find(p => p.id === '4')?.imageHint,
  },
  {
    id: "prod-5", name: "Pan de Sándwich Blanco", sku: "PAN-SW-005", stock: 40, price: 2.0, wholesalePrice: 1.8, cost: 1.3, status: "active", tax1: true, tax2: false, unit: "Unidad", family: "Panadería", warehouse: "Almacén Principal",
    description: "Pan de molde blanco, ideal para sándwiches.",
    imageUrl: PlaceHolderImages.find(p => p.id === '5')?.imageUrl, imageHint: PlaceHolderImages.find(p => p.id === '5')?.imageHint,
  },
  {
    id: "prod-6", name: "Huevos (Cartón de 12)", sku: "HUEVOS-12-006", stock: 30, price: 3.5, wholesalePrice: 3.1, cost: 2.5, status: "active", tax1: true, tax2: false, unit: "Unidad", family: "Lácteos y Huevos", warehouse: "Almacén Principal",
    description: "Cartón con 12 huevos de gallina frescos.",
    imageUrl: PlaceHolderImages.find(p => p.id === '6')?.imageUrl, imageHint: PlaceHolderImages.find(p => p.id === '6')?.imageHint,
  },
  {
    id: "prod-7", name: "Café en Grano 500g", sku: "CAFE-500G-007", stock: 45, price: 5.0, wholesalePrice: 4.5, cost: 3.8, status: "active", tax1: true, tax2: false, unit: "Unidad", family: "Viveres", warehouse: "Almacén Principal",
    description: "Café en grano tostado oscuro, bolsa de 500 gramos.",
    imageUrl: PlaceHolderImages.find(p => p.id === '7')?.imageUrl, imageHint: PlaceHolderImages.find(p => p.id === '7')?.imageHint,
  },
  {
    id: "prod-8", name: "Atún en Aceite 140g", sku: "ATUN-140G-008", stock: 90, price: 1.2, wholesalePrice: 1.0, cost: 0.8, status: "active", tax1: true, tax2: false, unit: "Unidad", family: "Viveres", warehouse: "Almacén Principal",
    description: "Lata de atún en aceite vegetal de 140 gramos.",
    imageUrl: PlaceHolderImages.find(p => p.id === '8')?.imageUrl, imageHint: PlaceHolderImages.find(p => p.id === '8')?.imageHint,
  },
  {
    id: "prod-9", name: "Pasta Larga (Spaghetti) 1kg", sku: "PASTA-1KG-009", stock: 70, price: 1.9, wholesalePrice: 1.7, cost: 1.4, status: "active", tax1: false, tax2: false, unit: "Kg", family: "Viveres", warehouse: "Almacén Principal",
    description: "Paquete de pasta tipo spaghetti de 1 kilogramo.",
    imageUrl: PlaceHolderImages.find(p => p.id === '9')?.imageUrl, imageHint: PlaceHolderImages.find(p => p.id === '9')?.imageHint,
  },
  {
    id: "prod-10", name: "Salsa de Tomate 500g", sku: "SALSA-500G-010", stock: 65, price: 1.3, wholesalePrice: 1.1, cost: 0.9, status: "active", tax1: true, tax2: false, unit: "Unidad", family: "Viveres", warehouse: "Almacén Principal",
    description: "Salsa de tomate para pastas, frasco de 500 gramos.",
    imageUrl: PlaceHolderImages.find(p => p.id === '10')?.imageUrl, imageHint: PlaceHolderImages.find(p => p.id === '10')?.imageHint,
  },
  {
    id: "prod-11", name: "Jabón de Baño", sku: "JABON-B-011", stock: 150, price: 0.8, wholesalePrice: 0.6, cost: 0.4, status: "active", tax1: true, tax2: false, unit: "Unidad", family: "Cuidado Personal", warehouse: "Almacén Principal",
    description: "Barra de jabón de baño con fragancia neutra.",
    imageUrl: PlaceHolderImages.find(p => p.id === '11')?.imageUrl, imageHint: PlaceHolderImages.find(p => p.id === '11')?.imageHint,
  },
  {
    id: "prod-12", name: "Shampoo 400ml", sku: "SHAMP-400ML-012", stock: 55, price: 3.2, wholesalePrice: 2.8, cost: 2.2, status: "active", tax1: true, tax2: false, unit: "Unidad", family: "Cuidado Personal", warehouse: "Almacén Principal",
    description: "Botella de shampoo para todo tipo de cabello, 400ml.",
    imageUrl: PlaceHolderImages.find(p => p.id === '12')?.imageUrl, imageHint: PlaceHolderImages.find(p => p.id === '12')?.imageHint,
  },
  {
    id: "prod-13", name: "Harina de Maíz 1kg", sku: "HARINA-1KG-013", stock: 200, price: 1.1, wholesalePrice: 0.9, cost: 0.7, status: "active", tax1: false, tax2: false, unit: "Kg", family: "Viveres", warehouse: "Almacén Principal",
    description: "Harina de maíz precocida, paquete de 1 kilogramo.",
    imageUrl: PlaceHolderImages.find(p => p.id === '13')?.imageUrl, imageHint: PlaceHolderImages.find(p => p.id === '13')?.imageHint,
  },
  {
    id: "prod-14", name: "Arroz Blanco 1kg", sku: "ARROZ-1KG-014", stock: 180, price: 1.4, wholesalePrice: 1.2, cost: 0.95, status: "active", tax1: false, tax2: false, unit: "Kg", family: "Viveres", warehouse: "Almacén Principal",
    description: "Arroz blanco de grano largo, paquete de 1 kilogramo.",
    imageUrl: PlaceHolderImages.find(p => p.id === '14')?.imageUrl, imageHint: PlaceHolderImages.find(p => p.id === '14')?.imageHint,
  },
];


export const mockSales: Sale[] = [
    {
        id: "SALE-001", customerId: "cust-1", customerName: "John Doe",
        items: [ { productId: "prod-1", productName: "Refresco Coca-Cola 2L", quantity: 2, price: 2.5 }, { productId: "prod-2", productName: "Papas Fritas Lays 150g", quantity: 3, price: 1.5 } ],
        total: 9.5, date: subDays(new Date(), 2).toISOString(), transactionType: 'contado', status: 'paid', paidAmount: 9.5,
        payments: [{ id: 'pay-sale-001', amount: 9.5, date: subDays(new Date(), 2).toISOString(), method: 'efectivo' }]
    },
    {
        id: "SALE-002", customerId: "cust-2", customerName: "Jane Smith",
        items: [ { productId: "prod-3", productName: "Leche Completa 1L", quantity: 12, price: 1.6 } ],
        total: 19.2, date: subDays(new Date(), 8).toISOString(), transactionType: 'credito', status: 'unpaid', paidAmount: 10,
        payments: [{ id: 'pay-sale-002', amount: 10, date: subDays(new Date(), 7).toISOString(), method: 'pago-movil', reference: '012345' }]
    },
    {
        id: "SALE-003", customerId: "eventual", customerName: "Cliente Eventual",
        items: [ { productId: "prod-4", productName: "Detergente en Polvo 1kg", quantity: 1, price: 4.5 }, { productId: "prod-5", productName: "Pan de Sándwich Blanco", quantity: 2, price: 2.0 } ],
        total: 8.5, date: subHours(new Date(), 3).toISOString(), transactionType: 'contado', status: 'paid', paidAmount: 8.5,
        payments: [{ id: 'pay-sale-003', amount: 8.5, date: subHours(new Date(), 3).toISOString(), method: 'tarjeta', reference: '1234' }]
    },
    {
        id: "SALE-004", customerId: "cust-1", customerName: "John Doe",
        items: [ { productId: "prod-6", productName: "Huevos (Cartón de 12)", quantity: 10, price: 3.1 } ],
        total: 31.0, date: subDays(new Date(), 20).toISOString(), transactionType: 'credito', status: 'paid', paidAmount: 31.0,
        payments: [ { id: 'pay-sale-004-1', amount: 15.0, date: subDays(new Date(), 19).toISOString(), method: 'pago-movil', reference: '67890' }, { id: 'pay-sale-004-2', amount: 16.0, date: subDays(new Date(), 10).toISOString(), method: 'efectivo' } ]
    },
    {
        id: "SALE-005", customerId: "eventual", customerName: "Cliente Eventual",
        items: [
            { productId: "prod-13", productName: "Harina de Maíz 1kg", quantity: 10, price: 1.1 },
            { productId: "prod-14", productName: "Arroz Blanco 1kg", quantity: 10, price: 1.4 },
            { productId: "prod-9", productName: "Pasta Larga (Spaghetti) 1kg", quantity: 5, price: 1.9 },
        ],
        total: 34.5, date: new Date().toISOString(), transactionType: 'contado', status: 'paid', paidAmount: 40,
        payments: [{ id: 'pay-sale-005-1', amount: 40, date: new Date().toISOString(), method: 'efectivo' }]
    },
    {
        id: "SALE-006", customerId: "cust-2", customerName: "Jane Smith",
        items: [
            { productId: "prod-7", productName: "Café en Grano 500g", quantity: 5, price: 4.5 },
            { productId: "prod-8", productName: "Atún en Aceite 140g", quantity: 24, price: 1.0 },
            { productId: "prod-11", productName: "Jabón de Baño", quantity: 12, price: 0.6 },
            { productId: "prod-12", productName: "Shampoo 400ml", quantity: 6, price: 2.8 }
        ],
        total: 70.5, date: subDays(new Date(), 3).toISOString(), transactionType: 'credito', status: 'unpaid', paidAmount: 0,
        payments: []
    }
];

export const mockPurchases: Purchase[] = [
    {
        id: "PUR-001", supplierId: "sup-2", supplierName: "Coca-Cola FEMSA",
        items: [ { productId: "prod-1", productName: "Refresco Coca-Cola 2L", quantity: 100, cost: 1.8 } ],
        total: 180, date: subDays(new Date(), 15).toISOString(), documentNumber: "INV-CC-8899", responsible: "Admin",
    },
    {
        id: "PUR-002", supplierId: "sup-1", supplierName: "Distribuidora Alimentos Polar",
        items: [ { productId: "prod-2", productName: "Papas Fritas Lays 150g", quantity: 200, cost: 0.9 }, { productId: "prod-5", productName: "Pan de Sándwich Blanco", quantity: 50, cost: 1.3 } ],
        total: 245, date: subDays(new Date(), 5).toISOString(), documentNumber: "INV-POLAR-1122", responsible: "Usuario Demo",
    },
    {
        id: "PUR-003", supplierId: "sup-3", supplierName: "Procter & Gamble",
        items: [
          { productId: "prod-4", productName: "Detergente en Polvo 1kg", quantity: 50, cost: 3.2 },
          { productId: "prod-11", productName: "Jabón de Baño", quantity: 300, cost: 0.4 },
          { productId: "prod-12", productName: "Shampoo 400ml", quantity: 100, cost: 2.2 }
        ],
        total: 500, date: subDays(new Date(), 10).toISOString(), documentNumber: "INV-PG-5544", responsible: "Admin",
    }
];

export const mockInventoryMovements: InventoryMovement[] = [
    ...mockSales.flatMap(sale => sale.items.map(item => ({
        id: `mov-sale-${sale.id}-${item.productId}`, productName: item.productName, type: 'sale' as const, quantity: -item.quantity, date: sale.date, responsible: 'Sistema POS'
    }))),
    ...mockPurchases.flatMap(purchase => purchase.items.map(item => ({
        id: `mov-pur-${purchase.id}-${item.productId}`, productName: item.productName, type: 'purchase' as const, quantity: item.quantity, date: purchase.date, responsible: purchase.responsible || 'N/A'
    })))
];

export const mockCurrencyRates: CurrencyRate[] = [
    { id: 'rate-1', rate: 39.50, date: new Date().toISOString() },
    { id: 'rate-2', rate: 39.45, date: subDays(new Date(), 1).toISOString() },
    { id: 'rate-3', rate: 39.30, date: subDays(new Date(), 2).toISOString() },
];

export const paymentMethods = [
    { id: 'efectivo', name: 'Efectivo', requiresRef: false },
    { id: 'transferencia', name: 'Transferencia', requiresRef: true },
    { id: 'pago-movil', name: 'Pago Móvil', requiresRef: true },
    { id: 'tarjeta', name: 'Tarjeta', requiresRef: true },
    { id: 'zelle', name: 'Zelle', requiresRef: true },
    { id: 'otro', name: 'Otro', requiresRef: false },
];


export function factoryReset() {
    console.log("Performing factory reset on mock data...");
    
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
    
    console.log("Factory reset complete.");
}
