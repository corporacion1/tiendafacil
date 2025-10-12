
'use client';
import {
  writeBatch,
  doc,
  getDocs,
  collection,
  Firestore,
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

async function seedCollection(
  firestore: Firestore,
  collectionName: string,
  data: any[],
  storeId?: string,
) {
  const batch = writeBatch(firestore);
  const collectionRef = collection(firestore, collectionName);
  
  // Check if collection has data to prevent re-seeding
  const snapshot = await getDocs(collectionRef);
  if (!snapshot.empty) {
    console.log(`Colección "${collectionName}" ya contiene datos. Saltando el sembrado.`);
    return;
  }
  
  console.log(`Sembrando colección: ${collectionName}...`);
  data.forEach((item) => {
    const docId = item.id || doc(collectionRef).id;
    const docRef = doc(firestore, collectionName, docId);
    const dataWithStoreId = storeId ? { ...item, storeId } : item;
    batch.set(docRef, dataWithStoreId);
  });
  await batch.commit();
  console.log(`Colección "${collectionName}" sembrada exitosamente.`);
}


export async function forceSeedDatabase(firestore: Firestore): Promise<boolean> {
  try {
    console.log('Iniciando el proceso de sembrado forzado...');

    const collectionsToSeed = [
      { name: 'stores', data: [defaultStore], storeId: undefined },
      { name: 'products', data: mockProducts, storeId: defaultStoreId },
      { name: 'customers', data: defaultCustomers, storeId: defaultStoreId },
      { name: 'suppliers', data: defaultSuppliers, storeId: defaultStoreId },
      { name: 'units', data: initialUnits, storeId: defaultStoreId },
      { name: 'families', data: initialFamilies, storeId: defaultStoreId },
      { name: 'warehouses', data: initialWarehouses, storeId: defaultStoreId },
      { name: 'sales', data: mockSales, storeId: defaultStoreId },
      { name: 'purchases', data: mockPurchases, storeId: defaultStoreId },
      { name: 'ads', data: mockAds, storeId: undefined },
      { name: 'users', data: defaultUsers, storeId: undefined },
    ];
    
    // Seed currency rates as a subcollection
    const currencyRatesRef = collection(firestore, 'stores', defaultStoreId, 'currencyRates');
    const currencyBatch = writeBatch(firestore);
    mockCurrencyRates.forEach(rate => {
        const docRef = doc(currencyRatesRef);
        currencyBatch.set(docRef, rate);
    });
    await currencyBatch.commit();
    console.log('Subcolección "currencyRates" sembrada.');

    for (const { name, data, storeId } of collectionsToSeed) {
      const batch = writeBatch(firestore);
      data.forEach((item) => {
        const docId = item.id || doc(collection(firestore, name)).id;
        const docRef = doc(firestore, name, docId);
        const dataToSet = storeId && name !== 'stores' ? { ...item, storeId } : item;
        batch.set(docRef, dataToSet);
      });
      await batch.commit();
      console.log(`Colección "${name}" sembrada.`);
    }

    console.log('Sembrado forzado completado.');
    return true;
  } catch (error) {
    console.error('Error durante el sembrado forzado:', error);
    throw error;
  }
}

export async function factoryReset(firestore: Firestore) {
  const collections = ['products', 'customers', 'suppliers', 'units', 'families', 'warehouses', 'sales', 'purchases', 'ads', 'users', 'stores'];
  console.log("Iniciando restauración de fábrica...");

  for (const collectionName of collections) {
    try {
      const collectionRef = collection(firestore, collectionName);
      const snapshot = await getDocs(collectionRef);
      if (snapshot.empty) {
        console.log(`Colección "${collectionName}" ya está vacía.`);
        continue;
      }
      
      const batch = writeBatch(firestore);
      snapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });
      await batch.commit();
      console.log(`Todos los documentos de la colección "${collectionName}" han sido eliminados.`);
    } catch (error) {
      console.error(`Error al eliminar la colección "${collectionName}":`, error);
      // We continue even if one collection fails to delete
    }
  }
  console.log("Restauración de fábrica completada.");
}
