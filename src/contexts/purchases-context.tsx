
"use client"

import React, { createContext, useContext, useMemo } from 'react';
import type { Purchase } from '@/lib/types';
import { useFirebase, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, addDoc, where } from 'firebase/firestore';
import { useProducts } from './product-context';
import { mockInventoryMovements } from '@/lib/data';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

interface PurchasesContextType {
  purchases: Purchase[];
  isLoading: boolean;
  addPurchase: (purchase: Omit<Purchase, 'id'| 'storeId'>) => Promise<string | undefined>;
}

const PurchasesContext = createContext<PurchasesContextType | undefined>(undefined);

export const PurchasesProvider = ({ children }: { children: React.ReactNode }) => {
  const { firestore } = useFirebase();
  const { user, isUserLoading } = useUser();
  const { products, updateProduct } = useProducts();
  const storeId = "test-store";

  const purchasesQuery = useMemoFirebase(() => {
      if (isUserLoading || !user) return null;
      return query(collection(firestore, 'purchases'), where('storeId', '==', storeId));
  }, [firestore, user, isUserLoading, storeId]);

  const { data: purchases, isLoading } = useCollection<Purchase>(purchasesQuery);

  const addPurchase = async (purchaseData: Omit<Purchase, 'id' | 'storeId'>) => {
    if (!firestore || !user) {
      console.error("Firestore or user not available");
      return;
    }
    const purchasesCollection = collection(firestore, 'purchases');
    
    let docRefId: string | undefined;
    try {
        const docRef = await addDoc(purchasesCollection, { ...purchaseData, storeId });
        docRefId = docRef.id;
    } catch (error) {
        console.error("Error adding purchase: ", error);
        errorEmitter.emit('permission-error', new FirestorePermissionError({ path: purchasesCollection.path, operation: 'create', requestResourceData: { ...purchaseData, storeId } }));
        return undefined;
    }

    for (const item of purchaseData.items) {
        const product = products.find(p => p.id === item.productId);
        if (product) {
            const updatedStock = product.stock + item.quantity;
            await updateProduct(product.id, { ...product, stock: updatedStock, cost: item.cost });
        }
    }
    
    return docRefId;
  };

  const contextValue = {
    purchases: purchases || [],
    isLoading: isLoading || isUserLoading,
    addPurchase,
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
