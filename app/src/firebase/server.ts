
import "server-only";
import type { Product, Settings, Ad } from '@/lib/types';
import { defaultStore, mockProducts, mockAds } from '@/lib/data';

// This file is kept for future use, but the functions are now pointing to mock data
// to ensure the application remains stable and functional in a local-only demo mode.

export async function getStoreData(storeId: string): Promise<{ storeSettings: Settings | null, products: Product[], ads: Ad[] }> {
    console.log("getStoreData is running in local-only mode. Returning mock data.");
    
    // Simulate a network delay
    await new Promise(resolve => setTimeout(resolve, 500));

    return {
        storeSettings: defaultStore,
        products: mockProducts.map(p => ({...p, createdAt: new Date().toISOString(), storeId })),
        ads: mockAds.map(ad => ({...ad, createdAt: new Date().toISOString()}))
    };
}
