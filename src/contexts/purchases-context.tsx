
"use client"

import React, { createContext, useContext, useMemo } from 'react';
import type { Purchase } from '@/lib/types';
import { useFirebase, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, addDoc, where } from 'firebase/firestore';
import { useProducts } from './product-context';
import { mockInventoryMovements } from '@/lib/data';

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
      if (!firestore || isUserLoading || !user) return null;
      return query(collection(firestore, 'purchases'), where('storeId', '==', storeId));
  }, [firestore, user, isUserLoading, storeId]);

  const { data: purchases, isLoading } = useCollection<Purchase>(purchasesQuery);

  const addPurchase = async (purchaseData: Omit<Purchase, 'id' | 'storeId'>) => {
    if (!firestore || !user) {
      console.error("Firestore or user not available");
      return;
    }
    const purchasesCollection = collection(firestore, 'purchases');
    const docRef = await addDoc(purchasesCollection, { ...purchaseData, storeId });

    // Update stock and create inventory movements
    for (const item of purchaseData.items) {
        const product = products.find(p => p.id === item.productId);
        if (product) {
            // Pass the entire product object to keep data integrity
            await updateProduct(product.id, { 
                ...product, 
                stock: product.stock + item.quantity, 
                cost: item.cost 
            });
            const movement = {
                id: `mov-purch-${Date.now()}-${item.productId}`,
                productName: item.productName,
                type: 'purchase' as 'purchase',
                quantity: item.quantity,
                date: purchaseData.date,
            };
            mockInventoryMovements.unshift(movement);
        }
    }
    return docRef?.id;
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
