
"use client"

import React, { createContext, useContext, useMemo } from 'react';
import type { Purchase } from '@/lib/types';
import { useFirebase, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { collection } from 'firebase/firestore';

interface PurchasesContextType {
  purchases: Purchase[];
  isLoading: boolean;
}

const PurchasesContext = createContext<PurchasesContextType | undefined>(undefined);

export const PurchasesProvider = ({ children }: { children: React.ReactNode }) => {
  const { firestore } = useFirebase();
  const { user, isUserLoading } = useUser();

  const purchasesQuery = useMemoFirebase(() => {
      if (!firestore || !user || isUserLoading) return null;
      return collection(firestore, 'purchases');
  }, [firestore, user, isUserLoading]);

  const { data: purchases, isLoading } = useCollection<Purchase>(purchasesQuery);

  const contextValue = {
    purchases: purchases || [],
    isLoading: isLoading || isUserLoading,
  };

  return (
    <PurchasesContext.Provider value={contextValue}>
      {children}
    </PurchasesContext.Provider>
  );
};

export const usePurchases = (): PurchasesContextType => {
  const context = useContext(PurchasesContext);
  if (context === undefined) {
    throw new Error('usePurchases must be used within a PurchasesProvider');
  }
  return context;
};
