
"use client"

import React, { createContext, useContext, useMemo } from 'react';
import type { Warehouse } from '@/lib/types';
import { useFirebase, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { collection, doc, addDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { addDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase';

interface WarehousesContextType {
  warehouses: Warehouse[];
  isLoading: boolean;
  addWarehouse: (warehouse: Omit<Warehouse, 'id'>) => Promise<string | void>;
  updateWarehouse: (warehouseId: string, updatedWarehouse: Partial<Warehouse>) => Promise<void>;
  deleteWarehouse: (warehouseId: string) => Promise<void>;
}

const WarehousesContext = createContext<WarehousesContextType | undefined>(undefined);

export const WarehousesProvider = ({ children }: { children: React.ReactNode }) => {
  const { firestore } = useFirebase();
  const { user, isUserLoading } = useUser();
  const storeId = "test-store"; // Placeholder

  const warehousesQuery = useMemoFirebase(() => {
      if (!firestore || !user || isUserLoading || !storeId) return null;
      return collection(firestore, 'stores', storeId, 'warehouses');
  }, [firestore, user, isUserLoading, storeId]);

  const { data: warehouses, isLoading } = useCollection<Warehouse>(warehousesQuery);
  
  const addWarehouse = async (warehouseData: Omit<Warehouse, 'id'>) => {
    if (!firestore || !storeId) return;
    const warehousesCollection = collection(firestore, 'stores', storeId, 'warehouses');
    const docRef = await addDocumentNonBlocking(warehousesCollection, warehouseData);
    return docRef?.id;
  };

  const updateWarehouse = async (warehouseId: string, updatedWarehouseData: Partial<Warehouse>) => {
    if (!firestore || !storeId) return;
    const warehouseDoc = doc(firestore, 'stores', storeId, 'warehouses', warehouseId);
    await updateDocumentNonBlocking(warehouseDoc, updatedWarehouseData);
  };

  const deleteWarehouse = async (warehouseId: string) => {
    if (!firestore || !storeId) return;
    const warehouseDoc = doc(firestore, 'stores', storeId, 'warehouses', warehouseId);
    await deleteDocumentNonBlocking(warehouseDoc);
  }

  const contextValue = {
    warehouses: warehouses || [],
    isLoading: isLoading || isUserLoading,
    addWarehouse,
    updateWarehouse,
    deleteWarehouse,
  };

  return (
    <WarehousesContext.Provider value={contextValue}>
      {children}
    </WarehousesContext.Provider>
  );
};

export const useWarehouses = (): WarehousesContextType => {
  const context = useContext(WarehousesContext);
  if (context === undefined) {
    throw new Error('useWarehouses must be used within a WarehousesProvider');
  }
  return context;
};
