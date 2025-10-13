import type { Product, Sale, Unit, Family, Warehouse, Customer, Purchase, Ad, UserProfile, Store, CurrencyRate, PendingOrder, CashSession } from '@/lib/types';
import { PlaceHolderImages } from './placeholder-images';
import { subDays, addDays, startOfWeek, startOfMonth, startOfYear } from 'date-fns';

// --- IDs ÚNICOS Y CONSTANTES ---
// ID único y robusto para la tienda por defecto.
export const defaultStoreId = 'store_clifp94l0000008l3b1z9f8j7';

// --- CONFIGURACIÓN DE LA TIENDA POR DEFECTO ---
export const defaultStore: Store = {
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
};

// --- USUARIOS POR DEFECTO ---
export const defaultUsers: UserProfile[] = [
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
        displayName: 'admin',
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
        createdAt: new Date().toISOString(),
    }
];

// --- DATOS DE MUESTRA (TODOS CONECTADOS AL storeId por defecto) ---

export let pendingOrdersState: PendingOrder[] = [
    {
        id: 'PEND-DEMO-001',
        date: new Date().toISOString(),
        customerName: 'Jorge Negrete (Ejemplo)',
        customerPhone: '555-123-4567',
        items: [
            { productId: "prod-4", productName: "SSD NVMe 2TB", quantity: 1, price: 149.99 },
            { productId: "prod-3", productName: "Memoria RAM 32GB DDR5", quantity: 2, price: 129.99 }
        ],
        total: 409.97,
        storeId: defaultStoreId
    }
];

export const mockCurrencyRates: CurrencyRate[] = [
    { id: 'rate-1', rate: 36.50, date: new Date().toISOString() },
    { id: 'rate-2', rate: 36.45, date: subDays(new Date(), 1).toISOString() },
    { id: 'rate-3', rate: 36.40, date: subDays(new Date(), 2).toISOString() },
];

export const defaultCustomers: Omit<Customer, 'storeId'>[] = [
    { id: 'cust-1', name: 'John Doe', phone: '555-1234', address: '123 Main St' },
    { id: 'cust-2', name: 'Jane Smith', phone: '555-5678', address: '456 Oak Ave' },
];

export const defaultSuppliers: Omit<Supplier, 'storeId'>[] = [
    { id: 'sup-1', name: 'TechData Corp', phone: '111-2222', address: '789 Tech Rd' },
    { id: 'sup-2', name: 'PC Components LLC', phone: '333-4444', address: '101 Component Ln' },
];

export const initialUnits: Omit<Unit, 'storeId'>[] = [
    { id: 'unit-1', name: 'Unidad' },
    { id: 'unit-2', name: 'Caja' },
    { id: 'unit-3', name: 'Paquete' },
];

export const initialFamilies: Omit<Family, 'storeId'>[] = [
    { id: 'fam-1', name: 'Tarjetas Gráficas' },
    { id: 'fam-2', name: 'Procesadores' },
    { id: 'fam-3', name: 'Memoria RAM' },
    { id: 'fam-4', name: 'Almacenamiento' },
    { id: 'fam-5', name: 'Impresoras y Accesorios' },
    { id: 'fam-6', name: 'Proyectores' },
    { id: 'fam-7', name: 'Accesorios de Cómputo' },
];

export const initialWarehouses: Omit<Warehouse, 'storeId'>[] = [
    { id: 'wh-1', name: 'Almacén Principal' },
    { id: 'wh-2', name: 'Depósito Secundario' },
];

