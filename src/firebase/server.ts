import "server-only";
import * as admin from 'firebase-admin';
import { getApps } from 'firebase-admin/app';
import type { Product, Settings, Ad } from '@/lib/types';
import { defaultStore, mockProducts, mockAds } from '@/lib/data';

const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
  ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
  : undefined;

if (!getApps().length) {
  if (serviceAccount) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  } else {
    // This will initialize the app with Application Default Credentials
    // Useful for running in Google Cloud environments like Cloud Run
    console.log("Initializing Firebase Admin with Application Default Credentials");
    admin.initializeApp();
  }
}

const firestore = admin.firestore();

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
    if (!serviceAccount && process.env.NODE_ENV !== "production") {
        console.warn("Service account not found. Falling back to demo data for server-side rendering.");
        return {
            storeSettings: defaultStore,
            products: mockProducts.map(p => ({...p, createdAt: new Date().toISOString(), storeId })),
            ads: mockAds.map(ad => ({...ad, createdAt: new Date().toISOString()}))
        };
    }

    try {
        const storeDocRef = firestore.collection('stores').doc(storeId);
        const storeDoc = await storeDocRef.get();
        
        if (!storeDoc.exists) {
            console.warn(`Store with ID "${storeId}" not found. Returning null settings.`);
            return { storeSettings: null, products: [], ads: [] };
        }
        
        const storeSettings = serialize<Settings>(storeDoc);

        const productsQuery = firestore.collection('products').where('storeId', '==', storeId).where('status', '!=', 'inactive');
        const productsSnapshot = await productsQuery.get();
        const products = productsSnapshot.docs.map(doc => serialize<Product>(doc)).filter((p): p is Product => p !== null);

        const adsQuery = firestore.collection('ads').where('status', '==', 'active');
        const adsSnapshot = await adsQuery.get();
        const ads = adsSnapshot.docs.map(doc => serialize<Ad>(doc)).filter((ad): ad is Ad => ad !== null);
        
        return { storeSettings, products, ads };

    } catch (error) {
        console.error(`Error fetching data for store ${storeId}:`, error);
        // In case of error, you might want to fallback or handle it gracefully
        return { storeSettings: null, products: [], ads: [] };
    }
}
