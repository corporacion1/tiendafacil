
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
  mockAds,
  defaultUsers,
  defaultStoreId,
  mockCurrencyRates,
} from './data';

export async function forceSeedDatabase(firestore: Firestore): Promise<boolean> {
  try {
    console.log('Iniciando el proceso de sembrado forzado...');

    const collectionsToSeed = [
      { name: 'stores', data: [defaultStore], storeId: undefined, idKey: 'id' },
      { name: 'products', data: mockProducts, storeId: defaultStoreId, idKey: 'id' },
      { name: 'customers', data: defaultCustomers, storeId: defaultStoreId, idKey: 'id' },
      { name: 'suppliers', data: defaultSuppliers, storeId: defaultStoreId, idKey: 'id' },
      { name: 'units', data: initialUnits, storeId: defaultStoreId, idKey: 'id' },
      { name: 'families', data: initialFamilies, storeId: defaultStoreId, idKey: 'id' },
      { name: 'warehouses', data: initialWarehouses, storeId: defaultStoreId, idKey: 'id' },
      { name: 'ads', data: mockAds, storeId: undefined, idKey: 'id' },
      { name: 'users', data: defaultUsers, storeId: undefined, idKey: 'uid' },
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

    for (const { name, data, storeId, idKey } of collectionsToSeed) {
      const batch = writeBatch(firestore);
      data.forEach((item: any) => {
        const docId = item[idKey] || doc(collection(firestore, name)).id;
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
  const collections = ['products', 'customers', 'suppliers', 'units', 'families', 'warehouses', 'sales', 'purchases', 'ads', 'users', 'stores', 'cashSessions'];
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
