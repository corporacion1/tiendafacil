
import type { Product, Sale, Unit, Family, Warehouse, Customer, Purchase, Ad, UserProfile, Store, CurrencyRate } from '@/lib/types';
import { PlaceHolderImages } from './placeholder-images';
import { subDays, subHours, addDays } from 'date-fns';

// --- IDs ÚNICOS Y CONSTANTES ---
// ID único y robusto para la tienda por defecto.
export const defaultStoreId = 'store_clifp94l0000008l3b1z9f8j7';

// --- CONFIGURACIÓN DE LA TIENDA POR DEFECTO ---
export const defaultStore: Store = {
  id: defaultStoreId,
  name: "Tienda Facil DEMO",
  ownerId: "5QLaiiIr4mcGsjRXVGeGx50nrpk1", // Actualizado al UID del super admin
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
  saleSeries: "VENTA",
  saleCorrelative: 1,
  tax1: 16,
  tax2: 0,
  whatsapp: "+584125555555",
  tiktok: "@tiendafacil",
  meta: "@tiendafacil",
};

// --- USUARIOS POR DEFECTO ---
export const defaultUsers: Omit<UserProfile, 'createdAt' | 'uid' | 'photoURL'>[] = [
    {
        email: 'corporacion1@gmail.com',
        displayName: 'Jorge Negrete',
        role: 'superAdmin',
        status: 'active',
        storeId: defaultStoreId, // Conectado a la tienda por defecto
    }
];

// --- DATOS DE MUESTRA (TODOS CONECTADOS AL storeId por defecto) ---

export const mockCurrencyRates: CurrencyRate[] = [
    { id: 'rate-1', rate: 182.50, date: new Date().toISOString() },
    { id: 'rate-2', rate: 180.25, date: subDays(new Date(), 1).toISOString() },
    { id: 'rate-3', rate: 178.90, date: subDays(new Date(), 2).toISOString() },
];

export const defaultCustomers: Omit<Customer, 'storeId'>[] = [
    { id: 'eventual', name: 'Cliente Eventual', phone: '', address: '' },
    { id: 'cust-1', name: 'John Doe', phone: '555-1234', address: '123 Main St' },
    { id: 'cust-2', name: 'Jane Smith', phone: '555-5678', address: '456 Oak Ave' },
];

export const defaultSuppliers: Omit<Supplier, 'storeId'>[] = [
    { id: 'sup-1', name: 'TechData Corp', phone: '111-2222', address: '789 Tech Rd' },
    { id: 'sup-2', name: 'PC Components LLC', phone: '333-4444', address: '101 Component Ln' },
    { id: 'sup-3', name: 'Global Microchips', phone: '555-5555', address: '202 Silicon St' },
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
    { id: 'fam-5', name: 'Tarjetas Madre' },
    { id: 'fam-6', name: 'Fuentes de Poder' },
];

export const initialWarehouses: Omit<Warehouse, 'storeId'>[] = [
    { id: 'wh-1', name: 'Almacén Principal' },
    { id: 'wh-2', name: 'Depósito Secundario' },
];

export const mockProducts: Omit<Product, 'createdAt' | 'storeId'>[] = [
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
    id: "prod-7", name: "Tarjeta Gráfica RX 7900 XTX", sku: "AMD-RX7900XTX-07", stock: 20, price: 999.99, wholesalePrice: 950.00, cost: 880.00, status: "promotion", tax1: true, tax2: true, unit: "Unidad", family: "Tarjetas Gráficas", warehouse: "Almacén Principal",
    description: "GPU de alta gama de AMD, excelente para gaming en 4K.",
    imageUrl: PlaceHolderImages.find(p => p.id === '7')?.imageUrl, imageHint: PlaceHolderImages.find(p => p.id === '7')?.imageHint,
  },
  {
    id: "prod-8", name: "Procesador AMD Ryzen 9 7950X", sku: "AMD-R9-7950X-08", stock: 22, price: 549.00, wholesalePrice: 530.00, cost: 490.00, status: "active", tax1: true, tax2: false, unit: "Unidad", family: "Procesadores", warehouse: "Almacén Principal",
    description: "Procesador de 16 núcleos y 32 hilos para máxima productividad.",
    imageUrl: PlaceHolderImages.find(p => p.id === '8')?.imageUrl, imageHint: PlaceHolderImages.find(p => p.id === '8')?.imageHint,
  },
];

