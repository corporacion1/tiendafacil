
"use client"

import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Product } from '@/lib/types';
import { mockProducts as initialProducts } from '@/lib/data';

interface ProductContextType {
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  addProduct: (product: Product) => void;
  updateProduct: (productId: string, updatedProduct: Partial<Product>) => void;
  getProductById: (productId: string) => Product | undefined;
}

const ProductContext = createContext<ProductContextType | undefined>(undefined);

export const ProductProvider = ({ children }: { children: React.ReactNode }) => {
  const [products, setProducts] = useState<Product[]>(initialProducts);

  const addProduct = (product: Product) => {
    setProducts(prev => [product, ...prev]);
  };

  const updateProduct = (productId: string, updatedProductData: Partial<Product>) => {
    setProducts(prev => 
      prev.map(p => 
        p.id === productId ? { ...p, ...updatedProductData } : p
      )
    );
  };
  
  const getProductById = (productId: string) => {
    return products.find(p => p.id === productId);
  };


  return (
    <ProductContext.Provider value={{ products, setProducts, addProduct, updateProduct, getProductById }}>
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
