
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
} from './data';

async function isCollectionEmpty(db: Firestore, collectionName: string): Promise<boolean> {
  const collectionRef = collection(db, collectionName);
  const snapshot = await getDocs(collectionRef);
  return snapshot.empty;
}

export async function seedDatabase(db: Firestore) {
  const batch = writeBatch(db);

  // Seed Store
  const storeDocRef = doc(db, 'stores', defaultStore.id);
  const storeSnapshot = await getDocs(query(collection(db, 'stores'), where('id', '==', defaultStore.id)));
  if (storeSnapshot.empty) {
    batch.set(storeDocRef, defaultStore);
  }

  // Seed Products
  if (await isCollectionEmpty(db, 'products')) {
    mockProducts.forEach((product) => {
      const docRef = doc(db, 'products', product.id);
      batch.set(docRef, { ...product, createdAt: serverTimestamp() });
    });
  }

  // Seed Customers
  if (await isCollectionEmpty(db, 'customers')) {
    defaultCustomers.forEach((customer) => {
        if(customer.id === 'eventual') return;
        const docRef = doc(db, 'customers', customer.id);
        batch.set(docRef, customer);
    });
  }

  // Seed Suppliers
  if (await isCollectionEmpty(db, 'suppliers')) {
      defaultSuppliers.forEach((supplier) => {
          const docRef = doc(db, 'suppliers', supplier.id);
          batch.set(docRef, supplier);
      });
  }

  // Seed Units
  if (await isCollectionEmpty(db, 'units')) {
      initialUnits.forEach((unit) => {
          const docRef = doc(db, 'units', unit.id);
          batch.set(docRef, unit);
      });
  }

  // Seed Families
  if (await isCollectionEmpty(db, 'families')) {
    initialFamilies.forEach((family) => {
        const docRef = doc(db, 'families', family.id);
        batch.set(docRef, family);
    });
  }

  // Seed Warehouses
  if (await isCollectionEmpty(db, 'warehouses')) {
      initialWarehouses.forEach((warehouse) => {
          const docRef = doc(db, 'warehouses', warehouse.id);
          batch.set(docRef, warehouse);
      });
  }

  // Seed Sales
  if (await isCollectionEmpty(db, 'sales')) {
      mockSales.forEach((sale) => {
          const docRef = doc(db, 'sales', sale.id);
          batch.set(docRef, sale);
      });
  }

  // Seed Purchases
  if (await isCollectionEmpty(db, 'purchases')) {
    mockPurchases.forEach((purchase) => {
        const docRef = doc(db, 'purchases', purchase.id);
        batch.set(docRef, purchase);
    });
  }

  // Seed Ads
  if (await isCollectionEmpty(db, 'ads')) {
    mockAds.forEach((ad) => {
        const docRef = doc(db, 'ads', ad.id);
        batch.set(docRef, { ...ad, createdAt: serverTimestamp() });
    });
  }

  await batch.commit();
}


export async function factoryReset(db: Firestore) {
    console.log("Performing Firestore factory reset...");

    const collectionsToDelete = [
        'products',
        'customers',
        'suppliers',
        'units',
        'families',
        'warehouses',
        'sales',
        'purchases',
        'inventory_movements',
        'currencyRates',
        'pendingOrders',
        'ads',
        'stores',
    ];

    const commitPromises: Promise<void>[] = [];
    let batch = writeBatch(db);
    let operationCount = 0;

    // Special handling for the 'users' collection
    const usersQuery = query(collection(db, "users"), where("email", "!=", "corporacion1@gmail.com"));
    const usersSnapshot = await getDocs(usersQuery);
    usersSnapshot.forEach(doc => {
        batch.delete(doc.ref);
        operationCount++;
    });

    for (const collectionName of collectionsToDelete) {
        const collectionRef = collection(db, collectionName);
        const snapshot = await getDocs(collectionRef);
        snapshot.docs.forEach(doc => {
            batch.delete(doc.ref);
            operationCount++;
            if (operationCount >= 499) {
                commitPromises.push(batch.commit());
                batch = writeBatch(db);
                operationCount = 0;
            }
        });
    }

    if (operationCount > 0) {
        commitPromises.push(batch.commit());
    }

    await Promise.all(commitPromises);
    
    console.log("Firestore factory reset complete.");
}