export const mockPurchases: Omit<Purchase, 'storeId'>[] = [
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

export const mockSales: Omit<Sale, 'storeId'>[] = [
    {
        id: "SALE-001", customerId: "cust-1", customerName: "John Doe",
        items: [ { productId: "prod-1", productName: "Tarjeta Gráfica RTX 4090", quantity: 1, price: 1799.99 } ],
        total: 1799.99, date: subDays(new Date(), 8).toISOString(), transactionType: 'contado', status: 'paid', paidAmount: 1799.99,
        payments: [{ id: 'pay-sale-001', amount: 1799.99, date: subDays(new Date(), 8).toISOString(), method: 'tarjeta', reference: '1234' }]
    },
    {
        id: "SALE-002", customerId: "cust-2", customerName: "Jane Smith",
        items: [ { productId: "prod-2", productName: "Procesador Intel Core i9-13900K", quantity: 1, price: 589.00 }, { productId: "prod-5", productName: "Tarjeta Madre Z790", quantity: 1, price: 349.99 } ],
        total: 938.99, date: subDays(new Date(), 4).toISOString(), transactionType: 'credito', status: 'unpaid', paidAmount: 500,
        payments: [{ id: 'pay-sale-002', amount: 500, date: subDays(new Date(), 4).toISOString(), method: 'pago-movil', reference: '012345' }]
    },
    {
        id: "SALE-003", customerId: "eventual", customerName: "Cliente Eventual",
        items: [ { productId: "prod-3", productName: "Memoria RAM 32GB DDR5", quantity: 2, price: 129.99 } ],
        total: 259.98, date: subHours(new Date(), 3).toISOString(), transactionType: 'contado', status: 'paid', paidAmount: 259.98,
        payments: [{ id: 'pay-sale-003', amount: 259.98, date: subHours(new Date(), 3).toISOString(), method: 'efectivo' }]
    },
    {
        id: "SALE-004", customerId: "cust-1", customerName: "John Doe",
        items: [ { productId: "prod-7", productName: "Tarjeta Gráfica RX 7900 XTX", quantity: 1, price: 999.99 } ],
        total: 999.99, date: subHours(new Date(), 20).toISOString(), transactionType: 'contado', status: 'paid', paidAmount: 999.99,
        payments: [{ id: 'pay-sale-004', amount: 999.99, date: subHours(new Date(), 20).toISOString(), method: 'zelle' }]
    },
];

export const mockAds: Omit<Ad, 'createdAt'>[] = [
  {
    id: "ad-2",
    sku: "PROMO-002",
    name: "Potencia tu PC con Nosotros",
    description: "Los mejores componentes para tu PC gamer.",
    price: 0,
    imageUrl: "https://images.unsplash.com/photo-1593640408182-31c70c8268f5?q=80&w=600&auto=format&fit=crop",
    imageHint: "gaming pc",
    views: 512,
    status: 'active',
    targetBusinessTypes: ['Tecnologia'],
    expiryDate: addDays(new Date(), 60).toISOString(),
  },
  {
    id: "ad-5",
    sku: "SUPER-001",
    name: "Oferta en Súper Mercado",
    description: "Todo lo que necesitas para tu hogar.",
    price: 0,
    imageUrl: "https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=600&auto=format&fit=crop",
    imageHint: "supermarket groceries",
    views: 1230,
    status: 'active',
    targetBusinessTypes: ['Supermercado'],
    expiryDate: addDays(new Date(), 20).toISOString(),
  },
  {
    id: "ad-3",
    sku: "EXPIRED-001",
    name: "Oferta Pasada",
    description: "Esta oferta ya no es válida.",
    price: 0,
    imageUrl: "https://images.unsplash.com/photo-1555529771-835f59fc5efe?q=80&w=600&auto=format&fit=crop",
    imageHint: "expired sale",
    views: 2048,
    status: 'active', // Será desactivado automáticamente si la fecha de expiración ya pasó
    targetBusinessTypes: ['Tecnologia'],
    expiryDate: subDays(new Date(), 5).toISOString(),
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

/**
 * Función de utilidad para simular el seguimiento de un clic en un anuncio.
 * En una aplicación real, esto probablemente haría una llamada a la API.
 */
export async function trackAdClick(adId: string) {
  console.log(`Ad with ID ${adId} was clicked.`);
  // Aquí es donde harías una llamada a Firestore para incrementar las vistas del anuncio.
  // Por ejemplo:
  // const adRef = doc(db, 'ads', adId);
  // await updateDoc(adRef, {
  //   views: increment(1)
  // });
}

    