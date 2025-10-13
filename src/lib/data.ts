import type { Product, Sale, Unit, Family, Warehouse, Customer, Purchase, Ad, UserProfile, Store, CurrencyRate, PendingOrder, CashSession } from '@/lib/types';
import { PlaceHolderImages } from './placeholder-images';
import { subDays, addDays, startOfWeek, startOfMonth, startOfYear } from 'date-fns';

// --- IDs ÚNICOS Y CONSTANTES ---
export const defaultStoreId = 'store_clifp94l0000008l3b1z9f8j7';

// --- DATOS MUTABLES (ESTADO LOCAL DE LA APLICACIÓN) ---
// Estos `let` permiten que los datos sean modificados en tiempo de ejecución.

export let defaultStore: Store = {
  id: defaultStoreId,
  name: "Tienda Facil DEMO",
  ownerId: "5QLaiiIr4mcGsjRXVGeGx50nrpk1", // UID del super admin
  businessType: "Tecnologia",
  address: "Av. Principal, Local 1, Ciudad",
  phone: "+58 212-555-1234",
  slogan: "¡Gracias por tu compra!",
  logoUrl: "/tienda_facil_logo.svg",
  status: 'active',
  primaryCurrencyName: "Dólar Americano",
  primaryCurrencySymbol: "$",
  secondaryCurrencyName: "Bolívar Digital",
  secondaryCurrencySymbol: "Bs.",
  saleSeries: "SALE",
  saleCorrelative: 1,
  tax1: 16,
  tax2: 0,
  whatsapp: "+584126915593",
  tiktok: "@tiendafacil",
  meta: "@tiendafacil",
  useDemoData: true,
};

export let defaultUsers: UserProfile[] = [
    {
        uid: '5QLaiiIr4mcGsjRXVGeGx50nrpk1',
        email: 'corporacion1@gmail.com',
        displayName: 'Jorge Negrete',
        photoURL: 'https://i.imgur.com/8bXhQXa.png',
        role: 'superAdmin',
        status: 'active',
        storeId: defaultStoreId,
        createdAt: new Date().toISOString(),
    },
    {
        uid: 'user_admin_001',
        email: 'admin@tiendafacil.com',
        displayName: 'Admin Demo',
        photoURL: '/tienda_facil_logo.svg',
        role: 'admin',
        status: 'active',
        storeId: defaultStoreId,
        createdAt: new Date().toISOString(),
    },
    {
        uid: 'user_pos_001',
        email: 'pos@tiendafacil.com',
        displayName: 'POS Demo',
        photoURL: '/tienda_facil_logo.svg',
        role: 'pos',
        status: 'active',
        storeId: defaultStoreId,
        createdAt: new Date().toISOString(),
    },
    {
        uid: 'user_demo_001',
        email: 'demo@tiendafacil.com',
        displayName: 'User Demo',
        photoURL: '/tienda_facil_logo.svg',
        role: 'user',
        status: 'active',
        storeId: defaultStoreId,
        storeRequest: true, // Example of a user requesting a store
    }
];

export let pendingOrdersState: PendingOrder[] = [
    {
        id: 'PEND-DEMO-001',
        date: new Date().toISOString(),
        customerName: 'Jorge Negrete (Ejemplo)',
        customerPhone: '04121234567',
        items: [
            { productId: "prod-4", productName: "SSD NVMe 2TB", quantity: 1, price: 149.99 },
            { productId: "prod-3", productName: "Memoria RAM 32GB DDR5", quantity: 2, price: 129.99 }
        ],
        total: 409.97,
        storeId: defaultStoreId
    }
];

export let mockCurrencyRates: CurrencyRate[] = [
    { id: 'rate-1', rate: 39.50, date: new Date().toISOString() },
    { id: 'rate-2', rate: 39.45, date: subDays(new Date(), 1).toISOString() },
    { id: 'rate-3', rate: 39.40, date: subDays(new Date(), 2).toISOString() },
];

export let defaultCustomers: Customer[] = [
    { id: 'cust-1', name: 'John Doe', phone: '04125551234', address: '123 Main St', storeId: defaultStoreId },
    { id: 'cust-2', name: 'Jane Smith', phone: '04145555678', address: '456 Oak Ave', storeId: defaultStoreId },
];

export let defaultSuppliers: Supplier[] = [
    { id: 'sup-1', name: 'TechData Corp', phone: '111-2222', address: '789 Tech Rd', storeId: defaultStoreId },
    { id: 'sup-2', name: 'PC Components LLC', phone: '333-4444', address: '101 Component Ln', storeId: defaultStoreId },
];

export let initialUnits: Unit[] = [
    { id: 'unit-1', name: 'Unidad', storeId: defaultStoreId },
    { id: 'unit-2', name: 'Caja', storeId: defaultStoreId },
    { id: 'unit-3', name: 'Paquete', storeId: defaultStoreId },
];

