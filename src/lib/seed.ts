'use client';
import {
  collection,
  doc,
  writeBatch,
  getDocs,
  Firestore,
  serverTimestamp,
  Query,
  query,
  where,
  CollectionReference,
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


async function deleteCollection(db: Firestore, collectionPath: string, batch: any) {
  const collectionRef = collection(db, collectionPath);
  const snapshot = await getDocs(collectionRef);
  if (snapshot.empty) {
    console.log(`Collection ${collectionPath} is already empty.`);
    return;
  }
  snapshot.docs.forEach(doc => {
    batch.delete(doc.ref);
  });
  console.log(`Scheduled deletion for all ${snapshot.size} documents in ${collectionPath}.`);
}


export async function factoryReset(db: Firestore) {
  console.log("Starting Firestore factory reset...");
  const batch = writeBatch(db);

  // Explicitly list all top-level collections to be cleared
  const collectionsToDelete = [
    'products', 'customers', 'suppliers', 'units', 'families', 
    'warehouses', 'sales', 'purchases', 'inventory_movements', 
    'pendingOrders', 'ads', 'stores', 'users', 'currency_rates' 
  ];
  
  for (const collectionName of collectionsToDelete) {
      await deleteCollection(db, collectionName, batch);
  }

  await batch.commit();
  console.log("Firestore factory reset complete. The database should now be empty.");
}


export async function seedDatabase(db: Firestore) {
  const batch = writeBatch(db);

  // 1. Create the default store. This is now the very first step and is unconditional.
  const storeDocRef = doc(db, 'stores', defaultStoreId);
  batch.set(storeDocRef, defaultStore);
  console.log(`Scheduled creation of default store: ${defaultStoreId}`);

  // 2. Create the superAdmin user and link it to the store.
  const superAdminUser = defaultUsers.find(u => u.role === 'superAdmin');
  if (superAdminUser) {
      const superAdminUID = 'super_admin_main_user_001';
      const userRef = doc(db, 'users', superAdminUID);
      batch.set(userRef, { 
        ...superAdminUser, 
        uid: superAdminUID,
        storeId: defaultStoreId,
        createdAt: serverTimestamp() 
      }, { merge: true }); // Use merge to be safe, but it will create if not exists
      console.log(`Scheduled creation/update of superAdmin user: ${superAdminUID}`);
  }

  // 3. Seed all other collections, ensuring they are linked to the default store.
  mockProducts.forEach((product) => {
    const docRef = doc(db, 'products', product.id);
    batch.set(docRef, { ...product, createdAt: serverTimestamp(), storeId: defaultStoreId });
  });

  defaultCustomers.forEach((customer) => {
      const docRef = doc(db, 'customers', customer.id);
      batch.set(docRef, { ...customer, storeId: defaultStoreId });
  });

  const seedSimpleCollection = (collectionName: string, data: any[]) => {
      data.forEach((item) => {
          const docRef = doc(db, collectionName, item.id);
          batch.set(docRef, { ...item, storeId: defaultStoreId });
      });
  };

  seedSimpleCollection('suppliers', defaultSuppliers);
  seedSimpleCollection('units', initialUnits);
  seedSimpleCollection('families', initialFamilies);
  seedSimpleCollection('warehouses', initialWarehouses);

  mockSales.forEach((sale) => {
      const docRef = doc(db, 'sales', sale.id);
      batch.set(docRef, { ...sale, storeId: defaultStoreId });
  });

  mockPurchases.forEach((purchase) => {
      const docRef = doc(db, 'purchases', purchase.id);
      batch.set(docRef, { ...purchase, storeId: defaultStoreId });
  });

  // Ads are global for now, so no storeId needed unless specified.
  mockAds.forEach((ad) => {
      const docRef = doc(db, 'ads', ad.id);
      batch.set(docRef, { ...ad, createdAt: serverTimestamp() });
  });

  console.log("Committing all seed data to Firestore...");
  await batch.commit();
  console.log("Seed data successfully committed.");
}
