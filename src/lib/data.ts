
import type { Product, InventoryMovement, Sale, Unit, Family, Warehouse, Customer, Purchase, Supplier, CurrencyRate, Payment } from '@/lib/types';
import { PlaceHolderImages } from './placeholder-images';
import { subDays, subHours } from 'date-fns';

export const defaultCustomers: Customer[] = [
    { id: 'eventual', name: 'Cliente Eventual', phone: '', address: '' },
    { id: 'cust-1', name: 'John Doe', phone: '555-1234', address: '123 Main St' },
    { id: 'cust-2', name: 'Jane Smith', phone: '555-5678', address: '456 Oak Ave' },
];

export const defaultSuppliers: Supplier[] = [
    { id: 'sup-1', name: 'TechData Corp', phone: '111-2222', address: '789 Tech Rd' },
    { id: 'sup-2', name: 'PC Components LLC', phone: '333-4444', address: '101 Component Ln' },
    { id: 'sup-3', name: 'Global Microchips', phone: '555-5555', address: '202 Silicon St' },
];

export let initialUnits: Unit[] = [
    { id: 'unit-1', name: 'Unidad' },
    { id: 'unit-2', name: 'Caja' },
    { id: 'unit-3', name: 'Paquete' },
];

export let initialFamilies: Family[] = [
    { id: 'fam-1', name: 'Tarjetas Gráficas' },
    { id: 'fam-2', name: 'Procesadores' },
    { id: 'fam-3', name: 'Memoria RAM' },
    { id: 'fam-4', name: 'Almacenamiento' },
    { id: 'fam-5', name: 'Tarjetas Madre' },
    { id: 'fam-6', name: 'Fuentes de Poder' },
];

export let initialWarehouses: Warehouse[] = [
    { id: 'wh-1', name: 'Almacén Principal' },
    { id: 'wh-2', name: 'Depósito Secundario' },
];

export const mockProducts: Product[] = [
  {
    id: "prod-1", name: "Tarjeta Gráfica RTX 4090", sku: "NV-RTX4090-01", stock: 15, price: 1799.99, wholesalePrice: 1750.00, cost: 1600.00, status: "active", tax1: true, tax2: true, unit: "Unidad", family: "Tarjetas Gráficas", warehouse: "Almacén Principal",
    description: "La GPU más potente para gaming y creación de contenido.",
    imageUrl: PlaceHolderImages.find(p => p.id === '1')?.imageUrl, imageHint: PlaceHolderImages.find(p => p.id === '1')?.imageHint,
  },
  {
    id: "prod-2", name: "Procesador Intel Core i9-13900K", sku: "INT-i9-13900K-02", stock: 25, price: 589.00, wholesalePrice: 570.00, cost: 520.00, status: "active", tax1: true, tax2: false, unit: "Unidad", family: "Procesadores", warehouse: "Almacén Principal",
    description: "Procesador de alto rendimiento para gaming y productividad.",
    imageUrl: PlaceHolderImages.find(p => p.id === '2')?.imageUrl, imageHint: PlaceHolderImages.find(p => p.id === '2')?.imageHint,
  },
  {
    id: "prod-3", name: "Memoria RAM 32GB DDR5", sku: "RAM-DDR5-32G-03", stock: 50, price: 129.99, wholesalePrice: 120.00, cost: 100.00, status: "active", tax1: true, tax2: false, unit: "Paquete", family: "Memoria RAM", warehouse: "Almacén Principal",
    description: "Kit de 2x16GB de memoria RAM DDR5 a 6000MHz.",
    imageUrl: PlaceHolderImages.find(p => p.id === '3')?.imageUrl, imageHint: PlaceHolderImages.find(p => p.id === '3')?.imageHint,
  },
  {
    id: "prod-4", name: "SSD NVMe 2TB", sku: "SSD-NVME-2TB-04", stock: 40, price: 149.99, wholesalePrice: 140.00, cost: 125.00, status: "active", tax1: true, tax2: false, unit: "Unidad", family: "Almacenamiento", warehouse: "Almacén Principal",
    description: "Unidad de estado sólido de 2TB con velocidades de lectura/escritura ultrarrápidas.",
    imageUrl: PlaceHolderImages.find(p => p.id === '4')?.imageUrl, imageHint: PlaceHolderImages.find(p => p.id === '4')?.imageHint,
  },
  {
    id: "prod-5", name: "Tarjeta Madre Z790", sku: "MB-Z790-WIFI-05", stock: 30, price: 349.99, wholesalePrice: 330.00, cost: 300.00, status: "active", tax1: true, tax2: false, unit: "Unidad", family: "Tarjetas Madre", warehouse: "Almacén Principal",
    description: "Tarjeta madre con chipset Z790, soporte para DDR5 y WiFi 6E.",
    imageUrl: PlaceHolderImages.find(p => p.id === '5')?.imageUrl, imageHint: PlaceHolderImages.find(p => p.id === '5')?.imageHint,
  },
  {
    id: "prod-6", name: "Fuente de Poder 1000W Gold", sku: "PSU-1000W-G-06", stock: 35, price: 199.99, wholesalePrice: 185.00, cost: 160.00, status: "active", tax1: true, tax2: false, unit: "Unidad", family: "Fuentes de Poder", warehouse: "Almacén Principal",
    description: "Fuente de poder de 1000W con certificación 80 Plus Gold, completamente modular.",
    imageUrl: PlaceHolderImages.find(p => p.id === '6')?.imageUrl, imageHint: PlaceHolderImages.find(p => p.id === '6')?.imageHint,
  },
  {
    id: "prod-7", name: "Tarjeta Gráfica RX 7900 XTX", sku: "AMD-RX7900XTX-07", stock: 20, price: 999.99, wholesalePrice: 950.00, cost: 880.00, status: "active", tax1: true, tax2: true, unit: "Unidad", family: "Tarjetas Gráficas", warehouse: "Almacén Principal",
    description: "GPU de alta gama de AMD, excelente para gaming en 4K.",
    imageUrl: PlaceHolderImages.find(p => p.id === '7')?.imageUrl, imageHint: PlaceHolderImages.find(p => p.id === '7')?.imageHint,
  },
  {
    id: "prod-8", name: "Procesador AMD Ryzen 9 7950X", sku: "AMD-R9-7950X-08", stock: 22, price: 549.00, wholesalePrice: 530.00, cost: 490.00, status: "active", tax1: true, tax2: false, unit: "Unidad", family: "Procesadores", warehouse: "Almacén Principal",
    description: "Procesador de 16 núcleos y 32 hilos para máxima productividad.",
    imageUrl: PlaceHolderImages.find(p => p.id === '8')?.imageUrl, imageHint: PlaceHolderImages.find(p => p.id === '8')?.imageHint,
  },
];