export const mockProducts: Omit<Product, 'createdAt' | 'storeId'>[] = [
  {
    id: "prod-1", name: "Tarjeta Gráfica RTX 4090", sku: "NV-RTX4090-01", stock: 15, price: 1799.99, wholesalePrice: 1750.00, cost: 1600.00, status: "active", tax1: true, tax2: false, unit: "Unidad", family: "Tarjetas Gráficas", warehouse: "Almacén Principal",
    description: "La GPU más potente para gaming y creación de contenido.",
    imageUrl: PlaceHolderImages.find(p => p.id === '1')?.imageUrl, imageHint: PlaceHolderImages.find(p => p.id === '1')?.imageHint,
  },
  {
    id: "prod-2", name: "Procesador Intel Core i9-13900K", sku: "INT-i9-13900K-02", stock: 25, price: 589.00, wholesalePrice: 570.00, cost: 520.00, status: "active", tax1: true, tax2: false, unit: "Unidad", family: "Procesadores", warehouse: "Almacén Principal",
    description: "Procesador de alto rendimiento para gaming y productividad.",
    imageUrl: PlaceHolderImages.find(p => p.id === '2')?.imageUrl, imageHint: PlaceHolderImages.find(p => p.id === '2')?.imageHint,
  },
  {
    id: "prod-3", name: "Memoria RAM 32GB DDR5", sku: "RAM-DDR5-32G-03", stock: 50, price: 129.99, wholesalePrice: 120.00, cost: 100.00, status: "promotion", tax1: true, tax2: false, unit: "Paquete", family: "Memoria RAM", warehouse: "Almacén Principal",
    description: "Kit de 2x16GB de memoria RAM DDR5 a 6000MHz.",
    imageUrl: PlaceHolderImages.find(p => p.id === '3')?.imageUrl, imageHint: PlaceHolderImages.find(p => p.id === '3')?.imageHint,
  },
  {
    id: "prod-4", name: "SSD NVMe 2TB", sku: "SSD-NVME-2TB-04", stock: 40, price: 149.99, wholesalePrice: 140.00, cost: 125.00, status: "active", tax1: true, tax2: false, unit: "Unidad", family: "Almacenamiento", warehouse: "Almacén Principal",
    description: "Unidad de estado sólido de 2TB con velocidades de lectura/escritura ultrarrápidas.",
    imageUrl: PlaceHolderImages.find(p => p.id === '4')?.imageUrl, imageHint: PlaceHolderImages.find(p => p.id === '4')?.imageHint,
  },
  {
    id: "prod-5", name: "Impresora Multifuncional EcoTank", sku: "EPS-ET4800-05", stock: 30, price: 279.99, wholesalePrice: 265.00, cost: 240.00, status: "active", tax1: true, tax2: false, unit: "Unidad", family: "Impresoras y Accesorios", warehouse: "Almacén Principal",
    description: "Imprime miles de páginas con los tanques de tinta de súper alta capacidad.",
    imageUrl: PlaceHolderImages.find(p => p.id === '9')?.imageUrl, imageHint: PlaceHolderImages.find(p => p.id === '9')?.imageHint,
  },
  {
    id: "prod-6", name: "Proyector LED Full HD", sku: "PROJ-LED-FHD-06", stock: 18, price: 199.99, wholesalePrice: 185.00, cost: 160.00, status: "active", tax1: true, tax2: false, unit: "Unidad", family: "Proyectores", warehouse: "Almacén Principal",
    description: "Proyector compacto y potente con resolución nativa 1080p y 9500 lúmenes.",
    imageUrl: PlaceHolderImages.find(p => p.id === '10')?.imageUrl, imageHint: PlaceHolderImages.find(p => p.id === '10')?.imageHint,
  },
  {
    id: "prod-7", name: "Teclado Mecánico RGB", sku: "ACC-KEYB-RGB-07", stock: 60, price: 89.99, wholesalePrice: 80.00, cost: 70.00, status: "promotion", tax1: true, tax2: false, unit: "Unidad", family: "Accesorios de Cómputo", warehouse: "Almacén Principal",
    description: "Teclado mecánico con switches rojos e iluminación RGB personalizable.",
    imageUrl: PlaceHolderImages.find(p => p.id === '11')?.imageUrl, imageHint: PlaceHolderImages.find(p => p.id === '11')?.imageHint,
  },
  {
    id: "prod-8", name: "Mouse Gamer Inalámbrico", sku: "ACC-MSE-WRLS-08", stock: 75, price: 49.99, wholesalePrice: 45.00, cost: 35.00, status: "active", tax1: true, tax2: false, unit: "Unidad", family: "Accesorios de Cómputo", warehouse: "Almacén Principal",
    description: "Mouse ligero con sensor óptico de alta precisión y tecnología inalámbrica de baja latencia.",
    imageUrl: PlaceHolderImages.find(p => p.id === '12')?.imageUrl, imageHint: PlaceHolderImages.find(p => p.id === '12')?.imageHint,
  },
  {
    id: "prod-9", name: "Cartucho de Tinta Negra 544", sku: "INK-544-BLK-09", stock: 150, price: 14.99, wholesalePrice: 12.50, cost: 10.00, status: "active", tax1: true, tax2: false, unit: "Unidad", family: "Impresoras y Accesorios", warehouse: "Almacén Principal",
    description: "Cartucho de tinta original para impresoras EcoTank. Rendimiento de 4500 páginas.",
    imageUrl: PlaceHolderImages.find(p => p.id === '13')?.imageUrl, imageHint: PlaceHolderImages.find(p => p.id === '13')?.imageHint,
  },
  {
    id: "prod-10", name: "Webcam Full HD 1080p", sku: "ACC-CAM-FHD-10", stock: 45, price: 39.99, wholesalePrice: 35.00, cost: 30.00, status: "active", tax1: true, tax2: false, unit: "Unidad", family: "Accesorios de Cómputo", warehouse: "Almacén Principal",
    description: "Webcam con micrófono incorporado, ideal para streaming y videoconferencias.",
    imageUrl: PlaceHolderImages.find(p => p.id === '14')?.imageUrl, imageHint: PlaceHolderImages.find(p => p.id === '14')?.imageHint,
  },
];

