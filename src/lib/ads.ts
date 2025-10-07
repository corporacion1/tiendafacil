
import type { Ad } from './types';
import { subDays, addDays } from 'date-fns';

// This data is now just for initial demonstration.
// The actual data will be managed in the /ads page.
export const mockAds: Ad[] = [
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
    status: 'active', // Will be automatically set to inactive
    targetBusinessTypes: ['Tecnologia'],
    expiryDate: subDays(new Date(), 5).toISOString(),
  },
];
