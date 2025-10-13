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
  
  console.log(`Starting to seed database for store: ${storeId}...`);
  const batch = writeBatch(firestore);

  // Seed settings
  const storeRef = doc(firestore, 'stores', storeId);
  batch.set(storeRef, { ...defaultStore, id: storeId, useDemoData: true });

  // Seed Products
  mockProducts.forEach(p => {
    const productDoc = doc(collection(firestore, 'products'));
    batch.set(productDoc, { ...p, id: productDoc.id, createdAt: new Date().toISOString(), storeId });
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
  
  try {
    await batch.commit();
    console.log("Database seeded successfully!");
    return true;
  } catch (error) {
    console.error("Error seeding database: ", error);
    throw new Error('Failed to seed database.');
  }
}
