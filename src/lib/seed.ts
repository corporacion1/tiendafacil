
'use client';
import {
  collection,
  doc,
  writeBatch,
  getDocs,
  Firestore,
  serverTimestamp,
  WriteBatch
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

// This function now checks if the DB is empty before seeding and returns a boolean.
export async function seedDatabase(db: Firestore): Promise<boolean> {
  const storeCollectionRef = collection(db, 'stores');
  const storeSnapshot = await getDocs(storeCollectionRef);

  // --- ONLY SEED IF THE 'stores' COLLECTION IS EMPTY ---
  if (!storeSnapshot.empty) {
    console.log("Database already contains data. Skipping seed process.");
    return false; // Indicates that seeding was not performed.
  }
  
  console.log("Database is empty. Starting seed process...");
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
  return true; // Indicates that seeding was performed.
}

// Helper to delete all documents in a collection and its subcollections recursively
async function deleteCollection(db: Firestore, collectionPath: string, batch: WriteBatch) {
    const collectionRef = collection(db, collectionPath);
    const snapshot = await getDocs(collectionRef);
    if (snapshot.empty) return;

    for (const docSnapshot of snapshot.docs) {
        // Recursively delete subcollections (example for 'stores')
        if (collectionPath === 'stores') {
            await deleteCollection(db, `${collectionPath}/${docSnapshot.id}/currencyRates`, batch);
        }
        batch.delete(docSnapshot.ref);
    }
}

// The main factory reset function
export async function factoryReset(db: Firestore) {
  console.log("Performing Firestore factory reset...");

  const collectionsToDelete = [
    'products', 'customers', 'suppliers', 'units', 'families', 
    'warehouses', 'sales', 'purchases', 'inventory_movements', 
    'pendingOrders', 'ads', 'stores', 'users'
  ];
  
  // We need to handle this in multiple batches if there is a lot of data.
  // For simplicity here, we assume it fits in a reasonable number of batches.
  // A more robust solution would loop until all collections are empty.
  
  const batch = writeBatch(db);

  for (const collectionName of collectionsToDelete) {
      await deleteCollection(db, collectionName, batch);
  }

  try {
    await batch.commit();
    console.log("Firestore factory reset complete.");
  } catch (error) {
    console.error("Error during factory reset commit:", error);
    // If the batch fails (e.g., too large), a more complex, iterative deletion
    // strategy would be needed. For this app's scope, this is a reasonable approach.
    throw new Error("Failed to commit factory reset batch. The database may be partially cleared.");
  }
}
