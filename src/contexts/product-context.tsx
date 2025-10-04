
"use client"

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import type { Product } from '@/lib/types';
import { useFirebase, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { collection, doc, addDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { setDocumentNonBlocking, addDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase';


interface ProductContextType {
  products: Product[];
  isLoading: boolean;
  addProduct: (product: Omit<Product, 'id'>) => Promise<string | void>;
  updateProduct: (productId: string, updatedProduct: Partial<Product>) => Promise<void>;
  deleteProduct: (productId: string) => Promise<void>;
  getProductById: (productId: string) => Product | undefined;
}

const ProductContext = createContext<ProductContextType | undefined>(undefined);

export const ProductProvider = ({ children }: { children: React.ReactNode }) => {
  const { firestore } = useFirebase();
  const { user, isUserLoading } = useUser();

  const productsQuery = useMemoFirebase(() => {
      if (!firestore || !user || isUserLoading) return null;
      return collection(firestore, 'products');
  }, [firestore, user, isUserLoading]);

  const { data: products, isLoading } = useCollection<Product>(productsQuery);

  const addProduct = async (productData: Omit<Product, 'id'>) => {
    if (!firestore) {
      console.error("Firestore is not initialized");
      return;
    }
    const productsCollection = collection(firestore, 'products');
    const docRef = await addDocumentNonBlocking(productsCollection, productData);
    return docRef?.id;
  };

  const updateProduct = async (productId: string, updatedProductData: Partial<Product>) => {
    if (!firestore) {
      console.error("Firestore is not initialized");
      return;
    }
    const productDoc = doc(firestore, 'products', productId);
    await updateDocumentNonBlocking(productDoc, updatedProductData);
  };

  const deleteProduct = async (productId: string) => {
     if (!firestore) {
      console.error("Firestore is not initialized");
      return;
    }
    const productDoc = doc(firestore, 'products', productId);
    await deleteDocumentNonBlocking(productDoc);
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