export let initialFamilies: Family[] = [
    { id: 'fam-1', name: 'Tarjetas Gráficas', storeId: defaultStoreId },
    { id: 'fam-2', name: 'Procesadores', storeId: defaultStoreId },
    { id: 'fam-3', name: 'Memoria RAM', storeId: defaultStoreId },
    { id: 'fam-4', name: 'Almacenamiento', storeId: defaultStoreId },
    { id: 'fam-5', name: 'Impresoras y Accesorios', storeId: defaultStoreId },
    { id: 'fam-6', name: 'Proyectores', storeId: defaultStoreId },
    { id: 'fam-7', name: 'Accesorios de Cómputo', storeId: defaultStoreId },
];

export let initialWarehouses: Warehouse[] = [
    { id: 'wh-1', name: 'Almacén Principal', storeId: defaultStoreId },
    { id: 'wh-2', name: 'Depósito Secundario', storeId: defaultStoreId },
];

export let mockProducts: Product[] = [
  {
    id: "prod-1", name: "Tarjeta Gráfica RTX 4090", sku: "NV-RTX4090-01", stock: 15, price: 1799.99, wholesalePrice: 1750.00, cost: 1600.00, status: "active", tax1: true, tax2: false, unit: "Unidad", family: "Tarjetas Gráficas", warehouse: "Almacén Principal",
    description: "La GPU más potente para gaming y creación de contenido.",
    imageUrl: PlaceHolderImages.find(p => p.id === '1')?.imageUrl, imageHint: PlaceHolderImages.find(p => p.id === '1')?.imageHint, storeId: defaultStoreId, createdAt: subDays(new Date(), 10).toISOString(),
  },
  {
    id: "prod-2", name: "Procesador Intel Core i9-13900K", sku: "INT-i9-13900K-02", stock: 25, price: 589.00, wholesalePrice: 570.00, cost: 520.00, status: "active", tax1: true, tax2: false, unit: "Unidad", family: "Procesadores", warehouse: "Almacén Principal",
    description: "Procesador de alto rendimiento para gaming y productividad.",
    imageUrl: PlaceHolderImages.find(p => p.id === '2')?.imageUrl, imageHint: PlaceHolderImages.find(p => p.id === '2')?.imageHint, storeId: defaultStoreId, createdAt: subDays(new Date(), 20).toISOString(),
  },
  {
    id: "prod-3", name: "Memoria RAM 32GB DDR5", sku: "RAM-DDR5-32G-03", stock: 50, price: 129.99, wholesalePrice: 120.00, cost: 100.00, status: "promotion", tax1: true, tax2: false, unit: "Paquete", family: "Memoria RAM", warehouse: "Almacén Principal",
    description: "Kit de 2x16GB de memoria RAM DDR5 a 6000MHz.",
    imageUrl: PlaceHolderImages.find(p => p.id === '3')?.imageUrl, imageHint: PlaceHolderImages.find(p => p.id === '3')?.imageHint, storeId: defaultStoreId, createdAt: subDays(new Date(), 5).toISOString(),
  },
  {
    id: "prod-4", name: "SSD NVMe 2TB", sku: "SSD-NVME-2TB-04", stock: 40, price: 149.99, wholesalePrice: 140.00, cost: 125.00, status: "active", tax1: true, tax2: false, unit: "Unidad", family: "Almacenamiento", warehouse: "Almacén Principal",
    description: "Unidad de estado sólido de 2TB con velocidades de lectura/escritura ultrarrápidas.",
    imageUrl: PlaceHolderImages.find(p => p.id === '4')?.imageUrl, imageHint: PlaceHolderImages.find(p => p.id === '4')?.imageHint, storeId: defaultStoreId, createdAt: subDays(new Date(), 15).toISOString(),
  },
  {
    id: "prod-5", name: "Impresora Multifuncional EcoTank", sku: "EPS-ET4800-05", stock: 30, price: 279.99, wholesalePrice: 265.00, cost: 240.00, status: "active", tax1: true, tax2: false, unit: "Unidad", family: "Impresoras y Accesorios", warehouse: "Almacén Principal",
    description: "Imprime miles de páginas con los tanques de tinta de súper alta capacidad.",
    imageUrl: PlaceHolderImages.find(p => p.id === '9')?.imageUrl, imageHint: PlaceHolderImages.find(p => p.id === '9')?.imageHint, storeId: defaultStoreId, createdAt: subDays(new Date(), 30).toISOString(),
  },
];

