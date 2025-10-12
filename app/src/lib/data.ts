import type { Product, Sale, Unit, Family, Warehouse, Customer, Purchase, Ad, UserProfile, Store, CurrencyRate, Supplier, PendingOrder, CashSession, AdClick } from '@/lib/types';
import { PlaceHolderImages } from './placeholder-images';
import { subDays, addDays } from 'date-fns';

export const defaultStoreId = 'store_clifp94l0000008l3b1z9f8j7';

export const defaultStore: Store = {
  id: defaultStoreId,
  name: "Tienda Facil DEMO",
  ownerId: "5QLaiiIr4mcGsjRXVGeGx50nrpk1",
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
  tax1: 16,
  tax2: 0,
  whatsapp: "+584126915593",
  meta: "@tiendafacil",
};

export const mockCurrencyRates: Omit<CurrencyRate, 'id'>[] = [
    { rate: 39.50, date: new Date().toISOString() },
    { rate: 39.45, date: subDays(new Date(), 1).toISOString() },
    { rate: 39.40, date: subDays(new Date(), 2).toISOString() },
];

export const defaultUsers: Omit<UserProfile, 'email' | 'displayName' | 'photoURL'>[] = [
    { uid: '5QLaiiIr4mcGsjRXVGeGx50nrpk1', role: 'superAdmin', status: 'active', storeId: defaultStoreId, createdAt: '2023-01-01T00:00:00Z' },
    { uid: 'user-admin-01', role: 'admin', status: 'active', storeId: defaultStoreId, createdAt: '2023-01-01T00:00:00Z' },
    { uid: 'user-pos-01', role: 'pos', status: 'active', storeId: defaultStoreId, createdAt: '2023-01-01T00:00:00Z' },
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
];

export const initialWarehouses: Omit<Warehouse, 'storeId'>[] = [
    { id: 'wh-1', name: 'Almacén Principal' },
    { id: 'wh-2', name: 'Depósito Secundario' },
];

export const mockProducts: Omit<Product, 'createdAt' | 'storeId'>[] = PlaceHolderImages.map((img, index) => ({
    id: `prod-${img.id}`,
    name: img.description,
    sku: `SKU-${String(index + 1).padStart(3, '0')}`,
    stock: Math.floor(Math.random() * 100),
    price: Math.floor(Math.random() * 500) + 50,
    wholesalePrice: Math.floor(Math.random() * 450) + 40,
    cost: Math.floor(Math.random() * 350) + 30,
    status: (["active", "promotion"] as const)[index % 2],
    tax1: true,
    tax2: false,
    unit: "Unidad",
    family: initialFamilies[index % initialFamilies.length].name,
    warehouse: "Almacén Principal",
    description: `Descripción detallada para ${img.description}.`,
    imageUrl: img.imageUrl,
    imageHint: img.imageHint,
}));

export let adClicks: AdClick[] = [];
export const trackAdClick = (adId: string) => {
    adClicks.push({
        id: `click-${Date.now()}`,
        adId: adId,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
    });
};

export const mockAds: Omit<Ad, 'createdAt'>[] = [
  {
    id: "ad-1", sku: "PROMO-001", name: "Descuento en Laptops", description: "Aprovecha el 20% de descuento en todas las laptops seleccionadas.", price: 999.99,
    imageUrl: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?q=80&w=600&auto=format&fit=crop", imageHint: "laptop computer",
    views: 0, status: 'active', targetBusinessTypes: ['Tecnologia', 'Servicios Profesionales'],
    expiryDate: addDays(new Date(), 30).toISOString(),
  },
  {
    id: "ad-2", sku: "PUB-REST-001", name: "El Sabor de la Casa", description: "Prueba nuestras nuevas hamburguesas gourmet.", price: 15.50,
    imageUrl: "https://images.unsplash.com/photo-1571091718767-18b5b1457add?q=80&w=600&auto=format&fit=crop", imageHint: "gourmet burger",
    views: 0, status: 'active', targetBusinessTypes: ['Restaurante'],
    expiryDate: addDays(new Date(), 15).toISOString(),
  },
];

export let pendingOrdersState: PendingOrder[] = [];
