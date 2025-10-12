

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

// This function is deprecated and should not be used.
// The "Modo Demo" switch handles the transition to live data.
export async function forceSeedDatabase(firestore: Firestore): Promise<boolean> {
  console.warn('forceSeedDatabase is deprecated and should not be used.');
  return false;
}

export async function factoryReset(firestore: Firestore, storeId: string) {
  const collectionsToDelete = ['products', 'customers', 'suppliers', 'units', 'families', 'warehouses', 'sales', 'purchases', 'ads', 'cashSessions'];
  console.log(`Iniciando restauración de fábrica para la tienda: ${storeId}...`);

  for (const collectionName of collectionsToDelete) {
    try {
      const collectionRef = collection(firestore, collectionName);
      // Firestore does not allow querying by storeId on all collections, so we delete all.
      // This is a dangerous operation, hence the triple confirmation.
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

  // Also delete subcollections like currencyRates
  try {
      const ratesRef = collection(firestore, 'stores', storeId, 'currencyRates');
      const ratesSnapshot = await getDocs(ratesRef);
      const ratesBatch = writeBatch(firestore);
      ratesSnapshot.forEach(doc => ratesBatch.delete(doc.ref));
      await ratesBatch.commit();
      console.log('Subcolección "currencyRates" eliminada.');
  } catch (error) {
       console.error(`Error al eliminar la subcolección "currencyRates":`, error);
  }

  // Finally, reset the store document itself to default, but keep the ID and owner.
  try {
    const storeDocRef = doc(firestore, 'stores', storeId);
    await setDoc(storeDocRef, {
        ...defaultStore,
        id: storeId, // Keep original ID
        ownerId: defaultStore.ownerId, // Ensure owner is the superAdmin
        useDemoData: true, // IMPORTANT: Force back to demo mode
    });
     console.log(`Documento de la tienda "${storeId}" ha sido restaurado.`);
  } catch(error) {
      console.error(`Error al restaurar el documento de la tienda:`, error);
  }

  console.log("Restauración de fábrica completada.");
}