const today = new Date();
export const mockSales: Omit<Sale, 'storeId'>[] = [
    { // Venta del mes pasado (para tener datos históricos)
        id: "SALE-001", customerId: "cust-1", customerName: "John Doe",
        items: [ { productId: "prod-1", productName: "Tarjeta Gráfica RTX 4090", quantity: 1, price: 1799.99 } ],
        total: 1799.99, date: subDays(startOfMonth(today), 5).toISOString(), transactionType: 'contado', status: 'paid', paidAmount: 1799.99,
        payments: [{ id: 'pay-sale-001', amount: 1799.99, date: subDays(startOfMonth(today), 5).toISOString(), method: 'tarjeta', reference: '1234', receivedBy: 'Admin' }]
    },
    { // Venta de la semana actual
        id: "SALE-002", customerId: "cust-2", customerName: "Jane Smith",
        items: [ { productId: "prod-2", productName: "Procesador Intel Core i9-13900K", quantity: 1, price: 589.00 } ],
        total: 589.00, date: subDays(today, 2).toISOString(), transactionType: 'credito', status: 'unpaid', paidAmount: 300,
        payments: [{ id: 'pay-sale-002', amount: 300, date: subDays(today, 2).toISOString(), method: 'pago-movil', reference: '012345', receivedBy: 'Demo' }]
    },
     { // Venta de hoy
        id: "SALE-003", customerId: "eventual", customerName: "Cliente Eventual",
        items: [ { productId: "prod-3", productName: "Memoria RAM 32GB DDR5", quantity: 2, price: 129.99 } ],
        total: 259.98, date: new Date().toISOString(), transactionType: 'contado', status: 'paid', paidAmount: 259.98,
        payments: [{ id: 'pay-sale-003', amount: 259.98, date: new Date().toISOString(), method: 'efectivo', reference: '', receivedBy: 'Admin' }]
    },
];

