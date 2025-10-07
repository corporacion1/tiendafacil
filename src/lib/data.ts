
import type { Product, InventoryMovement, Sale, Unit, Family, Warehouse, Customer, Purchase, Supplier, CurrencyRate } from '@/lib/types';
import { PlaceHolderImages } from './placeholder-images';

export const defaultCustomers: Customer[] = [
    { id: 'eventual', name: 'Cliente Eventual', phone: '', address: '' },
    { id: 'cust-1', name: 'John Doe', phone: '555-1234', address: '123 Main St' },
    { id: 'cust-2', name: 'Jane Smith', phone: '555-5678', address: '456 Oak Ave' },
];

export const defaultSuppliers: Supplier[] = [
    { id: 'sup-1', name: 'Global Tech', phone: '111-2222', address: '789 Tech Rd' },
    { id: 'sup-2', name: 'Componentes C.A.', phone: '333-4444', address: '101 Component Ln' },
];

export let initialUnits: Unit[] = [
    { id: 'unit-1', name: 'Unidad' },
    { id: 'unit-2', name: 'Caja' },
    { id: 'unit-3', name: 'Paquete' },
];

export let initialFamilies: Family[] = [
    { id: 'fam-1', name: 'Laptops' },
    { id: 'fam-2', name: 'Periféricos' },
    { id: 'fam-3', name: 'Monitores' },
    { id: 'fam-4', name: 'Componentes' },
];

export let initialWarehouses: Warehouse[] = [
    { id: 'wh-1', name: 'Almacén Principal' },
    { id: 'wh-2', name: 'Depósito Secundario' },
];

export const mockProducts: Product[] = [
  {
    id: "prod-1",
    name: "Laptop Pro X1",
    sku: "LPX1-001",
    stock: 25,
    price: 1200,
    wholesalePrice: 1100,
    cost: 850,
    status: "active",
    tax1: true,
    tax2: false,
    unit: "Unidad",
    family: "Laptops",
    warehouse: "Almacén Principal",
    description: "Laptop de alto rendimiento para profesionales.",
    imageUrl: PlaceHolderImages[0].imageUrl,
    imageHint: PlaceHolderImages[0].imageHint,
  },
  {
    id: "prod-2",
    name: "Mouse Inalámbrico Silencioso",
    sku: "MWS-002",
    stock: 150,
    price: 25,
    wholesalePrice: 20,
    cost: 12,
    status: "active",
    tax1: true,
    tax2: false,
    unit: "Unidad",
    family: "Periféricos",
    warehouse: "Almacén Principal",
    description: "Mouse ergonómico con clicks silenciosos.",
    imageUrl: PlaceHolderImages[1].imageUrl,
    imageHint: PlaceHolderImages[1].imageHint,
  },
  {
    id: "prod-3",
    name: "Teclado Mecánico RGB",
    sku: "KBD-RGB-003",
    stock: 75,
    price: 80,
    wholesalePrice: 70,
    cost: 50,
    status: "active",
    tax1: true,
    tax2: true,
    unit: "Unidad",
    family: "Periféricos",
    warehouse: "Almacén Principal",
    description: "Teclado mecánico con switches rojos e iluminación RGB personalizable.",
    imageUrl: PlaceHolderImages[2].imageUrl,
    imageHint: PlaceHolderImages[2].imageHint,
  },
   {
    id: "prod-4",
    name: "Monitor 4K 27 pulgadas",
    sku: "MON-4K-004",
    stock: 40,
    price: 450,
    wholesalePrice: 420,
    cost: 300,
    status: "active",
    tax1: true,
    tax2: false,
    unit: "Unidad",
    family: "Monitores",
    warehouse: "Almacén Principal",
    description: "Monitor de alta resolución con colores vibrantes.",
    imageUrl: PlaceHolderImages[3].imageUrl,
    imageHint: PlaceHolderImages[3].imageHint,
  },
  {
    id: "prod-5",
    name: "Hub USB-C 7-en-1",
    sku: "HUB-C-005",
    stock: 120,
    price: 45,
    wholesalePrice: 40,
    cost: 25,
    status: "active",
    tax1: true,
    tax2: false,
    unit: "Unidad",
    family: "Periféricos",
    warehouse: "Almacén Principal",
    description: "Hub multipuerto para expandir la conectividad.",
    imageUrl: PlaceHolderImages[4].imageUrl,
    imageHint: PlaceHolderImages[4].imageHint,
  },
  {
    id: "prod-6",
    name: "Webcam Full HD 1080p",
    sku: "WC-HD-006",
    stock: 90,
    price: 60,
    wholesalePrice: 50,
    cost: 35,
    status: "active",
    tax1: true,
    tax2: false,
    unit: "Unidad",
    family: "Periféricos",
    warehouse: "Almacén Principal",
    description: "Webcam de alta definición para videollamadas claras.",
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
            { productId: "prod-1", productName: "Laptop Pro X1", quantity: 1, price: 1200 },
            { productId: "prod-2", productName: "Mouse Inalámbrico Silencioso", quantity: 1, price: 25 }
        ],
        total: 1225,
        date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
        transactionType: 'contado',
        paymentMethod: 'tarjeta',
        status: 'paid',
        paidAmount: 1225,
    },
    {
        id: "SALE-002",
        customerId: "cust-2",
        customerName: "Jane Smith",
        items: [
            { productId: "prod-3", productName: "Teclado Mecánico RGB", quantity: 2, price: 70 } // wholesale
        ],
        total: 140,
        date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
        transactionType: 'credito',
        status: 'unpaid',
        paidAmount: 50,
        payments: [{ id: 'pay-1', amount: 50, date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString() }]
    }
];

export const mockPurchases: Purchase[] = [
    {
        id: "PUR-001",
        supplierId: "sup-1",
        supplierName: "Global Tech",
        items: [
            { productId: "prod-1", productName: "Laptop Pro X1", quantity: 10, cost: 850 },
            { productId: "prod-4", productName: "Monitor 4K 27 pulgadas", quantity: 20, cost: 300 }
        ],
        total: 14500,
        date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days ago
        documentNumber: "INV-GT-5582",
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
    { id: 'rate-1', rate: 39.50, date: new Date().toISOString() },
    { id: 'rate-2', rate: 39.45, date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() },
    { id: 'rate-3', rate: 39.30, date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() },
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
