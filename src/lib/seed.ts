'use client';
import {
  collection,
  doc,
  writeBatch,
  getDocs,
  Firestore,
  WriteBatch,
  query,
  where,
  serverTimestamp,
  getDoc,
  setDoc,
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

async function isCollectionEmpty(db: Firestore, collectionName: string): Promise<boolean> {
  const collectionRef = collection(db, collectionName);
  const snapshot = await getDocs(query(collectionRef));
  return snapshot.empty;
}


export async function seedDatabase(db: Firestore) {
  const batch = writeBatch(db);

  // 1. Ensure Super Admin User exists and has storeId
  const superAdminUserQuery = query(collection(db, 'users'), where('email', '==', 'corporacion1@gmail.com'));
  const superAdminSnapshot = await getDocs(superAdminUserQuery);

  if (superAdminSnapshot.empty) {
      throw new Error("Super Admin user 'corporacion1@gmail.com' not found. Please log in with that user first.");
  }
  const superAdminDoc = superAdminSnapshot.docs[0];
  const superAdminRef = superAdminDoc.ref;
  const superAdminDataFromDb = superAdminDoc.data();
  
  // Get the template for the super admin user from our data file
  const superAdminTemplate = defaultUsers.find(u => u.email === 'corporacion1@gmail.com');
  if (!superAdminTemplate) {
      throw new Error("Default super admin user is not defined in data.ts");
  }

  // Merge existing data with our required template data (especially storeId)
  const finalSuperAdminData = { 
      ...superAdminDataFromDb, 
      ...superAdminTemplate,
      uid: superAdminDoc.id, // ensure UID is correct
      createdAt: superAdminDataFromDb.createdAt || serverTimestamp() // Preserve original creation date
  };

  // Use `set` with `merge: true` to guarantee the storeId is added or updated.
  batch.set(superAdminRef, finalSuperAdminData, { merge: true });

  // 2. Seed Store (guaranteed to run)
  const storeDocRef = doc(db, 'stores', defaultStoreId);
  // We use `set` to create or overwrite the store, ensuring it's always correct.
  batch.set(storeDocRef, { ...defaultStore, ownerId: superAdminDoc.id });
  
  // 3. Seed Products if the collection is empty
  if (await isCollectionEmpty(db, 'products')) {
    mockProducts.forEach((product) => {
      const docRef = doc(db, 'products', product.id);
      batch.set(docRef, { ...product, createdAt: serverTimestamp() });
    });
  }

  // 4. Seed Customers if the collection is empty
  if (await isCollectionEmpty(db, 'customers')) {
    defaultCustomers.forEach((customer) => {
        if(customer.id === 'eventual') return; // Do not save 'eventual' customer in DB
        const docRef = doc(db, 'customers', customer.id);
        batch.set(docRef, customer);
    });
  }

  // 5. Seed other simple collections if they are empty
  const seedSimpleCollection = async (collectionName: string, data: any[]) => {
      if (await isCollectionEmpty(db, collectionName)) {
          data.forEach((item) => {
              const docRef = doc(db, collectionName, item.id);
              batch.set(docRef, item);
          });
      }
  };

  await seedSimpleCollection('suppliers', defaultSuppliers);
  await seedSimpleCollection('units', initialUnits);
  await seedSimpleCollection('families', initialFamilies);
  await seedSimpleCollection('warehouses', initialWarehouses);

  // 6. Seed Sales and Purchases if their collections are empty
  if (await isCollectionEmpty(db, 'sales')) {
      mockSales.forEach((sale) => {
          const docRef = doc(db, 'sales', sale.id);
          batch.set(docRef, sale);
      });
  }

  if (await isCollectionEmpty(db, 'purchases')) {
    mockPurchases.forEach((purchase) => {
        const docRef = doc(db, 'purchases', purchase.id);
        batch.set(docRef, purchase);
    });
  }

  // 7. Seed Ads if the collection is empty
  if (await isCollectionEmpty(db, 'ads')) {
    mockAds.forEach((ad) => {
        const docRef = doc(db, 'ads', ad.id);
        batch.set(docRef, { ...ad, createdAt: serverTimestamp() });
    });
  }

  // Commit all batched writes to Firestore
  await batch.commit();
}


async function deleteCollection(db: Firestore, collectionPath: string, batch: WriteBatch): Promise<WriteBatch> {
    const collectionRef = collection(db, collectionPath);
    const q = query(collectionRef);
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
        return batch;
    }

    let currentBatch = batch;
    let operationCount = 0;

    for (const doc of snapshot.docs) {
        // Recursive call to delete subcollections first
        const subcollections = await doc.ref.listCollections?.(); // Note: This is an admin SDK feature, might not work on client
        if (subcollections) {
            for (const sub of subcollections) {
               currentBatch = await deleteCollection(db, sub.path, currentBatch);
            }
        }
        
        currentBatch.delete(doc.ref);
        operationCount++;

        // Firestore batches have a limit of 500 operations.
        if (operationCount >= 499) {
            await currentBatch.commit();
            currentBatch = writeBatch(db);
            operationCount = 0;
        }
    }
    return currentBatch;
}


export async function factoryReset(db: Firestore) {
    console.log("Performing Firestore factory reset...");

    const topLevelCollections = [
        'products',
        'customers',
        'suppliers',
        'units',
        'families',
        'warehouses',
        'sales',
        'purchases',
        'inventory_movements',
        'pendingOrders',
        'ads',
        'stores',
    ];

    let batch = writeBatch(db);

    // Special handling for the 'users' collection: delete all except superAdmin
    const usersQuery = query(collection(db, "users"), where("email", "!=", "corporacion1@gmail.com"));
    const usersSnapshot = await getDocs(usersQuery);
    usersSnapshot.forEach(doc => {
        batch.delete(doc.ref);
    });
    
    // Delete all documents in top-level collections
    for (const collectionName of topLevelCollections) {
        const collectionRef = collection(db, collectionName);
        const snapshot = await getDocs(collectionRef);
        for (const docSnapshot of snapshot.docs) {
             // Specifically delete the nested 'currencyRates' collection for each store
            if (collectionName === 'stores') {
                const ratesCollectionPath = `stores/${docSnapshot.id}/currencyRates`;
                const ratesSnapshot = await getDocs(collection(db, ratesCollectionPath));
                ratesSnapshot.forEach(rateDoc => {
                    batch.delete(rateDoc.ref);
                });
            }
            batch.delete(docSnapshot.ref);
        }
    }
    
    // Commit the batch to execute all delete operations
    await batch.commit();
    
    console.log("Firestore factory reset complete.");
}
