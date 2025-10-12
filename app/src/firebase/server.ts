
import "server-only";
import * as admin from 'firebase-admin';
import { getApps } from 'firebase-admin/app';
import type { Product, Settings, Ad } from '@/lib/types';
import { defaultStore, mockProducts, mockAds } from '@/lib/data';

// This file is kept for future use, but the functions are now pointing to mock data
// to ensure the application remains stable and functional in a local-only demo mode.

const isFirebaseInitialized = getApps().length > 0;
if (!isFirebaseInitialized) {
  console.warn("Firebase Admin SDK is not initialized. Server-side operations will be simulated.");
}

// Helper function to safely serialize Firestore data
function serialize<T>(doc: admin.firestore.DocumentSnapshot): T | null {
    if (!doc.exists) {
        return null;
    }
    const data = doc.data() as any;
    // Convert Timestamps to ISO strings
    for (const key in data) {
        if (data[key] instanceof admin.firestore.Timestamp) {
            data[key] = data[key].toDate().toISOString();
        }
    }
    return { ...data, id: doc.id } as T;
}

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

    