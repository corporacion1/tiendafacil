import type { Product, Sale, Unit, Family, Warehouse, Customer, Purchase, Ad, UserProfile, Store, CurrencyRate, CashSession } from '@/lib/types';
import { PlaceHolderImages } from './placeholder-images';
import { subDays, addDays, startOfWeek, startOfMonth, startOfYear } from 'date-fns';


// --- IDs ÚNICOS Y CONSTANTES ---
export const defaultStoreId = 'ST-1234567890123';

// --- DATOS MUTABLES (ESTADO LOCAL DE LA APLICACIÓN) ---
// Estos `let` permiten que los datos sean modificados en tiempo de ejecución.

export let defaultStore: Store = {
  id: defaultStoreId,
  storeId: defaultStoreId, // Incluye storeId si tu modelo lo usa
  name: "Tienda Facil DEMO",
  ownerIds: ["5QLaiiIr4mcGsjRXVGeGx50nrpk1"], // UIDs de dueños

  userRoles: [
    { uid: "5QLaiiIr4mcGsjRXVGeGx50nrpk1", role: "su" },
    { uid: "admin_demo_001", role: "admin" },
    { uid: "seller_demo_001", role: "seller" },
    { uid: "depositary_demo_001", role: "depositary" }
  ],
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


// Usuarios con contraseñas pre-hasheadas (bcrypt, 10 rounds)
export let defaultUsers: UserProfile[] = [
  {
    uid: '5QLaiiIr4mcGsjRXVGeGx50nrpk1',
    email: 'corporacion1@gmail.com',
    displayName: 'Jorge Negrete',
    photoURL: 'https://i.imgur.com/8bXhQXa.png',
    phone: '+58 412-6915593',
    password: '$2b$10$3gbTS9Zq0BbLoU.cuPtRSu0qct6i7gIBzpgut.RN20YU6TgNTq8oy', // 19a1e3ef
    role: 'su',
    status: 'active',
    storeId: defaultStoreId,
    createdAt: new Date().toISOString(),
  },
  {
    uid: 'admin_demo_001',
    email: 'admin@tiendafacil.com',
    displayName: 'Admin Demo',
    photoURL: '/tienda_facil_logo.svg',
    phone: null,
    password: '$2b$10$IsAzgDQFQvHej8wydhcHTuCv3mVsfA5/1lV6z3btXGEW5YhJpgVJ6', // admin1234
    role: 'admin',
    status: 'active',
    storeId: defaultStoreId,
    createdAt: new Date().toISOString(),
  },
  {
    uid: 'seller_demo_001',
    email: 'pos@tiendafacil.com',
    displayName: 'POS Demo',
    photoURL: '/tienda_facil_logo.svg',
    phone: null,
    password: '$2b$10$Etj/Ge9Uwi1Nxb3B7Jw6muxiWagP8NaEfm/Zz9U9owX2IKaR1E89K', // seller1234
    role: 'seller',
    status: 'active',
    storeId: defaultStoreId,
    createdAt: new Date().toISOString(),
  },
  {
    uid: 'depositary_demo_001',
    email: 'depositary@tiendafacil.com',
    displayName: 'Depositary Demo',
    photoURL: '/tienda_facil_logo.svg',
    phone: null,
    password: '$2b$10$9v34cif1q92DBXuTgbZIGOJQPJ0mkdI.Tb45VBAakuBg.MfQdikY6', // depositary1234
    role: 'depositary',
    status: 'active',
    storeId: defaultStoreId,
    createdAt: new Date().toISOString(),
  },
  {
    uid: 'user_demo_001',
    email: 'demo@tiendafacil.com',
    displayName: 'User Demo',
    photoURL: '/tienda_facil_logo.svg',
    phone: null,
    password: '$2b$10$CJmToZSR.9RvbxutoobXk.w56UDFn.vBs8RrVWd4zpj6moLz6WC/y', // user1234
    role: 'user',
    status: 'active',
    storeId: defaultStoreId,
    storeRequest: true, // Example of a user requesting a store
    createdAt: new Date().toISOString(),
  }
];

export let mockOrders = [
  {
    orderId: 'ORD-1234567890123',
    customerName: 'Jorge Negrete (Ejemplo)',
    customerPhone: '04121234567',
    customerEmail: 'jorge@example.com',
    items: [
      { productId: "PRO-4567890123456", productName: "SSD NVMe 2TB", quantity: 1, price: 149.99 },
      { productId: "PRO-3456789012345", productName: "Memoria RAM 32GB DDR5", quantity: 2, price: 129.99 }
    ],
    total: 409.97,
    storeId: defaultStoreId,
    status: 'pending',
    notes: 'Pedido de demostración'
  }
];

export let mockCurrencyRates: CurrencyRate[] = [
  { id: 'RAT-1234567890123', rate: 139.50, date: new Date().toISOString(), storeId: defaultStoreId },
  { id: 'RAT-2345678901234', rate: 139.45, date: subDays(new Date(), 1).toISOString(), storeId: defaultStoreId },
  { id: 'RAT-3456789012345', rate: 139.40, date: subDays(new Date(), 2).toISOString(), storeId: defaultStoreId },
];

export let defaultCustomers: Customer[] = [
  { id: 'CUS-1234567890123', name: 'John Doe', phone: '04125551234', address: '123 Main St', storeId: defaultStoreId },
  { id: 'CUS-2345678901234', name: 'Jane Smith', phone: '04145555678', address: '456 Oak Ave', storeId: defaultStoreId },
];

export let defaultSuppliers = [
  { id: 'SUP-1234567890123', name: 'TechData Corp', phone: '111-2222', address: '789 Tech Rd', storeId: defaultStoreId },
  { id: 'SUP-2345678901234', name: 'PC Components LLC', phone: '333-4444', address: '101 Component Ln', storeId: defaultStoreId },
];

export let initialUnits: Unit[] = [
  { id: 'UNI-1234567890123', name: 'Unidad', storeId: defaultStoreId },
  { id: 'UNI-2345678901234', name: 'Caja', storeId: defaultStoreId },
  { id: 'UNI-3456789012345', name: 'Paquete', storeId: defaultStoreId },
];

export let initialFamilies: Family[] = [
  { id: 'FAM-1234567890123', name: 'Tarjetas Gráficas', storeId: defaultStoreId },
  { id: 'FAM-2345678901234', name: 'Procesadores', storeId: defaultStoreId },
  { id: 'FAM-3456789012345', name: 'Memoria RAM', storeId: defaultStoreId },
  { id: 'FAM-4567890123456', name: 'Almacenamiento', storeId: defaultStoreId },
  { id: 'FAM-5678901234567', name: 'Impresoras y Accesorios', storeId: defaultStoreId },
  { id: 'FAM-6789012345678', name: 'Proyectores', storeId: defaultStoreId },
  { id: 'FAM-7890123456789', name: 'Accesorios de Cómputo', storeId: defaultStoreId },
  // Familias de servicios y fabricación
  { id: 'FAM-8901234567890', name: 'Servicios Técnicos', storeId: defaultStoreId },
  { id: 'FAM-9012345678901', name: 'Servicios de Red', storeId: defaultStoreId },
  { id: 'FAM-0123456789012', name: 'Fabricación y Ensamblaje', storeId: defaultStoreId },
];

export let initialWarehouses: Warehouse[] = [
  { id: 'WAR-1234567890123', name: 'Almacén Principal', storeId: defaultStoreId },
  { id: 'WAR-2345678901234', name: 'Depósito Secundario', storeId: defaultStoreId },
];

export let mockProducts: Product[] = [
  {
    id: "PRO-1234567890123", name: "Tarjeta Gráfica RTX 4090", sku: "NV-RTX4090-01", barcode: "123456789012", stock: 15, price: 1799.99, wholesalePrice: 1750.00, cost: 1600.00, status: "active", tax1: true, tax2: false, unit: "Unidad", family: "Tarjetas Gráficas", warehouse: "Almacén Principal",
    description: "La GPU más potente para gaming y creación de contenido.",
    imageUrl: PlaceHolderImages.find(p => p.id === '1')?.imageUrl, imageHint: PlaceHolderImages.find(p => p.id === '1')?.imageHint, storeId: defaultStoreId, createdAt: subDays(new Date(), 10).toISOString(),
    type: "product", affectsInventory: true,
  },
  {
    id: "PRO-2345678901234", name: "Procesador Intel Core i9-13900K", sku: "INT-i9-13900K-02", barcode: "234567890123", stock: 25, price: 589.00, wholesalePrice: 570.00, cost: 520.00, status: "active", tax1: true, tax2: false, unit: "Unidad", family: "Procesadores", warehouse: "Almacén Principal",
    description: "Procesador de alto rendimiento para gaming y productividad.",
    imageUrl: PlaceHolderImages.find(p => p.id === '2')?.imageUrl, imageHint: PlaceHolderImages.find(p => p.id === '2')?.imageHint, storeId: defaultStoreId, createdAt: subDays(new Date(), 20).toISOString(),
    type: "product", affectsInventory: true,
  },
  {
    id: "PRO-3456789012345", name: "Memoria RAM 32GB DDR5", sku: "RAM-DDR5-32G-03", barcode: "345678901234", stock: 50, price: 129.99, wholesalePrice: 120.00, cost: 100.00, status: "promotion", tax1: true, tax2: false, unit: "Paquete", family: "Memoria RAM", warehouse: "Almacén Principal",
    description: "Kit de 2x16GB de memoria RAM DDR5 a 6000MHz.",
    imageUrl: PlaceHolderImages.find(p => p.id === '3')?.imageUrl, imageHint: PlaceHolderImages.find(p => p.id === '3')?.imageHint, storeId: defaultStoreId, createdAt: subDays(new Date(), 5).toISOString(),
    type: "product", affectsInventory: true,
  },
  {
    id: "PRO-4567890123456", name: "SSD NVMe 2TB", sku: "SSD-NVME-2TB-04", stock: 40, price: 149.99, wholesalePrice: 140.00, cost: 125.00, status: "active", tax1: true, tax2: false, unit: "Unidad", family: "Almacenamiento", warehouse: "Almacén Principal",
    description: "Unidad de estado sólido de 2TB con velocidades de lectura/escritura ultrarrápidas.",
    imageUrl: PlaceHolderImages.find(p => p.id === '4')?.imageUrl, imageHint: PlaceHolderImages.find(p => p.id === '4')?.imageHint, storeId: defaultStoreId, createdAt: subDays(new Date(), 15).toISOString(),
    type: "product", affectsInventory: true,
  },
  {
    id: "PRO-5678901234567", name: "Impresora Multifuncional EcoTank", sku: "EPS-ET4800-05", stock: 30, price: 279.99, wholesalePrice: 265.00, cost: 240.00, status: "active", tax1: true, tax2: false, unit: "Unidad", family: "Impresoras y Accesorios", warehouse: "Almacén Principal",
    description: "Imprime miles de páginas con los tanques de tinta de súper alta capacidad.",
    imageUrl: PlaceHolderImages.find(p => p.id === '9')?.imageUrl, imageHint: PlaceHolderImages.find(p => p.id === '9')?.imageHint, storeId: defaultStoreId, createdAt: subDays(new Date(), 30).toISOString(),
    type: "product", affectsInventory: true,
  },
  {
    id: "PRO-6789012345678",
    name: "Tarjeta Madre Z790",
    sku: "MOBO-Z790-01",
    stock: 20,
    price: 349.99,
    wholesalePrice: 330.00,
    cost: 300.00,
    status: "active",
    tax1: true,
    tax2: false,
    unit: "Unidad",
    family: "Tarjetas Gráficas", // Incorrect family for demo
    warehouse: "Almacén Principal",
    description: "Placa base con soporte para procesadores Intel de 13ª generación y memoria DDR5.",
    imageUrl: PlaceHolderImages.find(p => p.id === '5')?.imageUrl,
    imageHint: PlaceHolderImages.find(p => p.id === '5')?.imageHint,
    storeId: defaultStoreId,
    createdAt: subDays(new Date(), 25).toISOString(),
    type: "product", affectsInventory: true,
  },
  {
    id: "PRO-7890123456789",
    name: "Fuente de Poder 1000W Gold",
    sku: "PSU-1000G-01",
    stock: 22,
    price: 199.99,
    wholesalePrice: 185.00,
    cost: 165.00,
    status: "active",
    tax1: true,
    tax2: false,
    unit: "Unidad",
    family: "Accesorios de Cómputo",
    warehouse: "Almacén Principal",
    description: "Fuente de poder modular con certificación 80 Plus Gold para sistemas de alta gama.",
    imageUrl: PlaceHolderImages.find(p => p.id === '6')?.imageUrl,
    imageHint: PlaceHolderImages.find(p => p.id === '6')?.imageHint,
    storeId: defaultStoreId,
    createdAt: subDays(new Date(), 40).toISOString(),
    type: "product", affectsInventory: true,
  },
  {
    id: "PRO-8901234567890",
    name: "Proyector LED Full HD",
    sku: "PROJ-FHD-01",
    stock: 18,
    price: 159.99,
    wholesalePrice: 150.00,
    cost: 130.00,
    status: "inactive",
    tax1: true,
    tax2: false,
    unit: "Unidad",
    family: "Proyectores",
    warehouse: "Depósito Secundario",
    description: "Proyector compacto y portátil con resolución nativa 1080p.",
    imageUrl: PlaceHolderImages.find(p => p.id === '10')?.imageUrl,
    imageHint: PlaceHolderImages.find(p => p.id === '10')?.imageHint,
    storeId: defaultStoreId,
    createdAt: subDays(new Date(), 50).toISOString(),
    type: "product", affectsInventory: true,
  },

  // SERVICIOS - No afectan inventario
  {
    id: "SRV-1001234567890",
    name: "Instalación de Sistema Operativo",
    sku: "SRV-OS-INSTALL",
    barcode: undefined,
    stock: 0, // Los servicios no tienen stock
    price: 25.00,
    wholesalePrice: 20.00,
    cost: 5.00, // Costo de tiempo/materiales
    status: "active",
    tax1: true,
    tax2: false,
    unit: "Servicio",
    family: "Servicios Técnicos",
    warehouse: undefined, // Los servicios no están en almacén
    description: "Instalación completa de Windows 11 o Linux, incluyendo drivers básicos y actualizaciones.",
    imageUrl: PlaceHolderImages.find(p => p.id === '10')?.imageUrl,
    imageHint: PlaceHolderImages.find(p => p.id === '10')?.imageHint,
    storeId: defaultStoreId,
    createdAt: subDays(new Date(), 3).toISOString(),
    type: "service", affectsInventory: false,
  },
  {
    id: "FAB-1002345678901",
    name: "Ensamblaje de PC Completo",
    sku: "FAB-PC-BUILD",
    barcode: undefined,
    stock: 0,
    price: 75.00,
    wholesalePrice: 60.00,
    cost: 15.00,
    status: "active",
    tax1: true,
    tax2: false,
    unit: "Servicio",
    family: "Servicios Técnicos",
    warehouse: undefined,
    description: "Ensamblaje profesional de PC gaming o workstation, incluyendo cable management y pruebas.",
    imageUrl: PlaceHolderImages.find(p => p.id === '11')?.imageUrl,
    imageHint: PlaceHolderImages.find(p => p.id === '11')?.imageHint,
    storeId: defaultStoreId,
    createdAt: subDays(new Date(), 7).toISOString(),
    type: "service", affectsInventory: false,
  },
  {
    id: "SRV-1003456789012",
    name: "Diagnóstico y Reparación",
    sku: "SRV-REPAIR",
    barcode: undefined,
    stock: 0,
    price: 35.00,
    wholesalePrice: 30.00,
    cost: 8.00,
    status: "active",
    tax1: true,
    tax2: false,
    unit: "Servicio",
    family: "Servicios Técnicos",
    warehouse: undefined,
    description: "Diagnóstico completo de hardware y software, con reparación básica incluida.",
    imageUrl: PlaceHolderImages.find(p => p.id === '12')?.imageUrl,
    imageHint: PlaceHolderImages.find(p => p.id === '12')?.imageHint,
    storeId: defaultStoreId,
    createdAt: subDays(new Date(), 12).toISOString(),
    type: "service", affectsInventory: false,
  },
  {
    id: "SRV-1004567890123",
    name: "Configuración de Red Doméstica",
    sku: "SRV-NET-SETUP",
    barcode: undefined,
    stock: 0,
    price: 45.00,
    wholesalePrice: 35.00,
    cost: 10.00,
    status: "promotion",
    tax1: true,
    tax2: false,
    unit: "Servicio",
    family: "Servicios de Red",
    warehouse: undefined,
    description: "Configuración de router, WiFi, y red doméstica para hasta 10 dispositivos.",
    imageUrl: PlaceHolderImages.find(p => p.id === '13')?.imageUrl,
    imageHint: PlaceHolderImages.find(p => p.id === '13')?.imageHint,
    storeId: defaultStoreId,
    createdAt: subDays(new Date(), 18).toISOString(),
    type: "service", affectsInventory: false,
  },
  {
    id: "FAB-1005678901234",
    name: "Fabricación de Cable de Red Personalizado",
    sku: "FAB-CABLE-CUSTOM",
    barcode: undefined,
    stock: 0,
    price: 15.00,
    wholesalePrice: 12.00,
    cost: 3.00,
    status: "active",
    tax1: true,
    tax2: false,
    unit: "Servicio",
    family: "Servicios Técnicos",
    warehouse: undefined,
    description: "Fabricación de cables de red Cat6 a medida con conectores RJ45 y pruebas de conectividad.",
    imageUrl: PlaceHolderImages.find(p => p.id === '14')?.imageUrl,
    imageHint: PlaceHolderImages.find(p => p.id === '14')?.imageHint,
    storeId: defaultStoreId,
    createdAt: subDays(new Date(), 22).toISOString(),
    type: "service", affectsInventory: false,
  },
];

const today = new Date();
export let mockSales: Sale[] = [
  {
    id: "SAL-1234567890123", customerId: "CUS-1234567890123", customerName: "John Doe",
    items: [{ productId: "PRO-1234567890123", productName: "Tarjeta Gráfica RTX 4090", quantity: 1, price: 1799.99 }],
    total: 1799.99, date: subDays(startOfMonth(today), 5).toISOString(), transactionType: 'contado', status: 'paid', paidAmount: 1799.99,
    payments: [{ id: 'PAY-1234567890123', amount: 1799.99, date: subDays(startOfMonth(today), 5).toISOString(), method: 'tarjeta', reference: '1234', receivedBy: 'Admin' }],
    storeId: defaultStoreId,
  },
  {
    id: "SAL-2345678901234", customerId: "CUS-2345678901234", customerName: "Jane Smith",
    items: [{ productId: "PRO-2345678901234", productName: "Procesador Intel Core i9-13900K", quantity: 1, price: 589.00 }],
    total: 589.00, date: subDays(today, 2).toISOString(), transactionType: 'credito', status: 'unpaid', paidAmount: 300,
    payments: [{ id: 'PAY-2345678901234', amount: 300, date: subDays(today, 2).toISOString(), method: 'pago-movil', reference: '012345', receivedBy: 'Demo' }],
    storeId: defaultStoreId,
  },
  // Ventas a crédito adicionales para demo de cuentas por cobrar
  {
    id: "SAL-3456789012345", customerId: "CUS-1234567890123", customerName: "John Doe", customerPhone: "04125551234",
    items: [{ productId: "PRO-3456789012345", productName: "Memoria RAM 32GB DDR5", quantity: 2, price: 129.99 }],
    total: 259.98, date: subDays(today, 15).toISOString(), transactionType: 'credito', status: 'unpaid', paidAmount: 0,
    payments: [], storeId: defaultStoreId,
  },
  {
    id: "SAL-4567890123456", customerId: "CUS-2345678901234", customerName: "Jane Smith", customerPhone: "04145555678",
    items: [{ productId: "PRO-4567890123456", productName: "SSD NVMe 2TB", quantity: 1, price: 149.99 }],
    total: 149.99, date: subDays(today, 45).toISOString(), transactionType: 'credito', status: 'unpaid', paidAmount: 75,
    payments: [{ id: 'PAY-4567890123456', amount: 75, date: subDays(today, 30).toISOString(), method: 'efectivo', reference: '', receivedBy: 'Admin' }],
    storeId: defaultStoreId,
  },
  {
    id: "SAL-5678901234567", customerId: "CUS-1234567890123", customerName: "John Doe", customerPhone: "04125551234",
    items: [{ productId: "PRO-5678901234567", productName: "Impresora Multifuncional EcoTank", quantity: 1, price: 279.99 }],
    total: 279.99, date: subDays(today, 60).toISOString(), transactionType: 'credito', status: 'paid', paidAmount: 279.99,
    payments: [
      { id: 'PAY-5678901234567', amount: 150, date: subDays(today, 45).toISOString(), method: 'transferencia', reference: 'TRF-001', receivedBy: 'Admin' },
      { id: 'PAY-6789012345678', amount: 129.99, date: subDays(today, 30).toISOString(), method: 'pago-movil', reference: '098765', receivedBy: 'Demo' }
    ],
    storeId: defaultStoreId,
  },
];

export let mockPurchases: Purchase[] = [
  {
    id: "PUR-1234567890123", supplierId: "SUP-1234567890123", supplierName: "TechData Corp",
    items: [{ productId: "PRO-1234567890123", productName: "Tarjeta Gráfica RTX 4090", quantity: 10, cost: 1600.00 }],
    total: 16000, date: subDays(startOfMonth(today), 10).toISOString(), documentNumber: "INV-TD-8899", responsible: "Admin",
    storeId: defaultStoreId,
  },
  {
    id: "PUR-2345678901234", supplierId: "SUP-2345678901234", supplierName: "PC Components LLC",
    items: [{ productId: "PRO-4567890123456", productName: "SSD NVMe 2TB", quantity: 20, cost: 125.00 }],
    total: 2500, date: startOfWeek(today).toISOString(), documentNumber: "INV-PC-1122", responsible: "Admin",
    storeId: defaultStoreId,
  },
];

export let mockAds: Ad[] = [
  {
    id: "ADS-1234567890123", sku: "PROMO-001", name: "Descuento en Laptops", description: "Aprovecha el 20% de descuento en todas las laptops seleccionadas.", price: 999.99,
    imageUrl: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?q=80&w=600&auto=format&fit=crop", imageHint: "laptop computer",
    views: 1250, status: 'active', targetBusinessTypes: ['Tecnologia', 'Servicios Profesionales'],
    expiryDate: addDays(new Date(), 30).toISOString(), createdAt: new Date().toISOString(),
  },
  {
    id: "ADS-2345678901234", sku: "PUB-REST-001", name: "El Sabor de la Casa", description: "Prueba nuestras nuevas hamburguesas gourmet.", price: 15.50,
    imageUrl: "https://images.unsplash.com/photo-1571091718767-18b5b1457add?q=80&w=600&auto=format&fit=crop", imageHint: "gourmet burger",
    views: 850, status: 'active', targetBusinessTypes: ['Restaurante'],
    expiryDate: addDays(new Date(), 15).toISOString(), createdAt: new Date().toISOString(),
  },
  {
    id: "ADS-3456789012345", sku: "PAUSE-001", name: "Oferta Temporalmente Suspendida", description: "Promoción pausada por el administrador.", price: 299.99,
    imageUrl: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?q=80&w=600&auto=format&fit=crop", imageHint: "sale promotion",
    views: 420, status: 'paused', targetBusinessTypes: ['Tienda de Ropa', 'Otro'],
    expiryDate: addDays(new Date(), 45).toISOString(), createdAt: subDays(new Date(), 5).toISOString(),
  },
  {
    id: "ADS-4567890123456", sku: "EXPIRED-001", name: "Promoción Vencida", description: "Esta promoción ya expiró automáticamente.", price: 199.99,
    imageUrl: "https://images.unsplash.com/photo-1607083206869-4c7672e72a8a?q=80&w=600&auto=format&fit=crop", imageHint: "expired offer",
    views: 2100, status: 'active', targetBusinessTypes: ['Supermercado'],
    expiryDate: subDays(new Date(), 2).toISOString(), createdAt: subDays(new Date(), 30).toISOString(),
  },
  {
    id: "ADS-5678901234567", sku: "INACTIVE-001", name: "Anuncio Inactivo", description: "Anuncio marcado como inactivo manualmente.", price: 89.99,
    imageUrl: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?q=80&w=600&auto=format&fit=crop", imageHint: "inactive ad",
    views: 150, status: 'inactive', targetBusinessTypes: ['Ferretería'],
    expiryDate: addDays(new Date(), 60).toISOString(), createdAt: subDays(new Date(), 10).toISOString(),
  },
];

export let mockCashSessions: CashSession[] = [
  {
    id: 'SES-1234567890123',
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
    salesIds: ['SAL-1234567890123'],
    transactions: { 'tarjeta': 1799.99 }
  },
  {
    id: 'SES-2345678901234',
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
    salesIds: ['SAL-2345678901234'],
    transactions: { 'pago-movil': 300 }
  },
];

export const paymentMethods = [
  { id: 'PME-1234567890123', name: 'Efectivo', requiresRef: false },
  { id: 'PME-2345678901234', name: 'Transferencia', requiresRef: true },
  { id: 'PME-3456789012345', name: 'Pago Móvil', requiresRef: true },
  { id: 'PME-4567890123456', name: 'Tarjeta', requiresRef: true },
  { id: 'PME-5678901234567', name: 'Zelle', requiresRef: true },
  { id: 'PME-6789012345678', name: 'Otro', requiresRef: false },
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

// Las cuentas por cobrar se crean automáticamente desde las ventas a crédito durante el seed

// Datos de ejemplo para movimientos de inventario
// Movimientos consistentes con productos, compras y ventas existentes
export let mockInventoryMovements = [
  // Movimientos iniciales para todos los productos
  {
    id: 'MOV-1234567890123',
    productId: 'PRO-1234567890123',
    warehouseId: 'WAR-1234567890123',
    movementType: 'initial_stock',
    quantity: 5, // Stock inicial antes de compras
    unitCost: 1600.00,
    totalValue: 8000.00,
    referenceType: 'product_creation',
    referenceId: 'PRO-1234567890123',
    previousStock: 0,
    newStock: 5,
    userId: 'user_demo_001',
    notes: 'Stock inicial - Tarjeta Gráfica RTX 4090',
    storeId: defaultStoreId,
    createdAt: subDays(new Date(), 30).toISOString()
  },
  {
    id: 'MOV-2345678901234',
    productId: 'PRO-2345678901234',
    warehouseId: 'WAR-1234567890123',
    movementType: 'initial_stock',
    quantity: 15, // Stock inicial antes de ventas
    unitCost: 520.00,
    totalValue: 7800.00,
    referenceType: 'product_creation',
    referenceId: 'PRO-2345678901234',
    previousStock: 0,
    newStock: 15,
    userId: 'user_demo_001',
    notes: 'Stock inicial - Procesador Intel Core i9-13900K',
    storeId: defaultStoreId,
    createdAt: subDays(new Date(), 25).toISOString()
  },
  {
    id: 'MOV-3456789012345',
    productId: 'PRO-3456789012345',
    warehouseId: 'WAR-1234567890123',
    movementType: 'initial_stock',
    quantity: 50,
    unitCost: 100.00,
    totalValue: 5000.00,
    referenceType: 'product_creation',
    referenceId: 'PRO-3456789012345',
    previousStock: 0,
    newStock: 50,
    userId: 'user_demo_001',
    notes: 'Stock inicial - Memoria RAM 32GB DDR5',
    storeId: defaultStoreId,
    createdAt: subDays(new Date(), 20).toISOString()
  },
  {
    id: 'MOV-4567890123456',
    productId: 'PRO-4567890123456',
    warehouseId: 'WAR-1234567890123',
    movementType: 'initial_stock',
    quantity: 20, // Stock inicial antes de compras
    unitCost: 125.00,
    totalValue: 2500.00,
    referenceType: 'product_creation',
    referenceId: 'PRO-4567890123456',
    previousStock: 0,
    newStock: 20,
    userId: 'user_demo_001',
    notes: 'Stock inicial - SSD NVMe 2TB',
    storeId: defaultStoreId,
    createdAt: subDays(new Date(), 18).toISOString()
  },
  {
    id: 'MOV-5678901234567',
    productId: 'PRO-5678901234567',
    warehouseId: 'WAR-1234567890123',
    movementType: 'initial_stock',
    quantity: 30,
    unitCost: 240.00,
    totalValue: 7200.00,
    referenceType: 'product_creation',
    referenceId: 'PRO-5678901234567',
    previousStock: 0,
    newStock: 30,
    userId: 'user_demo_001',
    notes: 'Stock inicial - Impresora Multifuncional EcoTank',
    storeId: defaultStoreId,
    createdAt: subDays(new Date(), 35).toISOString()
  },

  // Movimientos de compras (basados en mockPurchases)
  {
    id: 'MOV-6789012345678',
    productId: 'PRO-1234567890123',
    warehouseId: 'WAR-1234567890123',
    movementType: 'purchase',
    quantity: 10,
    unitCost: 1600.00,
    totalValue: 16000.00,
    referenceType: 'purchase_order',
    referenceId: 'PUR-1234567890123',
    previousStock: 5,
    newStock: 15,
    userId: 'user_demo_001',
    notes: 'Compra de TechData Corp',
    storeId: defaultStoreId,
    createdAt: subDays(startOfMonth(new Date()), 10).toISOString()
  },
  {
    id: 'MOV-7890123456789',
    productId: 'PRO-4567890123456',
    warehouseId: 'WAR-1234567890123',
    movementType: 'purchase',
    quantity: 20,
    unitCost: 125.00,
    totalValue: 2500.00,
    referenceType: 'purchase_order',
    referenceId: 'PUR-2345678901234',
    previousStock: 20,
    newStock: 40,
    userId: 'user_demo_001',
    notes: 'Compra de PC Components LLC',
    storeId: defaultStoreId,
    createdAt: startOfWeek(new Date()).toISOString()
  },

  // Movimientos de ventas (basados en mockSales)
  {
    id: 'MOV-8901234567890',
    productId: 'PRO-1234567890123',
    warehouseId: 'WAR-1234567890123',
    movementType: 'sale',
    quantity: -1,
    unitCost: 1600.00,
    totalValue: 1600.00,
    referenceType: 'sale_transaction',
    referenceId: 'SAL-1234567890123',
    previousStock: 15,
    newStock: 14,
    userId: 'user_demo_001',
    notes: 'Venta a John Doe',
    storeId: defaultStoreId,
    createdAt: subDays(startOfMonth(new Date()), 5).toISOString()
  },
  {
    id: 'MOV-9012345678901',
    productId: 'PRO-2345678901234',
    warehouseId: 'WAR-1234567890123',
    movementType: 'sale',
    quantity: -1,
    unitCost: 520.00,
    totalValue: 520.00,
    referenceType: 'sale_transaction',
    referenceId: 'SAL-2345678901234',
    previousStock: 15,
    newStock: 14,
    userId: 'user_demo_001',
    notes: 'Venta a Jane Smith',
    storeId: defaultStoreId,
    createdAt: subDays(new Date(), 2).toISOString()
  },

  // Movimiento de ajuste de ejemplo
  {
    id: 'MOV-0123456789012',
    productId: 'PRO-3456789012345',
    warehouseId: 'WAR-1234567890123',
    movementType: 'adjustment',
    quantity: -2,
    unitCost: 100.00,
    totalValue: 200.00,
    referenceType: 'manual_adjustment',
    referenceId: 'ADJ-1234567890123',
    previousStock: 50,
    newStock: 48,
    userId: 'user_demo_001',
    notes: 'Ajuste por productos dañados',
    storeId: defaultStoreId,
    createdAt: subDays(new Date(), 1).toISOString()
  }
];
