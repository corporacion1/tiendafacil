
import type { Product, Sale, Unit, Family, Warehouse, Customer, Purchase, Ad, UserProfile, Store, CurrencyRate, Supplier, PendingOrder } from '@/lib/types';
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
  saleSeries: "VENTA",
  saleCorrelative: 1,
  tax1: 16,
  tax2: 0,
  whatsapp: "+584125555555",
  tiktok: "@tiendafacil",
  meta: "@tiendafacil",
};

// --- USUARIOS POR DEFECTO ---
export const defaultUsers: Omit<UserProfile, 'createdAt' | 'uid' | 'phone'>[] = [
    {
        email: 'corporacion1@gmail.com',
        displayName: 'Jorge Negrete',
        photoURL: 'https://i.imgur.com/8bXhQXa.png', // Avatar de ejemplo
        role: 'superAdmin',
        status: 'active',
        storeId: defaultStoreId,
    }
];

// --- DATOS DE MUESTRA (TODOS CONECTADOS AL storeId por defecto) ---

export let pendingOrdersState: PendingOrder[] = [];

export const mockCurrencyRates: Omit<CurrencyRate, 'id'>[] = [
    { rate: 39.50, date: new Date().toISOString() },
    { rate: 39.45, date: subDays(new Date(), 1).toISOString() },
    { rate: 39.30, date: subDays(new Date(), 2).toISOString() },
];

export const defaultCustomers: Omit<Customer, 'storeId'>[] = [
    { id: 'eventual', name: 'Cliente Eventual', phone: '', address: '' },
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
];

const today = new Date();
export const mockSales: Omit<Sale, 'storeId'>[] = [
    { // Venta del mes pasado (para tener datos históricos)
        id: "SALE-001", customerId: "cust-1", customerName: "John Doe",
        items: [ { productId: "prod-1", productName: "Tarjeta Gráfica RTX 4090", quantity: 1, price: 1799.99 } ],
        total: 1799.99, date: subDays(startOfMonth(today), 5).toISOString(), transactionType: 'contado', status: 'paid', paidAmount: 1799.99,
        payments: [{ id: 'pay-sale-001', amount: 1799.99, date: subDays(startOfMonth(today), 5).toISOString(), method: 'tarjeta', reference: '1234' }]
    },
    { // Venta de la semana actual
        id: "SALE-002", customerId: "cust-2", customerName: "Jane Smith",
        items: [ { productId: "prod-2", productName: "Procesador Intel Core i9-13900K", quantity: 1, price: 589.00 } ],
        total: 589.00, date: subDays(today, 2).toISOString(), transactionType: 'credito', status: 'unpaid', paidAmount: 300,
        payments: [{ id: 'pay-sale-002', amount: 300, date: subDays(today, 2).toISOString(), method: 'pago-movil', reference: '012345' }]
    },
     { // Venta de hoy
        id: "SALE-003", customerId: "eventual", customerName: "Cliente Eventual",
        items: [ { productId: "prod-3", productName: "Memoria RAM 32GB DDR5", quantity: 2, price: 129.99 } ],
        total: 259.98, date: new Date().toISOString(), transactionType: 'contado', status: 'paid', paidAmount: 259.98,
        payments: [{ id: 'pay-sale-003', amount: 259.98, date: new Date().toISOString(), method: 'efectivo', reference: '' }]
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

// In a real app, this would be a server-side operation
export function trackAdClick(adId: string) {
    // This is a mock function, in a real app this would call a server endpoint
    // to track the click and update the ad's view count in the database.
    console.log(`Ad click tracked for: ${adId}`);
}

// This function now just returns false to satisfy the call in login page, but does nothing.
export async function forceSeedDatabase(): Promise<boolean> {
  console.log("forceSeedDatabase is disabled. Using local data.");
  return false;
}

// This function does nothing.
export async function factoryReset() {
  console.log("factoryReset is disabled. Using local data.");
  return;
}

    