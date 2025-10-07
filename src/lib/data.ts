
import type { Product, InventoryMovement, Sale, Unit, Family, Warehouse, Customer, Purchase, Supplier, CurrencyRate, Payment } from '@/lib/types';
import { PlaceHolderImages } from './placeholder-images';

export const defaultCustomers: Customer[] = [
    { id: 'eventual', name: 'Cliente Eventual', phone: '', address: '' },
    { id: 'cust-1', name: 'John Doe', phone: '555-1234', address: '123 Main St' },
    { id: 'cust-2', name: 'Jane Smith', phone: '555-5678', address: '456 Oak Ave' },
];

export const defaultSuppliers: Supplier[] = [
    { id: 'sup-1', name: 'Distribuidora Alimentos Polar', phone: '111-2222', address: '789 Food Rd' },
    { id: 'sup-2', name: 'Coca-Cola FEMSA', phone: '333-4444', address: '101 Beverage Ln' },
];

export let initialUnits: Unit[] = [
    { id: 'unit-1', name: 'Unidad' },
    { id: 'unit-2', name: 'Caja' },
    { id: 'unit-3', name: 'Paquete' },
];

export let initialFamilies: Family[] = [
    { id: 'fam-1', name: 'Bebidas' },
    { id: 'fam-2', name: 'Snacks' },
    { id: 'fam-3', name: 'Lácteos y Huevos' },
    { id: 'fam-4', name: 'Limpieza' },
    { id: 'fam-5', name: 'Panadería' },
];

export let initialWarehouses: Warehouse[] = [
    { id: 'wh-1', name: 'Almacén Principal' },
    { id: 'wh-2', name: 'Depósito Secundario' },
];

export const mockProducts: Product[] = [
  {
    id: "prod-1",
    name: "Refresco Coca-Cola 2L",
    sku: "CC-2L-001",
    stock: 50,
    price: 2.5,
    wholesalePrice: 2.2,
    cost: 1.8,
    status: "active",
    tax1: true,
    tax2: false,
    unit: "Unidad",
    family: "Bebidas",
    warehouse: "Almacén Principal",
    description: "Refresco carbonatado sabor cola, botella de 2 litros.",
    imageUrl: PlaceHolderImages[0].imageUrl,
    imageHint: PlaceHolderImages[0].imageHint,
  },
  {
    id: "prod-2",
    name: "Papas Fritas Lays 150g",
    sku: "LAYS-150G-002",
    stock: 120,
    price: 1.5,
    wholesalePrice: 1.2,
    cost: 0.9,
    status: "active",
    tax1: true,
    tax2: false,
    unit: "Unidad",
    family: "Snacks",
    warehouse: "Almacén Principal",
    description: "Papas fritas naturales en bolsa de 150g.",
    imageUrl: PlaceHolderImages[1].imageUrl,
    imageHint: PlaceHolderImages[1].imageHint,
  },
  {
    id: "prod-3",
    name: "Leche Completa 1L",
    sku: "LECHE-1L-003",
    stock: 80,
    price: 1.8,
    wholesalePrice: 1.6,
    cost: 1.2,
    status: "active",
    tax1: true,
    tax2: false,
    unit: "Unidad",
    family: "Lácteos y Huevos",
    warehouse: "Almacén Principal",
    description: "Leche de vaca pasteurizada, cartón de 1 litro.",
    imageUrl: PlaceHolderImages[2].imageUrl,
    imageHint: PlaceHolderImages[2].imageHint,
  },
   {
    id: "prod-4",
    name: "Limpiador Multiuso Mistolin 1L",
    sku: "MIST-1L-004",
    stock: 60,
    price: 3.0,
    wholesalePrice: 2.7,
    cost: 2.1,
    status: "active",
    tax1: true,
    tax2: false,
    unit: "Unidad",
    family: "Limpieza",
    warehouse: "Almacén Principal",
    description: "Limpiador desinfectante para todo tipo de superficies, aroma a lavanda.",
    imageUrl: PlaceHolderImages[3].imageUrl,
    imageHint: PlaceHolderImages[3].imageHint,
  },
  {
    id: "prod-5",
    name: "Pan de Sándwich Blanco",
    sku: "PAN-SW-005",
    stock: 40,
    price: 2.0,
    wholesalePrice: 1.8,
    cost: 1.3,
    status: "active",
    tax1: true,
    tax2: false,
    unit: "Unidad",
    family: "Panadería",
    warehouse: "Almacén Principal",
    description: "Pan de molde blanco, ideal para sándwiches.",
    imageUrl: PlaceHolderImages[4].imageUrl,
    imageHint: PlaceHolderImages[4].imageHint,
  },
  {
    id: "prod-6",
    name: "Huevos (Cartón de 12)",
    sku: "HUEVOS-12-006",
    stock: 30,
    price: 3.5,
    wholesalePrice: 3.1,
    cost: 2.5,
    status: "active",
    tax1: true,
    tax2: false,
    unit: "Unidad",
    family: "Lácteos y Huevos",
    warehouse: "Almacén Principal",
    description: "Cartón con 12 huevos de gallina frescos.",
    imageUrl: PlaceHolderImages[5].imageUrl,
    imageHint: PlaceHolderImages[5].imageHint,
  },
];


