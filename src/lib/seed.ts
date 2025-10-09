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
  const snapshot = await getDocs(collectionRef);
  return snapshot.empty;
}

export async function seedDatabase(db: Firestore) {
  const batch = writeBatch(db);

  // 1. Ensure Super Admin User exists and has storeId
  const superAdminUserQuery = query(collection(db, 'users'), where('email', '==', 'corporacion1@gmail.com'));
  const superAdminSnapshot = await getDocs(superAdminUserQuery);

  if (superAdminSnapshot.empty) {
      throw new Error("Super Admin user not found. Please log in with corporacion1@gmail.com first.");
  }
  const superAdminDoc = superAdminSnapshot.docs[0];
  const superAdminRef = superAdminDoc.ref;
  const superAdminData = superAdminDoc.data();

  // Ensure storeId is set
  if (superAdminData.storeId !== defaultStoreId) {
      batch.update(superAdminRef, { storeId: defaultStoreId });
  }

  // 2. Seed Store (guaranteed to run)
  const storeDocRef = doc(db, 'stores', defaultStoreId);
  // We don't check if it's empty, we just set it to ensure it's correct.
  batch.set(storeDocRef, { ...defaultStore, ownerId: superAdminDoc.id });
  
  // 3. Seed Products
  if (await isCollectionEmpty(db, 'products')) {
    mockProducts.forEach((product) => {
      const docRef = doc(db, 'products', product.id);
      batch.set(docRef, { ...product, createdAt: serverTimestamp() });
    });
  }

  // 4. Seed Customers
  if (await isCollectionEmpty(db, 'customers')) {
    defaultCustomers.forEach((customer) => {
        if(customer.id === 'eventual') return; // Do not save 'eventual' customer in DB
        const docRef = doc(db, 'customers', customer.id);
        batch.set(docRef, customer);
    });
  }

  // 5. Seed Suppliers, Units, Families, Warehouses
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

  // 6. Seed Sales and Purchases
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

  // 7. Seed Ads
  if (await isCollectionEmpty(db, 'ads')) {
    mockAds.forEach((ad) => {
        const docRef = doc(db, 'ads', ad.id);
        batch.set(docRef, { ...ad, createdAt: serverTimestamp() });
    });
  }

  await batch.commit();
}


async function deleteCollection(db: Firestore, collectionPath: string, batch: WriteBatch): Promise<WriteBatch> {
    const collectionRef = collection(db, collectionPath);
    const snapshot = await getDocs(collectionRef);
    let newBatch = batch;
    let operationCount = 0;

    for (const doc of snapshot.docs) {
        // If there are subcollections, recurse
        const subcollections = await getDocs(collection(doc.ref, 'currencyRates')); // Specifically check for currencyRates
        if (!subcollections.empty) {
            newBatch = await deleteCollection(db, `${doc.ref.path}/currencyRates`, newBatch);
        }

        newBatch.delete(doc.ref);
        operationCount++;
        if (operationCount >= 499) {
            await newBatch.commit();
            newBatch = writeBatch(db);
            operationCount = 0;
        }
    }
    return newBatch;
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
        'stores', // This will trigger recursive delete for its subcollections
    ];

    let batch = writeBatch(db);

    // Special handling for the 'users' collection
    const usersQuery = query(collection(db, "users"), where("email", "!=", "corporacion1@gmail.com"));
    const usersSnapshot = await getDocs(usersQuery);
    usersSnapshot.forEach(doc => {
        batch.delete(doc.ref);
    });

    // Delete top-level collections and their subcollections
    for (const collectionName of topLevelCollections) {
        const collectionRef = collection(db, collectionName);
        const snapshot = await getDocs(collectionRef);
        snapshot.docs.forEach(async (docSnapshot) => {
             // Specifically look for and delete the nested currencyRates collection
            const currencyRatesPath = `${collectionName}/${docSnapshot.id}/currencyRates`;
            await deleteCollection(db, currencyRatesPath, batch);
            batch.delete(docSnapshot.ref);
        });
    }

    await batch.commit();
    
    console.log("Firestore factory reset complete.");
}
