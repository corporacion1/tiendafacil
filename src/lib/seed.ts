'use client';
import {
  collection,
  doc,
  writeBatch,
  getDocs,
  Firestore,
  serverTimestamp,
  query,
  where,
  getDoc
} from 'firebase/firestore';
import {
  defaultStore,
  mockProducts,
  defaultCustomers,
  defaultSuppliers,
  initialUnits,
  initialFamilies,
  initialWarehouses,
  mockSales,
  mockPurchases,
  mockAds,
  defaultUsers,
  defaultStoreId
} from './data';


/**
 * Performs a "scorched earth" factory reset by deleting all documents in all known collections.
 * This is the simplest, most robust way to ensure a clean slate.
 */
export async function factoryReset(db: Firestore) {
  console.log("Starting Firestore factory reset (scorched earth)...");

  // Explicit list of all top-level collections to be wiped clean.
  // This now includes 'currency_rates' at the top level to fix the bug.
  const collectionsToDelete = [
    'products', 'customers', 'suppliers', 'units', 'families', 
    'warehouses', 'sales', 'purchases', 'inventory_movements', 
    'pendingOrders', 'ads', 'stores', 'users', 'currency_rates'
  ];

  for (const collectionName of collectionsToDelete) {
    console.log(`Deleting all documents from collection: ${collectionName}`);
    const collectionRef = collection(db, collectionName);
    const snapshot = await getDocs(collectionRef);
    
    if (snapshot.empty) {
      console.log(`Collection ${collectionName} is already empty.`);
      continue;
    }

    // A new batch for each collection to avoid hitting the 500-op limit in large collections.
    const batch = writeBatch(db);
    snapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    
    await batch.commit();
    console.log(`Successfully deleted all documents from ${collectionName}.`);
  }
    
  console.log("Firestore factory reset complete. The database is now empty.");
}


/**
 * Seeds the database with the default demo data from a clean slate.
 * This function is now unconditional. It will create all
 * necessary documents, assuming it's running on an empty or pre-reset database.
 */
export async function seedDatabase(db: Firestore) {
  const batch = writeBatch(db);

  // 1. Create/overwrite the default store.
  const storeDocRef = doc(db, 'stores', defaultStoreId);
  batch.set(storeDocRef, defaultStore);

  // 2. Create/overwrite the superAdmin user.
  // Using a predictable UID for the superAdmin for consistency.
  const superAdminUser = defaultUsers.find(u => u.role === 'superAdmin');
  if (superAdminUser) {
      const superAdminUID = 'super_admin_main_user_001';
      const userRef = doc(db, 'users', superAdminUID);
      batch.set(userRef, { 
        ...superAdminUser, 
        uid: superAdminUID, // Ensure UID is set in the document
        storeId: defaultStoreId, // Ensure storeId is correctly linked
        createdAt: serverTimestamp() 
      });
  }

  // 3. Seed all other collections, ensuring they are linked to the default store.
  mockProducts.forEach((product) => {
    const docRef = doc(db, 'products', product.id);
    batch.set(docRef, { ...product, createdAt: serverTimestamp(), storeId: defaultStoreId });
  });

  defaultCustomers.forEach((customer) => {
      if(customer.id === 'eventual') return;
      const docRef = doc(db, 'customers', customer.id);
      batch.set(docRef, customer);
  });

  const seedSimpleCollection = (collectionName: string, data: any[]) => {
      data.forEach((item) => {
          const docRef = doc(db, collectionName, item.id);
          batch.set(docRef, item);
      });
  };

  seedSimpleCollection('suppliers', defaultSuppliers);
  seedSimpleCollection('units', initialUnits);
  seedSimpleCollection('families', initialFamilies);
  seedSimpleCollection('warehouses', initialWarehouses);

  mockSales.forEach((sale) => {
      const docRef = doc(db, 'sales', sale.id);
      batch.set(docRef, sale);
  });

  mockPurchases.forEach((purchase) => {
      const docRef = doc(db, 'purchases', purchase.id);
      batch.set(docRef, purchase);
  });

  mockAds.forEach((ad) => {
      const docRef = doc(db, 'ads', ad.id);
      batch.set(docRef, { ...ad, createdAt: serverTimestamp() });
  });

  await batch.commit();
}
