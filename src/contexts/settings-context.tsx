
"use client"

import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { useToast } from "@/hooks/use-toast";
import type { CurrencyRate, Settings, UserProfile } from '@/lib/types';
import { useUser, useFirestore, useDoc, useCollection, setDocumentNonBlocking } from '@/firebase';
import { collection, doc, query, orderBy } from 'firebase/firestore';
import { defaultStoreId } from '@/lib/data';

type DisplayCurrency = 'primary' | 'secondary';

interface SettingsContextType {
  settings: Settings | null;
  setSettings: (settings: Settings) => void;
  displayCurrency: DisplayCurrency;
  toggleDisplayCurrency: () => void;
  activeCurrency: 'primary' | 'secondary';
  activeSymbol: string;
  activeRate: number;
  currencyRates: CurrencyRate[];
  setCurrencyRates: React.Dispatch<React.SetStateAction<CurrencyRate[]>>;
  activeStoreId: string;
  switchStore: (storeId: string) => void;
  isLoadingSettings: boolean;
  userProfile: UserProfile | null;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

const ACTIVE_STORE_ID_KEY = 'tienda_facil_active_store_id';
const CURRENCY_PREF_STORAGE_KEY = 'tienda_facil_currency_pref';

export const SettingsProvider = ({ children }: { children: React.ReactNode }) => {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  // Initialize activeStoreId synchronously
  const getInitialStoreId = () => {
      if (typeof window !== 'undefined') {
          return localStorage.getItem(ACTIVE_STORE_ID_KEY) || defaultStoreId;
      }
      return defaultStoreId;
  };
  
  const [activeStoreId, setActiveStoreId] = useState<string>(getInitialStoreId);
  const [isLoading, setIsLoading] = useState(true);

  const userProfileRef = useMemo(() => {
    if (!user || !firestore) return null;
    return doc(firestore, 'users', user.uid);
  }, [user, firestore]);

  const { data: userProfile, isLoading: isLoadingProfile } = useDoc<UserProfile>(userProfileRef);

  // This effect synchronizes the storeId based on user profile changes
  useEffect(() => {
    if (isUserLoading || isLoadingProfile) {
        return;
    }

    const storedStoreId = localStorage.getItem(ACTIVE_STORE_ID_KEY);
    
    // If the user is a superAdmin and has a stored storeId, respect it.
    if (userProfile?.role === 'superAdmin' && storedStoreId) {
        if (activeStoreId !== storedStoreId) {
            setActiveStoreId(storedStoreId);
        }
    // If the user has a specific storeId in their profile (e.g., an admin)
    } else if (userProfile?.storeId) {
        if (activeStoreId !== userProfile.storeId) {
            setActiveStoreId(userProfile.storeId);
            localStorage.setItem(ACTIVE_STORE_ID_KEY, userProfile.storeId);
        }
    // Fallback for logged-in users without a specific store, or logged-out users
    } else {
        if (activeStoreId !== defaultStoreId) {
            setActiveStoreId(defaultStoreId);
            localStorage.setItem(ACTIVE_STORE_ID_KEY, defaultStoreId);
        }
    }
  }, [isUserLoading, isLoadingProfile, userProfile, activeStoreId]);

  const canFetchStoreData = !!firestore && !!activeStoreId;

  const settingsDocRef = useMemo(() => {
    if (!canFetchStoreData) return null;
    return doc(firestore, 'stores', activeStoreId);
  }, [firestore, activeStoreId, canFetchStoreData]);

  const { data: settings, isLoading: isLoadingSettingsDoc } = useDoc<Settings>(settingsDocRef);
  
  const currencyRatesQuery = useMemo(() => {
    if (!canFetchStoreData) return null;
    return query(collection(firestore, `stores/${activeStoreId}/currencyRates`), orderBy('date', 'desc'));
  }, [firestore, canFetchStoreData, activeStoreId]);

  const { data: currencyRatesData = [], isLoading: isLoadingRates } = useCollection<CurrencyRate>(currencyRatesQuery);

  const [displayCurrency, setDisplayCurrency] = useState<DisplayCurrency>('primary');
  
  useEffect(() => {
    try {
      const storedCurrencyPref = localStorage.getItem(CURRENCY_PREF_STORAGE_KEY) as DisplayCurrency;
      if(storedCurrencyPref && ['primary', 'secondary'].includes(storedCurrencyPref)) {
        setDisplayCurrency(storedCurrencyPref);
      }
    } catch (error) {
      console.error("Could not access localStorage for currency preference", error);
    }
  }, []);
  
  useEffect(() => {
    const overallLoading = isLoadingSettingsDoc || isLoadingRates || isLoadingProfile || isUserLoading;
    setIsLoading(overallLoading);
  }, [isLoadingSettingsDoc, isLoadingRates, isLoadingProfile, isUserLoading]);
  
  const handleSetSettings = (newSettings: Settings) => {
    if (!settingsDocRef) {
        toast({
            variant: "destructive",
            title: "Error",
            description: "No se puede guardar la configuración porque la referencia de la tienda no está disponible."
        });
        return;
    }
    setDocumentNonBlocking(settingsDocRef, newSettings, { merge: true });
  };

  const switchStore = (storeId: string) => {
      if (userProfile?.role === 'superAdmin') {
          setActiveStoreId(storeId);
          localStorage.setItem(ACTIVE_STORE_ID_KEY, storeId);
          toast({ title: `Cambiado a la tienda ${storeId}` });
          window.location.reload(); 
      } else {
          toast({ variant: 'destructive', title: "No autorizado" });
      }
  };

  const toggleDisplayCurrency = () => {
    const newPreference = displayCurrency === 'primary' ? 'secondary' : 'primary';
    setDisplayCurrency(newPreference);
     try {
        localStorage.setItem(CURRENCY_PREF_STORAGE_KEY, newPreference);
    } catch (error) {
        console.error("Could not save currency preference to localStorage", error);
    }
  };

  const activeCurrency = displayCurrency;
  const activeSymbol = activeCurrency === 'primary' ? settings?.primaryCurrencySymbol || '$' : settings?.secondaryCurrencySymbol || 'Bs.';
  
  const latestRate = currencyRatesData?.[0]?.rate;
  const activeRate = activeCurrency === 'primary' ? 1 : (latestRate && latestRate > 0 ? latestRate : 1);

  return (
    <SettingsContext.Provider value={{ 
        settings, 
        setSettings: handleSetSettings, 
        displayCurrency, 
        toggleDisplayCurrency, 
        activeCurrency, 
        activeSymbol, 
        activeRate, 
        currencyRates: currencyRatesData, 
        setCurrencyRates: () => {}, 
        activeStoreId,
        switchStore,
        isLoadingSettings: isLoading,
        userProfile: userProfile || null,
    }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = (): SettingsContextType => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
