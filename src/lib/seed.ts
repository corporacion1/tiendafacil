
'use client';
import {
  collection,
  doc,
  writeBatch,
  getDocs,
  Firestore,
} from 'firebase/firestore';
import {
  mockProducts,
  defaultCustomers,
  defaultSuppliers,
  initialUnits,
  initialFamilies,
  initialWarehouses,
  mockSales,
  mockPurchases,
} from './data';
import { mockAds } from './ads';

async function isCollectionEmpty(db: Firestore, collectionName: string): Promise<boolean> {
  const collectionRef = collection(db, collectionName);
  const snapshot = await getDocs(collectionRef);
  return snapshot.empty;
}

export async function seedDatabase(db: Firestore) {
  const batch = writeBatch(db);

  if (await isCollectionEmpty(db, 'products')) {
    mockProducts.forEach((product) => {
      const docRef = doc(db, 'products', product.id);
      batch.set(docRef, product);
    });
  }
  
  if (await isCollectionEmpty(db, 'customers')) {
    defaultCustomers.forEach((customer) => {
        if(customer.id === 'eventual') return;
        const docRef = doc(db, 'customers', customer.id);
        batch.set(docRef, customer);
    });
  }

  if (await isCollectionEmpty(db, 'suppliers')) {
      defaultSuppliers.forEach((supplier) => {
          const docRef = doc(db, 'suppliers', supplier.id);
          batch.set(docRef, supplier);
      });
  }
  
  if (await isCollectionEmpty(db, 'units')) {
      initialUnits.forEach((unit) => {
          const docRef = doc(db, 'units', unit.id);
          batch.set(docRef, unit);
      });
  }

  if (await isCollectionEmpty(db, 'families')) {
    initialFamilies.forEach((family) => {
        const docRef = doc(db, 'families', family.id);
        batch.set(docRef, family);
    });
  }

  if (await isCollectionEmpty(db, 'warehouses')) {
      initialWarehouses.forEach((warehouse) => {
          const docRef = doc(db, 'warehouses', warehouse.id);
          batch.set(docRef, warehouse);
      });
  }

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

  if (await isCollectionEmpty(db, 'ads')) {
    mockAds.forEach((ad) => {
        const docRef = doc(db, 'ads', ad.id);
        batch.set(docRef, ad);
    });
  }

  await batch.commit();
}
