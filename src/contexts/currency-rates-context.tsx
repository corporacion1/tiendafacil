
"use client"

import React, { createContext, useContext, useMemo } from 'react';
import type { CurrencyRate } from '@/lib/types';
import { useFirebase, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { collection, addDoc, query, orderBy, limit, Timestamp } from 'firebase/firestore';

interface CurrencyRatesContextType {
  currencyRates: CurrencyRate[];
  isLoading: boolean;
  addRate: (rate: Omit<CurrencyRate, 'id' | 'date'> & { date?: Timestamp }) => Promise<string | undefined>;
}

const CurrencyRatesContext = createContext<CurrencyRatesContextType | undefined>(undefined);

export const CurrencyRatesProvider = ({ children }: { children: React.ReactNode }) => {
  const { firestore } = useFirebase();
  const { user, isUserLoading } = useUser();

  const ratesQuery = useMemoFirebase(() => {
    if (!firestore || !user || isUserLoading) return null;
    return query(collection(firestore, 'currency_rates'), orderBy('date', 'desc'), limit(50));
  }, [firestore, user, isUserLoading]);

  const { data: currencyRates, isLoading } = useCollection<CurrencyRate>(ratesQuery);

  const addRate = async (rateData: Omit<CurrencyRate, 'id' | 'date'> & { date?: Timestamp }) => {
    if (!firestore || !user) return;
    const ratesCollection = collection(firestore, 'currency_rates');
    const docRef = await addDoc(ratesCollection, {
        ...rateData,
        date: rateData.date || Timestamp.now(),
    });
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
