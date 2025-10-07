
import type { Ad } from './types';

// This data is now just for initial demonstration.
// The actual data will be managed in the /ads page.
export const mockAds: Ad[] = [
  {
    id: "ad-1",
    sku: "PROMO-001",
    name: "Servicio Técnico Especializado",
    description: "Reparamos tu PC con los mejores componentes.",
    price: 0,
    imageUrl: "https://images.unsplash.com/photo-1576680590355-32033c563339?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    imageHint: "computer repair",
    targetBusinessType: "Tecnologia",
    views: 1024,
    status: 'active',
    storeIds: ['store-1'],
  },
  {
    id: "ad-2",
    sku: "PROMO-002",
    name: "Potencia tu PC con Nosotros",
    description: "Los mejores componentes para tu PC gamer.",
    price: 0,
    imageUrl: "https://images.unsplash.com/photo-1593640408182-31c70c8268f5?q=80&w=2042&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    imageHint: "gaming pc",
    targetBusinessType: "Tecnologia",
    views: 512,
    status: 'active',
    storeIds: ['store-1'],
  },
];
