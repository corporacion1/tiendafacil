
"use client"

import React, { createContext, useContext, useMemo } from 'react';
import type { Warehouse } from '@/lib/types';
import { useFirebase, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { collection, doc, addDoc, updateDoc, deleteDoc, query } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

interface WarehousesContextType {
  warehouses: Warehouse[];
  isLoading: boolean;
  addWarehouse: (warehouse: Omit<Warehouse, 'id'>) => Promise<string | undefined>;
  updateWarehouse: (warehouseId: string, updatedWarehouse: Partial<Omit<Warehouse, 'id'>>) => Promise<void>;
  deleteWarehouse: (warehouseId: string) => Promise<void>;
}

const WarehousesContext = createContext<WarehousesContextType | undefined>(undefined);

export const WarehousesProvider = ({ children }: { children: React.ReactNode }) => {
  const { firestore } = useFirebase();
  const { user, isUserLoading } = useUser();

  const warehousesQuery = useMemoFirebase(() => {
      if (isUserLoading || !user) return null;
      return query(collection(firestore, 'warehouses'));
  }, [firestore, user, isUserLoading]);

  const { data: warehouses, isLoading } = useCollection<Warehouse>(warehousesQuery);
  
  const addWarehouse = async (warehouseData: Omit<Warehouse, 'id'>) => {
    if (!firestore || !user) return;
    const warehousesCollection = collection(firestore, 'warehouses');
    try {
        const docRef = await addDoc(warehousesCollection, warehouseData);
        return docRef?.id;
    } catch(error) {
        console.error("Error adding warehouse: ", error);
        errorEmitter.emit('permission-error', new FirestorePermissionError({ path: warehousesCollection.path, operation: 'create', requestResourceData: warehouseData }));
        return undefined;
    }
  };

  const updateWarehouse = async (warehouseId: string, updatedWarehouseData: Partial<Omit<Warehouse, 'id'>>) => {
    if (!firestore || !user) return;
    const warehouseDoc = doc(firestore, 'warehouses', warehouseId);
    try {
        await updateDoc(warehouseDoc, updatedWarehouseData);
    } catch(error) {
        console.error("Error updating warehouse: ", error);
        errorEmitter.emit('permission-error', new FirestorePermissionError({ path: warehouseDoc.path, operation: 'update', requestResourceData: updatedWarehouseData }));
    }
  };

  const deleteWarehouse = async (warehouseId: string) => {
    if (!firestore || !user) return;
    const warehouseDoc = doc(firestore, 'warehouses', warehouseId);
    try {
        await deleteDoc(warehouseDoc);
    } catch(error) {
        console.error("Error deleting warehouse: ", error);
        errorEmitter.emit('permission-error', new FirestorePermissionError({ path: warehouseDoc.path, operation: 'delete' }));
    }
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