const today = new Date();
export let mockSales: Sale[] = [
    { 
        id: "SALE-001", customerId: "cust-1", customerName: "John Doe",
        items: [ { productId: "prod-1", productName: "Tarjeta Gráfica RTX 4090", quantity: 1, price: 1799.99 } ],
        total: 1799.99, date: subDays(startOfMonth(today), 5).toISOString(), transactionType: 'contado', status: 'paid', paidAmount: 1799.99,
        payments: [{ id: 'pay-sale-001', amount: 1799.99, date: subDays(startOfMonth(today), 5).toISOString(), method: 'tarjeta', reference: '1234', receivedBy: 'Admin' }],
        storeId: defaultStoreId,
    },
    { 
        id: "SALE-002", customerId: "cust-2", customerName: "Jane Smith",
        items: [ { productId: "prod-2", productName: "Procesador Intel Core i9-13900K", quantity: 1, price: 589.00 } ],
        total: 589.00, date: subDays(today, 2).toISOString(), transactionType: 'credito', status: 'unpaid', paidAmount: 300,
        payments: [{ id: 'pay-sale-002', amount: 300, date: subDays(today, 2).toISOString(), method: 'pago-movil', reference: '012345', receivedBy: 'Demo' }],
        storeId: defaultStoreId,
    },
];

export let mockPurchases: Purchase[] = [
    { 
        id: "PUR-001", supplierId: "sup-1", supplierName: "TechData Corp",
        items: [ { productId: "prod-1", productName: "Tarjeta Gráfica RTX 4090", quantity: 10, cost: 1600.00 } ],
        total: 16000, date: subDays(startOfMonth(today), 10).toISOString(), documentNumber: "INV-TD-8899", responsible: "Admin",
        storeId: defaultStoreId,
    },
    { 
        id: "PUR-002", supplierId: "sup-2", supplierName: "PC Components LLC",
        items: [ { productId: "prod-4", productName: "SSD NVMe 2TB", quantity: 20, cost: 125.00 } ],
        total: 2500, date: startOfWeek(today).toISOString(), documentNumber: "INV-PC-1122", responsible: "Admin",
        storeId: defaultStoreId,
    },
];

export let mockAds: Ad[] = [
  {
    id: "ad-1", sku: "PROMO-001", name: "Descuento en Laptops", description: "Aprovecha el 20% de descuento en todas las laptops seleccionadas.", price: 999.99,
    imageUrl: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?q=80&w=600&auto=format&fit=crop", imageHint: "laptop computer",
    views: 1250, status: 'active', targetBusinessTypes: ['Tecnologia', 'Servicios Profesionales'],
    expiryDate: addDays(new Date(), 30).toISOString(), createdAt: new Date().toISOString(),
  },
  {
    id: "ad-2", sku: "PUB-REST-001", name: "El Sabor de la Casa", description: "Prueba nuestras nuevas hamburguesas gourmet.", price: 15.50,
    imageUrl: "https://images.unsplash.com/photo-1571091718767-18b5b1457add?q=80&w=600&auto=format&fit=crop", imageHint: "gourmet burger",
    views: 850, status: 'active', targetBusinessTypes: ['Restaurante'],
    expiryDate: addDays(new Date(), 15).toISOString(), createdAt: new Date().toISOString(),
  },
];

export let mockCashSessions: CashSession[] = [
    { 
        id: 'SES-001',
        storeId: defaultStoreId,
        openingDate: subDays(startOfMonth(today), 5).toISOString(),
        closingDate: subDays(startOfMonth(today), 5).toISOString(),
        openingBalance: 100,
        closingBalance: 1905.00,
        calculatedCash: 1899.99,
        difference: 5.01,
        status: 'closed',
        openedBy: 'Admin',
        closedBy: 'Admin',
        salesIds: ['SALE-001'],
        transactions: { 'tarjeta': 1799.99 }
    },
    { 
        id: 'SES-002',
        storeId: defaultStoreId,
        openingDate: subDays(today, 2).toISOString(),
        closingDate: subDays(today, 2).toISOString(),
        openingBalance: 50,
        closingBalance: 345.00,
        calculatedCash: 350.00,
        difference: -5.00,
        status: 'closed',
        openedBy: 'Demo',
        closedBy: 'Demo',
        salesIds: ['SALE-002'],
        transactions: { 'pago-movil': 300 }
    },
];

export const paymentMethods = [
    { id: 'efectivo', name: 'Efectivo', requiresRef: false },
    { id: 'transferencia', name: 'Transferencia', requiresRef: true },
    { id: 'pago-movil', name: 'Pago Móvil', requiresRef: true },
    { id: 'tarjeta', name: 'Tarjeta', requiresRef: true },
    { id: 'zelle', name: 'Zelle', requiresRef: true },
    { id: 'otro', name: 'Otro', requiresRef: false },
];

export const businessCategories: string[] = [
    'Tecnologia',
    'Restaurante',
    'Tienda de Ropa',
    'Supermercado',
    'Servicios Profesionales',
    'Ferretería',
    'Repuestos',
    'Salud y Belleza',
    'Otro'
];
