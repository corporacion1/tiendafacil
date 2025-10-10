
'use client';
import {
  collection,
  doc,
  writeBatch,
  getDocs,
  Firestore,
  serverTimestamp,
  query,
  WriteBatch,
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
  defaultStoreId,
  mockCurrencyRates
} from './data';

async function deleteCollection(db: Firestore, collectionPath: string, batch: WriteBatch) {
  const collectionRef = collection(db, collectionPath);
  const snapshot = await getDocs(collectionRef);
  if (snapshot.empty) {
    return; // Nothing to delete
  }
  snapshot.docs.forEach(doc => {
    batch.delete(doc.ref);
  });
  console.log(`Scheduled deletion for ${snapshot.size} documents in ${collectionPath}.`);
}

async function deleteSubcollections(db: Firestore, parentCollection: string, batch: WriteBatch) {
    const parentCollectionRef = collection(db, parentCollection);
    const parentSnapshot = await getDocs(parentCollectionRef);
    if(parentSnapshot.empty) return;

    for (const docSnapshot of parentSnapshot.docs) {
        // Delete subcollections first
        await deleteCollection(db, `${parentCollection}/${docSnapshot.id}/currencyRates`, batch);
    }
}


export async function factoryReset(db: Firestore) {
  console.log("Starting Firestore factory reset...");
  const batch = writeBatch(db);

  // First, handle nested subcollections
  await deleteSubcollections(db, 'stores', batch);

  // Explicitly list all top-level collections to be cleared
  const collectionsToDelete = [
    'products', 'customers', 'suppliers', 'units', 'families', 
    'warehouses', 'sales', 'purchases', 'inventory_movements', 
    'pendingOrders', 'ads', 'stores', 'users'
  ];
  
  for (const collectionName of collectionsToDelete) {
      await deleteCollection(db, collectionName, batch);
  }

  try {
    await batch.commit();
    console.log("Firestore factory reset complete. The database should now be empty.");
  } catch (error) {
    console.error("Error during factory reset commit:", error);
    throw new Error("Failed to commit factory reset batch.");
  }
}


export async function seedDatabase(db: Firestore) {
  const batch = writeBatch(db);

  // 1. Create the default store.
  const storeDocRef = doc(db, 'stores', defaultStoreId);
  batch.set(storeDocRef, defaultStore);
  console.log(`Scheduled creation of default store: ${defaultStoreId}`);
  
  // 2. Add default currency rates to the store's subcollection
  mockCurrencyRates.forEach((rate, index) => {
    const rateId = `rate-${Date.now()}-${index}`;
    const rateRef = doc(db, 'stores', defaultStoreId, 'currencyRates', rateId);
    batch.set(rateRef, { ...rate, id: rateId });
  });
  console.log(`Scheduled creation of ${mockCurrencyRates.length} currency rates for store: ${defaultStoreId}`);


  // 3. Create the superAdmin user and link it to the store.
  const superAdminUser = defaultUsers.find(u => u.role === 'superAdmin');
  if (superAdminUser) {
      // NOTE: This UID must be manually created in Firebase Auth for the seed to work correctly for the admin.
      const superAdminUID = '5QLaiiIr4mcGsjRXVGeGx50nrpk1'; 
      const userRef = doc(db, 'users', superAdminUID);
      batch.set(userRef, { 
        ...superAdminUser, 
        uid: superAdminUID,
        storeId: defaultStoreId,
        createdAt: serverTimestamp() 
      }, { merge: true });
      console.log(`Scheduled creation/update of superAdmin user: ${superAdminUID}`);
  }

  // 4. Seed all other collections, ensuring they are linked to the default store.
  const seedCollection = (collectionName: string, data: any[], timestampField?: string) => {
    data.forEach((item) => {
        const docRef = doc(db, collectionName, item.id);
        const dataToSet: any = { ...item, storeId: defaultStoreId };
        if (timestampField) {
            dataToSet[timestampField] = serverTimestamp();
        }
        batch.set(docRef, dataToSet);
    });
  };

  seedCollection('products', mockProducts, 'createdAt');
  seedCollection('customers', defaultCustomers);
  seedCollection('suppliers', defaultSuppliers);
  seedCollection('units', initialUnits);
  seedCollection('families', initialFamilies);
  seedCollection('warehouses', initialWarehouses);
  seedCollection('sales', mockSales);
  seedCollection('purchases', mockPurchases);
  seedCollection('ads', mockAds, 'createdAt');
  
  console.log("Committing all seed data to Firestore...");
  await batch.commit();
  console.log("Seed data successfully committed.");
}
