
"use client"

import React, { createContext, useContext, useCallback, useMemo } from 'react';
import type { Product } from '@/lib/types';
import { useFirebase, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { collection, doc, query, addDoc, updateDoc, deleteDoc, where } from 'firebase/firestore';


interface ProductContextType {
  products: Product[];
  isLoading: boolean;
  addProduct: (product: Omit<Product, 'id'>) => Promise<string | undefined>;
  updateProduct: (productId: string, updatedProduct: Partial<Omit<Product, 'id'>>) => Promise<void>;
  deleteProduct: (productId: string) => Promise<void>;
  getProductById: (productId: string) => Product | undefined;
}

const ProductContext = createContext<ProductContextType | undefined>(undefined);

export const ProductProvider = ({ children }: { children: React.ReactNode }) => {
  const { firestore } = useFirebase();
  const { user, isUserLoading } = useUser();
  const storeId = "test-store";

  const productsQuery = useMemoFirebase(() => {
      if (isUserLoading || !user) return null;
      return query(collection(firestore, 'products'), where('storeId', '==', storeId));
  }, [firestore, user, isUserLoading, storeId]);

  const { data: products, isLoading } = useCollection<Product>(productsQuery);

  const addProduct = async (productData: Omit<Product, 'id'>) => {
    if (!firestore || !user) {
      console.error("Firestore or user not available");
      return;
    }
    const productsCollection = collection(firestore, 'products');
    const docRef = await addDoc(productsCollection, { ...productData, storeId });
    return docRef?.id;
  };

  const updateProduct = async (productId: string, updatedProductData: Partial<Omit<Product, 'id'>>) => {
    if (!firestore || !user) {
      console.error("Firestore or user not available");
      return;
    }
    const productDoc = doc(firestore, 'products', productId);
    await updateDoc(productDoc, updatedProductData);
  };

  const deleteProduct = async (productId: string) => {
     if (!firestore || !user) {
      console.error("Firestore or user not available");
      return;
    }
    const productDoc = doc(firestore, 'products', productId);
    await deleteDoc(productDoc);
  }

  const getProductById = useCallback((productId: string) => {
    return (products || []).find(p => p.id === productId);
  }, [products]);


  const contextValue = {
    products: products || [],
    isLoading: isLoading || isUserLoading,
    addProduct,
    updateProduct,
    deleteProduct,
    getProductById,
  };

  return (
    <ProductContext.Provider value={contextValue}>
      {children}
    </ProductContext.Provider>
  );
};

export const useProducts = (): ProductContextType => {
  const context = useContext(ProductContext);
  if (context === undefined) {
    throw new Error('useProducts must be used within a ProductProvider');
  }
  return context;
};
