
"use client"

import React, { createContext, useContext, useMemo } from 'react';
import type { Warehouse } from '@/lib/types';
import { useFirebase, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { collection, doc, addDoc, updateDoc, deleteDoc, where, query } from 'firebase/firestore';

interface WarehousesContextType {
  warehouses: Warehouse[];
  isLoading: boolean;
  addWarehouse: (warehouse: Omit<Warehouse, 'id' | 'storeId'>) => Promise<string | undefined>;
  updateWarehouse: (warehouseId: string, updatedWarehouse: Partial<Warehouse>) => Promise<void>;
  deleteWarehouse: (warehouseId: string) => Promise<void>;
}

const WarehousesContext = createContext<WarehousesContextType | undefined>(undefined);

export const WarehousesProvider = ({ children }: { children: React.ReactNode }) => {
  const { firestore } = useFirebase();
  const { user, isUserLoading } = useUser();
  const storeId = "test-store";

  const warehousesQuery = useMemoFirebase(() => {
      if (!firestore || !user || isUserLoading) return null;
      return query(collection(firestore, 'warehouses'), where("storeId", "==", storeId));
  }, [firestore, user, isUserLoading]);

  const { data: warehouses, isLoading } = useCollection<Warehouse>(warehousesQuery);
  
  const addWarehouse = async (warehouseData: Omit<Warehouse, 'id' | 'storeId'>) => {
    if (!firestore || !user) return;
    const warehousesCollection = collection(firestore, 'warehouses');
    const docRef = await addDoc(warehousesCollection, { ...warehouseData, storeId });
    return docRef?.id;
  };

  const updateWarehouse = async (warehouseId: string, updatedWarehouseData: Partial<Warehouse>) => {
    if (!firestore || !user) return;
    const warehouseDoc = doc(firestore, 'warehouses', warehouseId);
    await updateDoc(warehouseDoc, updatedWarehouseData);
  };

  const deleteWarehouse = async (warehouseId: string) => {
    if (!firestore || !user) return;
    const warehouseDoc = doc(firestore, 'warehouses', warehouseId);
    await deleteDoc(warehouseDoc);
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
