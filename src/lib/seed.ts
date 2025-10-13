
'use client';
import {
  writeBatch,
  doc,
  getDocs,
  collection,
  Firestore,
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
  mockAds,
  defaultUsers,
  defaultStoreId,
  mockCurrencyRates,
} from './data';


export async function forceSeedDatabase(firestore: Firestore, storeId: string): Promise<boolean> {
  if (!firestore) {
    console.error("Firestore instance is not available.");
    return false;
  }
  
  const productsRef = collection(firestore, 'products');
  const productsSnapshot = await getDocs(productsRef);
  
  console.log(`Starting to seed database for store: ${storeId}...`);
  const batch = writeBatch(firestore);

  // Seed settings
  const storeRef = doc(firestore, 'stores', storeId);
  batch.set(storeRef, { ...defaultStore, id: storeId, useDemoData: true });

  // Seed Products
  mockProducts.forEach(p => {
    const productDoc = doc(collection(firestore, 'products'));
    batch.set(productDoc, { ...p, id: productDoc.id, storeId });
  });

  // Seed Customers
  defaultCustomers.forEach(c => {
    const customerDoc = doc(collection(firestore, 'customers'));
    batch.set(customerDoc, { ...c, id: customerDoc.id, storeId });
  });
  
  // Seed Suppliers
  defaultSuppliers.forEach(s => {
    const supplierDoc = doc(collection(firestore, 'suppliers'));
    batch.set(supplierDoc, { ...s, id: supplierDoc.id, storeId });
  });

  // Seed Units
  initialUnits.forEach(u => {
    const unitDoc = doc(collection(firestore, 'units'));
    batch.set(unitDoc, { ...u, id: unitDoc.id, storeId });
  });

  // Seed Families
  initialFamilies.forEach(f => {
    const familyDoc = doc(collection(firestore, 'families'));
    batch.set(familyDoc, { ...f, id: familyDoc.id, storeId });
  });

  // Seed Warehouses
  initialWarehouses.forEach(w => {
    const warehouseDoc = doc(collection(firestore, 'warehouses'));
    batch.set(warehouseDoc, { ...w, id: warehouseDoc.id, storeId });
  });
  
  // Seed Ads
  mockAds.forEach(ad => {
    const adDoc = doc(collection(firestore, 'ads'));
    batch.set(adDoc, { ...ad, id: adDoc.id, createdAt: new Date().toISOString() });
  });

  // Seed Currency Rates as a subcollection of the store
  const ratesRef = collection(firestore, 'stores', storeId, 'currencyRates');
  mockCurrencyRates.forEach(rate => {
    const rateDoc = doc(ratesRef);
    batch.set(rateDoc, { ...rate, id: rateDoc.id });
  });

  // Seed Users
  defaultUsers.forEach(user => {
    const userDocRef = doc(firestore, 'users', user.uid);
    batch.set(userDocRef, user);
  });


  try {
    await batch.commit();
    console.log("Database seeded successfully!");
    return true;
  } catch (error) {
    console.error("Error seeding database: ", error);
    throw new Error('Failed to seed database.');
  }
}

export async function factoryReset(firestore: Firestore, storeId: string) {
  const collectionsToDelete = ['products', 'customers', 'suppliers', 'units', 'families', 'warehouses', 'sales', 'purchases', 'ads', 'cashSessions', 'users'];
  console.log(`Iniciando restauración de fábrica para la tienda: ${storeId}...`);

  for (const collectionName of collectionsToDelete) {
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
    }
  }

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

  try {
    const storeDocRef = doc(firestore, 'stores', storeId);
    await setDoc(storeDocRef, {
        ...defaultStore,
        id: storeId,
        ownerId: defaultStore.ownerId,
        useDemoData: true,
    });
     console.log(`Documento de la tienda "${storeId}" ha sido restaurado.`);
  } catch(error) {
      console.error(`Error al restaurar el documento de la tienda:`, error);
  }

  console.log("Restauración de fábrica completada.");
}

    