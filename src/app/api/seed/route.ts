
import { NextResponse } from 'next/server';
import { initializeApp, getApps, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { credential } from 'firebase-admin';
import { defaultStore, mockProducts, defaultCustomers, defaultSuppliers, initialUnits, initialFamilies, initialWarehouses, mockAds, mockCurrencyRates } from '@/lib/data';

// --- SERVICE ACCOUNT & FIREBASE ADMIN INITIALIZATION ---
// This is a simplified version of the server-side seed logic.
// In a real app, you would use environment variables for service account keys.
const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
  ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
  : undefined;

let adminApp: App;
let db: Firestore;

if (!getApps().length) {
    if (serviceAccount) {
        adminApp = initializeApp({
            credential: credential.cert(serviceAccount),
        });
    } else {
        // Fallback for environments without the service account env var
        console.warn("FIREBASE_SERVICE_ACCOUNT not set. Initializing default admin app.");
        adminApp = initializeApp();
    }
} else {
    adminApp = getApps()[0];
}

db = getFirestore(adminApp);
// --- END INITIALIZATION ---


/**
 * Seeds the database with a full set of demo data for a given storeId.
 * This function will OVERWRITE existing data for the collections.
 * @param storeId The ID of the store to seed data for.
 */
async function seedDatabase(storeId: string) {
  if (!db) {
    throw new Error("Firestore admin instance is not available.");
  }

  console.log(`Starting to seed database for store: ${storeId}...`);
  const batch = db.batch();

  // 1. Seed Store Settings
  const storeRef = db.collection('stores').doc(storeId);
  batch.set(storeRef, { ...defaultStore, id: storeId, useDemoData: true, createdAt: new Date().toISOString() });

  // 2. Seed Products
  const productsCollection = db.collection('products');
  mockProducts.forEach(p => {
    const productDoc = productsCollection.doc();
    batch.set(productDoc, { ...p, id: productDoc.id, createdAt: new Date().toISOString(), storeId });
  });

  // 3. Seed Customers
  const customersCollection = db.collection('customers');
  defaultCustomers.forEach(c => {
    const customerDoc = customersCollection.doc();
    batch.set(customerDoc, { ...c, id: customerDoc.id, storeId });
  });

  // 4. Seed Suppliers
  const suppliersCollection = db.collection('suppliers');
  defaultSuppliers.forEach(s => {
    const supplierDoc = suppliersCollection.doc();
    batch.set(supplierDoc, { ...s, id: supplierDoc.id, storeId });
  });

  // 5. Seed Units, Families, Warehouses
  initialUnits.forEach(u => batch.set(db.collection('units').doc(), { ...u, storeId }));
  initialFamilies.forEach(f => batch.set(db.collection('families').doc(), { ...f, storeId }));
  initialWarehouses.forEach(w => batch.set(db.collection('warehouses').doc(), { ...w, storeId }));

  // 6. Seed Ads (Global)
  const adsCollection = db.collection('ads');
  mockAds.forEach(ad => {
    const adDoc = adsCollection.doc();
    batch.set(adDoc, { ...ad, id: adDoc.id, createdAt: new Date().toISOString() });
  });

  // 7. Seed Currency Rates as subcollection
  const ratesRef = db.collection('stores').doc(storeId).collection('currencyRates');
  mockCurrencyRates.forEach(rate => {
    const rateDoc = ratesRef.doc();
    batch.set(rateDoc, { ...rate, id: rateDoc.id });
  });

  // Note: We are not seeding sales, purchases, or cash sessions to start with a clean slate.

  await batch.commit();
  console.log(`Database seeded successfully for store ${storeId}.`);
}


export async function POST(request: Request) {
  try {
    const { storeId } = await request.json();
    if (!storeId) {
      return NextResponse.json({ message: 'storeId is required' }, { status: 400 });
    }

    // This will perform the full seeding operation.
    await seedDatabase(storeId);

    return NextResponse.json({ message: 'Database seeded successfully' }, { status: 200 });
  } catch (error: any) {
    console.error('API Seed Error:', error);
    return NextResponse.json({ message: 'Internal Server Error', error: error.message }, { status: 500 });
  }
}
