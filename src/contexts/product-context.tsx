
"use client"

import React, { createContext, useContext, useCallback } from 'react';
import type { Product } from '@/lib/types';
import { useFirebase, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import { addDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase';


interface ProductContextType {
  products: Product[];
  isLoading: boolean;
  addProduct: (product: Omit<Product, 'id'>) => Promise<string | void>;
  updateProduct: (productId: string, updatedProduct: Partial<Omit<Product, 'id'>>) => Promise<void>;
  deleteProduct: (productId: string) => Promise<void>;
  getProductById: (productId: string) => Product | undefined;
}

const ProductContext = createContext<ProductContextType | undefined>(undefined);

export const ProductProvider = ({ children }: { children: React.ReactNode }) => {
  const { firestore } = useFirebase();
  const { user, isUserLoading } = useUser();
  const storeId = "test-store"; // Placeholder

  const productsQuery = useMemoFirebase(() => {
      if (!firestore || !user || isUserLoading || !storeId) return null;
      return collection(firestore, 'stores', storeId, 'products');
  }, [firestore, user, isUserLoading, storeId]);

  const { data: products, isLoading } = useCollection<Product>(productsQuery);

  const addProduct = async (productData: Omit<Product, 'id'>) => {
    if (!firestore || !storeId) {
      console.error("Firestore or storeId not available");
      return;
    }
    const productsCollection = collection(firestore, 'stores', storeId, 'products');
    const docRef = await addDocumentNonBlocking(productsCollection, productData);
    return docRef?.id;
  };

  const updateProduct = async (productId: string, updatedProductData: Partial<Omit<Product, 'id'>>) => {
    if (!firestore || !storeId) {
      console.error("Firestore or storeId not available");
      return;
    }
    const productDoc = doc(firestore, 'stores', storeId, 'products', productId);
    await updateDocumentNonBlocking(productDoc, updatedProductData);
  };

  const deleteProduct = async (productId: string) => {
     if (!firestore || !storeId) {
      console.error("Firestore or storeId not available");
      return;
    }
    const productDoc = doc(firestore, 'stores', storeId, 'products', productId);
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
