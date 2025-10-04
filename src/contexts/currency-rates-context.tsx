
"use client"

import React, { createContext, useContext, useMemo } from 'react';
import type { CurrencyRate } from '@/lib/types';
import { useFirebase, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { collection, addDoc, query, orderBy, limit, Timestamp, where } from 'firebase/firestore';
import { addDocumentNonBlocking } from '@/firebase';

interface CurrencyRatesContextType {
  currencyRates: CurrencyRate[];
  isLoading: boolean;
  addRate: (rate: Omit<CurrencyRate, 'id' | 'storeId'>) => Promise<string | void>;
}

const CurrencyRatesContext = createContext<CurrencyRatesContextType | undefined>(undefined);

export const CurrencyRatesProvider = ({ children }: { children: React.ReactNode }) => {
  const { firestore } = useFirebase();
  const { user, isUserLoading } = useUser();
  const storeId = "test-store"; // Placeholder

  const ratesQuery = useMemoFirebase(() => {
    if (!firestore || !user || isUserLoading || !storeId) return null;
    return query(collection(firestore, 'currency_rates'), where("storeId", "==", storeId), orderBy('date', 'desc'), limit(50));
  }, [firestore, user, isUserLoading, storeId]);

  const { data: currencyRates, isLoading } = useCollection<CurrencyRate>(ratesQuery);

  const addRate = async (rateData: Omit<CurrencyRate, 'id' | 'storeId'>) => {
    if (!firestore || !storeId) return;
    const ratesCollection = collection(firestore, 'currency_rates');
    const docRef = await addDocumentNonBlocking(ratesCollection, { ...rateData, storeId });
    return docRef?.id;
  };

  const contextValue = {
    currencyRates: currencyRates || [],
    isLoading: isLoading || isUserLoading,
    addRate,
  };

  return (
    <CurrencyRatesContext.Provider value={contextValue}>
      {children}
    </CurrencyRatesContext.Provider>
  );
};

export const useCurrencyRates = (): CurrencyRatesContextType => {
  const context = useContext(CurrencyRatesContext);
  if (context === undefined) {
    throw new Error('useCurrencyRates must be used within a CurrencyRatesProvider');
  }
  return context;
};
