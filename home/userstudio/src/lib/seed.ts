
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

// This file is intended for server-side seeding or specific admin actions,
// and should not be called directly from client-side components by default
// to avoid bundling large amounts of data and logic to the client.

// The functions are kept for potential future use in a secure admin panel or a seeding script.
