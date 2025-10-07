
import type { Ad } from './types';
import { subDays, addDays } from 'date-fns';

// This data is now just for initial demonstration.
// The actual data will be managed in the /ads page.
export const mockAds: Ad[] = [
  {
    id: "ad-1",
    sku: "PROMO-001",
    name: "Servicio Técnico Especializado",
    description: "Reparamos tu PC con los mejores componentes.",
    price: 0,
    imageUrl: "https://images.unsplash.com/photo-1576680590355-32033c563339?q=80&w=600&auto=format&fit=crop",
    imageHint: "computer repair",
    views: 1024,
    status: 'active',
    targetBusinessType: 'Tecnologia',
    expiryDate: addDays(new Date(), 30).toISOString(),
  },
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
    targetBusinessType: 'Tecnologia',
    expiryDate: addDays(new Date(), 60).toISOString(),
  },
  {
    id: "ad-4",
    sku: "FARM-001",
    name: "20% de Descuento en Vitaminas",
    description: "Cuida tu salud con nuestras vitaminas en oferta.",
    price: 0,
    imageUrl: "https://images.unsplash.com/photo-1607619056574-7d8d3ee536b2?q=80&w=600&auto=format&fit=crop",
    imageHint: "vitamins pharmacy",
    views: 840,
    status: 'active',
    targetBusinessType: 'Salud y Belleza',
    expiryDate: addDays(new Date(), 45).toISOString(),
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
    targetBusinessType: 'Supermercado',
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
    status: 'active', // Will be automatically set to inactive
    targetBusinessType: 'Tecnologia',
    expiryDate: subDays(new Date(), 5).toISOString(),
  },
];
