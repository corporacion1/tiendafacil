

'use client';
// This file is now for reference only. No functions are called.
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

// This function now just returns false to satisfy the call in login page, but does nothing.
export async function forceSeedDatabase(): Promise<boolean> {
  console.log("forceSeedDatabase is disabled. Using local data.");
  return false;
}

// This function does nothing.
export async function factoryReset() {
  console.log("factoryReset is disabled. Using local data.");
  return;
}

    