'use client';
import {
  collection,
  doc,
  writeBatch,
  getDocs,
  Firestore,
  query,
  serverTimestamp,
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
 * Seeds the database with the default demo data from scratch.
 * This function is now unconditional and robust. It will create all
 * necessary documents, including the superAdmin user and the default store,
 * assuming it's running on an empty or pre-reset database.
 */
export async function seedDatabase(db: Firestore) {
  const batch = writeBatch(db);

  // 1. Create the default store. This is the first and most critical step.
  const storeDocRef = doc(db, 'stores', defaultStoreId);
  batch.set(storeDocRef, { ...defaultStore });

  // 2. Create the default user(s) from data.ts, including the superAdmin
  // This will create the user with the correct role and storeId from the start.
  for (const user of defaultUsers) {
    // We create a predictable UID for the superAdmin for consistency in seeding.
    const uid = user.role === 'superAdmin' ? 'super_admin_main_user_001' : `user_${Date.now()}`;
    const userRef = doc(db, 'users', uid);
    batch.set(userRef, { 
      ...user, 
      uid: uid,
      createdAt: serverTimestamp() 
    });
  }

  // 3. Seed all other collections, ensuring they are linked to the default store.
  mockProducts.forEach((product) => {
    const docRef = doc(db, 'products', product.id);
    batch.set(docRef, { ...product, createdAt: serverTimestamp(), storeId: defaultStoreId });
  });

  defaultCustomers.forEach((customer) => {
      // Do not write the "Cliente Eventual" to the database
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


/**
 * Performs a true factory reset by deleting all documents in all relevant collections.
 * This is the simplest, most robust way to ensure a clean slate.
 */
export async function factoryReset(db: Firestore) {
  console.log("Starting Firestore factory reset...");
  
  // Explicit list of all collections to be wiped clean.
  const collectionsToDelete = [
    'products', 'customers', 'suppliers', 'units', 'families', 
    'warehouses', 'sales', 'purchases', 'inventory_movements', 
    'pendingOrders', 'ads', 'stores', 'users' // Now includes users
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
    snapshot.forEach(doc => {
      batch.delete(doc.ref);
    });
    
    await batch.commit();
    console.log(`Successfully deleted all documents from ${collectionName}.`);
  }
    
  console.log("Firestore factory reset complete. The database is now empty.");
}