export const mockPurchases: Omit<Purchase, 'storeId'>[] = [
    { // Compra del mes pasado
        id: "PUR-001", supplierId: "sup-1", supplierName: "TechData Corp",
        items: [ { productId: "prod-1", productName: "Tarjeta Gráfica RTX 4090", quantity: 10, cost: 1600.00 } ],
        total: 16000, date: subDays(startOfMonth(today), 10).toISOString(), documentNumber: "INV-TD-8899", responsible: "Admin",
    },
    { // Compra de esta semana
        id: "PUR-002", supplierId: "sup-2", supplierName: "PC Components LLC",
        items: [ { productId: "prod-4", productName: "SSD NVMe 2TB", quantity: 20, cost: 125.00 } ],
        total: 2500, date: startOfWeek(today).toISOString(), documentNumber: "INV-PC-1122", responsible: "Admin",
    },
    { // Compra de hoy
        id: "PUR-003", supplierId: "sup-1", supplierName: "TechData Corp",
        items: [ { productId: "prod-2", productName: "Procesador Intel Core i9-13900K", quantity: 15, cost: 520.00 } ],
        total: 7800, date: new Date().toISOString(), documentNumber: "INV-TD-9001", responsible: "Admin",
    },
];

export const mockAds: Omit<Ad, 'createdAt'>[] = [
  {
    id: "ad-1", sku: "PROMO-001", name: "Descuento en Laptops", description: "Aprovecha el 20% de descuento en todas las laptops seleccionadas.", price: 999.99,
    imageUrl: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?q=80&w=600&auto=format&fit=crop", imageHint: "laptop computer",
    views: 1250, status: 'active', targetBusinessTypes: ['Tecnologia', 'Servicios Profesionales'],
    expiryDate: addDays(new Date(), 30).toISOString(),
  },
  {
    id: "ad-2", sku: "PUB-REST-001", name: "El Sabor de la Casa", description: "Prueba nuestras nuevas hamburguesas gourmet.", price: 15.50,
    imageUrl: "https://images.unsplash.com/photo-1571091718767-18b5b1457add?q=80&w=600&auto=format&fit=crop", imageHint: "gourmet burger",
    views: 850, status: 'active', targetBusinessTypes: ['Restaurante'],
    expiryDate: addDays(new Date(), 15).toISOString(),
  },
  {
    id: "ad-3", sku: "OFERTA-MODA-01", name: "Nueva Colección Invierno", description: "Descubre las últimas tendencias para esta temporada.", price: 49.99,
    imageUrl: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=600&auto=format&fit=crop", imageHint: "fashion collection",
    views: 2300, status: 'active', targetBusinessTypes: ['Tienda de Ropa', 'Salud y Belleza'],
    expiryDate: addDays(new Date(), 45).toISOString(),
  },
];

export const mockCashSessions: CashSession[] = [
    { // Sesión cerrada del mes pasado
        id: 'SES-001',
        storeId: defaultStoreId,
        openingDate: subDays(startOfMonth(today), 5).toISOString(),
        closingDate: subDays(startOfMonth(today), 5).toISOString(),
        openingBalance: 100,
        closingBalance: 1905.00,
        calculatedCash: 1899.99, // 100 (apertura) + 1799.99 (tarjeta, pero asumamos fue efectivo para el ejemplo)
        difference: 5.01,
        status: 'closed',
        openedBy: 'Admin',
        closedBy: 'Admin',
        salesIds: ['SALE-001'],
        transactions: { 'tarjeta': 1799.99 }
    },
    { // Sesión cerrada de esta semana
        id: 'SES-002',
        storeId: defaultStoreId,
        openingDate: subDays(today, 2).toISOString(),
        closingDate: subDays(today, 2).toISOString(),
        openingBalance: 50,
        closingBalance: 345.00,
        calculatedCash: 350.00, // 50 (apertura) + 300 (pago-movil, que contaría como efectivo en caja)
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