export const mockSales: Sale[] = [
    {
        id: "SALE-001", customerId: "cust-1", customerName: "John Doe",
        items: [ { productId: "prod-1", productName: "Tarjeta Gráfica RTX 4090", quantity: 1, price: 1799.99 } ],
        total: 1799.99, date: subDays(new Date(), 8).toISOString(), transactionType: 'contado', status: 'paid', paidAmount: 1799.99,
        payments: [{ id: 'pay-sale-001', amount: 1799.99, date: subDays(new Date(), 8).toISOString(), method: 'tarjeta', reference: '1234' }]
    },
    {
        id: "SALE-002", customerId: "cust-2", customerName: "Jane Smith",
        items: [ { productId: "prod-2", productName: "Procesador Intel Core i9-13900K", quantity: 1, price: 589.00 }, { productId: "prod-5", productName: "Tarjeta Madre Z790", quantity: 1, price: 349.99 } ],
        total: 938.99, date: subDays(new Date(), 5).toISOString(), transactionType: 'credito', status: 'unpaid', paidAmount: 500,
        payments: [{ id: 'pay-sale-002', amount: 500, date: subDays(new Date(), 4).toISOString(), method: 'pago-movil', reference: '012345' }]
    },
    {
        id: "SALE-003", customerId: "eventual", customerName: "Cliente Eventual",
        items: [ { productId: "prod-3", productName: "Memoria RAM 32GB DDR5", quantity: 2, price: 129.99 } ],
        total: 259.98, date: subHours(new Date(), 3).toISOString(), transactionType: 'contado', status: 'paid', paidAmount: 259.98,
        payments: [{ id: 'pay-sale-003', amount: 259.98, date: subHours(new Date(), 3).toISOString(), method: 'efectivo' }]
    },
];

export const mockPurchases: Purchase[] = [
    {
        id: "PUR-001", supplierId: "sup-1", supplierName: "TechData Corp",
        items: [ { productId: "prod-1", productName: "Tarjeta Gráfica RTX 4090", quantity: 10, cost: 1600.00 } ],
        total: 16000, date: subDays(new Date(), 15).toISOString(), documentNumber: "INV-TD-8899", responsible: "Admin",
    },
    {
        id: "PUR-002", supplierId: "sup-2", supplierName: "PC Components LLC",
        items: [ { productId: "prod-2", productName: "Procesador Intel Core i9-13900K", quantity: 20, cost: 520.00 }, { productId: "prod-3", productName: "Memoria RAM 32GB DDR5", quantity: 30, cost: 100.00 } ],
        total: 13400, date: subDays(new Date(), 10).toISOString(), documentNumber: "INV-PCC-1122", responsible: "Usuario Demo",
    },
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
