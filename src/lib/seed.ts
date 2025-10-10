

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
  
  return forceSeedDatabase(db);
}


// Helper to delete all documents in a collection and its subcollections recursively
async function deleteCollection(db: Firestore, collectionPath: string, batch: WriteBatch) {
    const collectionRef = collection(db, collectionPath);
    const snapshot = await getDocs(collectionRef);
    if (snapshot.empty) return;

    for (const docSnapshot of snapshot.docs) {
        // Recursively delete subcollections (example for 'stores')
        if (collectionPath === 'stores') {
            await deleteCollection(db, `stores/${docSnapshot.id}/currencyRates`, batch);
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
  let batch = writeBatch(db);
  let operationCount = 0;
  const commitPromises: Promise<void>[] = [];

  for (const collectionName of collectionsToDelete) {
      const collectionRef = collection(db, collectionName);
      const snapshot = await getDocs(collectionRef);
      if (snapshot.empty) continue;
      
      for (const docSnapshot of snapshot.docs) {
          if (collectionName === 'stores') {
              const currencyRatesRef = collection(db, `stores/${docSnapshot.id}/currencyRates`);
              const ratesSnapshot = await getDocs(currencyRatesRef);
              for (const rateDoc of ratesSnapshot.docs) {
                  batch.delete(rateDoc.ref);
                  operationCount++;
                   if (operationCount >= 499) {
                      commitPromises.push(batch.commit());
                      batch = writeBatch(db);
                      operationCount = 0;
                  }
              }
          }
          batch.delete(docSnapshot.ref);
          operationCount++;
           if (operationCount >= 499) {
              commitPromises.push(batch.commit());
              batch = writeBatch(db);
              operationCount = 0;
           }
      }
  }

  if (operationCount > 0) {
      commitPromises.push(batch.commit());
  }

  try {
    await Promise.all(commitPromises);
    console.log("Firestore factory reset complete.");
  } catch (error) {
    console.error("Error during factory reset commit:", error);
    throw new Error("Failed to commit factory reset batch. The database may be partially cleared.");
  }
}

// New brute-force seeding function
export async function forceSeedDatabase(db: Firestore): Promise<boolean> {
  console.log("Starting forceful database seed...");
  const batch = writeBatch(db);

  // 1. Create the default store.
  const storeDocRef = doc(db, 'stores', defaultStoreId);
  batch.set(storeDocRef, defaultStore);
  
  // 2. Add default currency rates to the store's subcollection
  mockCurrencyRates.forEach((rate, index) => {
    const rateId = `rate-${Date.now()}-${index}`;
    const rateRef = doc(db, 'stores', defaultStoreId, 'currencyRates', rateId);
    batch.set(rateRef, { ...rate, id: rateId });
  });

  // 3. Create the superAdmin user and link it to the store.
  const superAdminUser = defaultUsers.find(u => u.role === 'superAdmin');
  if (superAdminUser) {
      const superAdminUID = '5QLaiiIr4mcGsjRXVGeGx50nrpk1'; 
      const userRef = doc(db, 'users', superAdminUID);
      batch.set(userRef, { 
        ...superAdminUser, 
        uid: superAdminUID,
        storeId: defaultStoreId,
        createdAt: new Date().toISOString() // Use ISO string instead of serverTimestamp
      }, { merge: true });
  }

  // 4. Seed all other collections, ensuring they are linked to the default store.
  const seedCollection = (collectionName: string, data: any[], timestampField?: string) => {
    data.forEach((item) => {
        const docRef = doc(db, collectionName, item.id);
        const dataToSet: any = { ...item, storeId: defaultStoreId };
        if (timestampField) {
            dataToSet[timestampField] = new Date().toISOString(); // Use ISO string
        } else if (item.date) { // Ensure date fields are handled correctly
            dataToSet.date = new Date(item.date).toISOString();
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
  console.log("Forceful seed data successfully committed.");
  return true;
}
