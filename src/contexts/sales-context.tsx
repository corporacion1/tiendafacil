
"use client"

import React, { createContext, useContext, useMemo } from 'react';
import type { Sale } from '@/lib/types';
import { useFirebase, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { collection, doc, addDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { addDocumentNonBlocking } from '@/firebase';


interface SalesContextType {
  sales: Sale[];
  isLoading: boolean;
  addSale: (sale: Omit<Sale, 'id'>) => Promise<string | void>;
}

const SalesContext = createContext<SalesContextType | undefined>(undefined);

export const SalesProvider = ({ children }: { children: React.ReactNode }) => {
  const { firestore } = useFirebase();
  const { user, isUserLoading } = useUser();
  const storeId = "test-store"; // Placeholder

  const salesQuery = useMemoFirebase(() => {
      if (!firestore || !user || isUserLoading || !storeId) return null;
      return collection(firestore, 'stores', storeId, 'sales');
  }, [firestore, user, isUserLoading, storeId]);

  const { data: sales, isLoading } = useCollection<Sale>(salesQuery);

  const addSale = async (saleData: Omit<Sale, 'id'>) => {
    if (!firestore || !storeId) {
      console.error("Firestore or storeId not available");
      return;
    }
    const salesCollection = collection(firestore, 'stores', storeId, 'sales');
    const docRef = await addDocumentNonBlocking(salesCollection, saleData);
    return docRef?.id;
  };


  const contextValue = {
    sales: sales || [],
    isLoading: isLoading || isUserLoading,
    addSale,
  };

  return (
    <SalesContext.Provider value={contextValue}>
      {children}
    </SalesContext.Provider>
  );
};

export const useSales = (): SalesContextType => {
  const context = useContext(SalesContext);
  if (context === undefined) {
    throw new Error('useSales must be used within a SalesProvider');
  }
  return context;
};
