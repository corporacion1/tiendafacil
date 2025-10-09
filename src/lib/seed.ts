'use client';
import {
  collection,
  doc,
  writeBatch,
  getDocs,
  Firestore,
  query,
  where,
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
 * Seeds the database with the default demo data.
 * This function is now unconditional to ensure reliability. It will:
 * 1. Find the superAdmin user.
 * 2. Force-create or overwrite the default store document.
 * 3. Force-update the superAdmin user profile with the correct storeId.
 * 4. Populate all other demo data, linking it to the default store.
 */
export async function seedDatabase(db: Firestore) {
  const batch = writeBatch(db);

  // 1. Find the superAdmin user to get their actual UID
  const superAdminUserQuery = query(collection(db, 'users'), where('email', '==', 'corporacion1@gmail.com'));
  const superAdminSnapshot = await getDocs(superAdminUserQuery);

  if (superAdminSnapshot.empty) {
      throw new Error("Super Admin user 'corporacion1@gmail.com' not found. Please log in with that user first for it to be created, then try seeding again.");
  }
  const superAdminDoc = superAdminSnapshot.docs[0];
  const superAdminRef = superAdminDoc.ref;
  
  // 2. Force create/overwrite the default store document
  const storeDocRef = doc(db, 'stores', defaultStoreId);
  // Ensure the ownerId is the actual UID of the superAdmin user
  batch.set(storeDocRef, { ...defaultStore, ownerId: superAdminDoc.id });

  // 3. Force update the superAdmin user to ensure it has the storeId
  const superAdminTemplate = defaultUsers.find(u => u.email === 'corporacion1@gmail.com')!;
  const finalSuperAdminData = { 
      ...superAdminDoc.data(),
      ...superAdminTemplate,
      uid: superAdminDoc.id, // Ensure UID is consistent
      storeId: defaultStoreId, // CRITICAL: Ensure storeId is set
      createdAt: superAdminDoc.data().createdAt || serverTimestamp() 
  };
  batch.set(superAdminRef, finalSuperAdminData, { merge: true });

  // 4. Seed all other collections, ensuring they are linked to the default store.
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


/**
 * Performs a factory reset by deleting all data related to the demo.
 * This is a safer implementation that targets specific collections and documents.
 */
export async function factoryReset(db: Firestore) {
  console.log("Starting Firestore factory reset...");
  let batch = writeBatch(db);
  let operationCount = 0;
  const MAX_OPS_PER_BATCH = 450;

  const commitBatchIfFull = async () => {
    if (operationCount >= MAX_OPS_PER_BATCH) {
      console.log(`Committing batch with ${operationCount} operations...`);
      await batch.commit();
      batch = writeBatch(db);
      operationCount = 0;
    }
  };

  const collectionsToDelete = [
    'products', 'customers', 'suppliers', 'units', 'families', 
    'warehouses', 'sales', 'purchases', 'inventory_movements', 
    'pendingOrders', 'ads'
  ];
  
  // 1. Delete all documents from top-level collections
  for (const collectionName of collectionsToDelete) {
    console.log(`Queueing deletion for collection: ${collectionName}`);
    const collectionRef = collection(db, collectionName);
    const snapshot = await getDocs(collectionRef);
    if (!snapshot.empty) {
      snapshot.forEach(doc => {
        batch.delete(doc.ref);
        operationCount++;
      });
      await commitBatchIfFull();
    }
  }

  // 2. Safely delete the default store and its subcollections
  console.log(`Queueing deletion for default store: ${defaultStoreId}`);
  const storeRef = doc(db, 'stores', defaultStoreId);
  const currencyRatesRef = collection(storeRef, 'currencyRates');
  const ratesSnapshot = await getDocs(currencyRatesRef);
  
  if (!ratesSnapshot.empty) {
      console.log(`Queueing deletion for subcollection: currencyRates in ${defaultStoreId}`);
      ratesSnapshot.forEach(rateDoc => {
          batch.delete(rateDoc.ref);
          operationCount++;
      });
      await commitBatchIfFull();
  }
  
  // Delete the store document itself
  batch.delete(storeRef);
  operationCount++;

  // 3. Delete all users except the superAdmin
  console.log("Queueing deletion for users (excluding superAdmin)...");
  const usersQuery = query(collection(db, "users"), where("email", "!=", "corporacion1@gmail.com"));
  const usersSnapshot = await getDocs(usersQuery);
  if (!usersSnapshot.empty) {
    usersSnapshot.forEach(userDoc => {
      batch.delete(userDoc.ref);
      operationCount++;
    });
    await commitBatchIfFull();
  }
  
  // 4. Delete the now-rogue `currency_rates` collection if it exists
  const rogueRatesRef = collection(db, 'currency_rates');
  const rogueRatesSnapshot = await getDocs(rogueRatesRef);
  if (!rogueRatesSnapshot.empty) {
      console.log("Queueing deletion for rogue top-level 'currency_rates' collection.");
      rogueRatesSnapshot.forEach(doc => {
          batch.delete(doc.ref);
          operationCount++;
      });
      await commitBatchIfFull();
  }


  // Commit any remaining operations
  if (operationCount > 0) {
    console.log(`Committing final batch with ${operationCount} operations...`);
    await batch.commit();
  }
    
  console.log("Firestore factory reset complete.");
}