export const mockSales: Sale[] = [
    {
        id: "SALE-001",
        customerId: "cust-1",
        customerName: "John Doe",
        items: [
            { productId: "prod-1", productName: "Refresco Coca-Cola 2L", quantity: 2, price: 2.5 },
            { productId: "prod-2", productName: "Papas Fritas Lays 150g", quantity: 3, price: 1.5 }
        ],
        total: 9.5,
        date: new Date('2025-01-15T14:30:00Z').toISOString(), // 2025
        transactionType: 'contado',
        status: 'paid',
        paidAmount: 9.5,
        payments: [{ id: 'pay-sale-001', amount: 9.5, date: new Date('2025-01-15T14:30:00Z').toISOString(), method: 'efectivo' }]
    },
    {
        id: "SALE-002",
        customerId: "cust-2",
        customerName: "Jane Smith",
        items: [
            { productId: "prod-3", productName: "Leche Completa 1L", quantity: 6, price: 1.6 } // wholesale
        ],
        total: 9.6,
        date: new Date('2025-02-20T10:00:00Z').toISOString(), // 2025
        transactionType: 'credito',
        status: 'unpaid',
        paidAmount: 5,
        payments: [{ id: 'pay-sale-002', amount: 5, date: new Date('2025-02-21T18:00:00Z').toISOString(), method: 'pago-movil', reference: '012345' }]
    }
];

export const mockPurchases: Purchase[] = [
    {
        id: "PUR-001",
        supplierId: "sup-2",
        supplierName: "Coca-Cola FEMSA",
        items: [
            { productId: "prod-1", productName: "Refresco Coca-Cola 2L", quantity: 100, cost: 1.8 }
        ],
        total: 180,
        date: new Date('2025-01-10T09:00:00Z').toISOString(), // 2025
        documentNumber: "INV-CC-8899",
        responsible: "Admin",
    }
];

export const mockInventoryMovements: InventoryMovement[] = [
    ...mockSales.flatMap(sale => sale.items.map(item => ({
        id: `mov-sale-${sale.id}-${item.productId}`,
        productName: item.productName,
        type: 'sale' as const,
        quantity: -item.quantity,
        date: sale.date,
        responsible: 'Sistema POS'
    }))),
    ...mockPurchases.flatMap(purchase => purchase.items.map(item => ({
        id: `mov-pur-${purchase.id}-${item.productId}`,
        productName: item.productName,
        type: 'purchase' as const,
        quantity: item.quantity,
        date: purchase.date,
        responsible: purchase.responsible || 'N/A'
    })))
];

export const mockCurrencyRates: CurrencyRate[] = [
    { id: 'rate-1', rate: 39.50, date: new Date('2025-01-01T12:00:00Z').toISOString() },
    { id: 'rate-2', rate: 39.45, date: new Date('2025-01-02T12:00:00Z').toISOString() },
    { id: 'rate-3', rate: 39.30, date: new Date('2025-01-03T12:00:00Z').toISOString() },
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
