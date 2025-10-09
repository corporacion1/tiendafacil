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

  // 1. Force update/create the superAdmin user to ensure it has the correct storeId
  const superAdminUserQuery = query(collection(db, 'users'), where('email', '==', 'corporacion1@gmail.com'));
  const superAdminSnapshot = await getDocs(superAdminUserQuery);

  if (superAdminSnapshot.empty) {
      throw new Error("Super Admin user 'corporacion1@gmail.com' not found. Please log in with that user first for it to be created.");
  }
  const superAdminDoc = superAdminSnapshot.docs[0];
  const superAdminRef = superAdminDoc.ref;
  
  const superAdminTemplate = defaultUsers.find(u => u.email === 'corporacion1@gmail.com');
  if (!superAdminTemplate) {
      throw new Error("Default super admin user is not defined in data.ts");
  }

  const finalSuperAdminData = { 
      ...superAdminDoc.data(), 
      ...superAdminTemplate,
      uid: superAdminDoc.id,
      storeId: defaultStoreId, // Ensure storeId is set
      createdAt: superAdminDoc.data().createdAt || serverTimestamp() 
  };
  // Use `set` with `merge: true` to guarantee the storeId is added or updated.
  batch.set(superAdminRef, finalSuperAdminData, { merge: true });

  // 2. Force create/overwrite the default store
  const storeDocRef = doc(db, 'stores', defaultStoreId);
  batch.set(storeDocRef, { ...defaultStore, ownerId: superAdminDoc.id });
  
  // 3. Seed Products
  mockProducts.forEach((product) => {
    const docRef = doc(db, 'products', product.id);
    batch.set(docRef, { ...product, createdAt: serverTimestamp(), storeId: defaultStoreId });
  });

  // 4. Seed Customers
  defaultCustomers.forEach((customer) => {
      if(customer.id === 'eventual') return; // Do not save 'eventual' customer in DB
      const docRef = doc(db, 'customers', customer.id);
      batch.set(docRef, customer);
  });
  
  // 5. Seed other simple collections
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

  // 6. Seed Sales and Purchases
  mockSales.forEach((sale) => {
      const docRef = doc(db, 'sales', sale.id);
      batch.set(docRef, sale);
  });

  mockPurchases.forEach((purchase) => {
      const docRef = doc(db, 'purchases', purchase.id);
      batch.set(docRef, purchase);
  });

  // 7. Seed Ads
  mockAds.forEach((ad) => {
      const docRef = doc(db, 'ads', ad.id);
      batch.set(docRef, { ...ad, createdAt: serverTimestamp() });
  });

  // Commit all batched writes to Firestore
  await batch.commit();
}


async function deleteCollection(db: Firestore, collectionPath: string, batch: any) {
  const collectionRef = collection(db, collectionPath);
  const snapshot = await getDocs(collectionRef);

  if (snapshot.empty) {
    return batch; // Return the same batch if collection is empty
  }
  
  snapshot.docs.forEach(doc => {
    batch.delete(doc.ref);
  });
  
  return batch;
}

export async function factoryReset(db: Firestore) {
  console.log("Starting Firestore factory reset...");
  let batch = writeBatch(db);
  let operationCount = 0;

  const commitBatchIfFull = async () => {
    if (operationCount >= 450) {
      console.log(`Committing batch with ${operationCount} operations...`);
      await batch.commit();
      batch = writeBatch(db);
      operationCount = 0;
    }
  };

  const collectionsToDelete = [
    'products', 'customers', 'suppliers', 'units', 'families', 
    'warehouses', 'sales', 'purchases', 'inventory_movements', 
    'pendingOrders', 'ads', 'currency_rates' // Also delete the rogue top-level collection
  ];
  
  // Delete all top-level collections
  for (const collectionName of collectionsToDelete) {
    console.log(`Deleting collection: ${collectionName}`);
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

  // Explicitly delete subcollections within 'stores'
  console.log("Deleting 'stores' collection and its subcollections...");
  const storesCollectionRef = collection(db, 'stores');
  const storesSnapshot = await getDocs(storesCollectionRef);
  if (!storesSnapshot.empty) {
    for (const storeDoc of storesSnapshot.docs) {
      // Delete subcollections like 'currencyRates'
      const ratesCollectionRef = collection(db, `stores/${storeDoc.id}/currencyRates`);
      const ratesSnapshot = await getDocs(ratesCollectionRef);
      if (!ratesSnapshot.empty) {
        ratesSnapshot.forEach(rateDoc => {
          batch.delete(rateDoc.ref);
          operationCount++;
        });
        await commitBatchIfFull();
      }
      // Finally, delete the store document itself
      batch.delete(storeDoc.ref);
      operationCount++;
      await commitBatchIfFull();
    }
  }

  // Delete all users except the superAdmin
  console.log("Deleting users except superAdmin...");
  const usersQuery = query(collection(db, "users"), where("email", "!=", "corporacion1@gmail.com"));
  const usersSnapshot = await getDocs(usersQuery);
  if (!usersSnapshot.empty) {
    usersSnapshot.forEach(userDoc => {
      batch.delete(userDoc.ref);
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
