
"use client"

import React, { createContext, useContext, useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useToast } from "@/hooks/use-toast";
import type { CurrencyRate, Settings } from '@/lib/types';
import { useUser, useFirestore, useDoc, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc, query, orderBy } from 'firebase/firestore';

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
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

const SETTINGS_STORAGE_KEY_PREFIX = 'tienda_facil_settings_';
const CURRENCY_PREF_STORAGE_KEY = 'tienda_facil_currency_pref';
const ACTIVE_STORE_ID_KEY = 'tienda_facil_active_store_id';


export const SettingsProvider = ({ children }: { children: React.ReactNode }) => {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const pathname = usePathname();

  const [settings, setSettings] = useState<Settings | null>(null);
  const [activeStoreId, setActiveStoreId] = useState<string>('tiendafacil'); // Default demo store
  const [displayCurrency, setDisplayCurrency] = useState<DisplayCurrency>('primary');
  
  const { toast } = useToast();
  
  // Conditionally disable hooks on login page
  const isLoginPage = pathname === '/login';

  const settingsDocRef = useMemoFirebase(() => {
    if (isLoginPage || !firestore || !activeStoreId || !user) return null;
    return doc(firestore, 'stores', activeStoreId);
  }, [firestore, activeStoreId, user, isLoginPage]);

  const { data: remoteSettings, isLoading: isLoadingSettings } = useDoc<Settings>(settingsDocRef);
  
  const currencyRatesQuery = useMemoFirebase(() => {
    if (isLoginPage || !firestore || !activeStoreId || !user) return null;
    return query(collection(firestore, `stores/${activeStoreId}/currencyRates`), orderBy('date', 'desc'));
  }, [firestore, activeStoreId, user, isLoginPage]);

  const { data: currencyRates = [], isLoading: isLoadingRates } = useCollection<CurrencyRate>(currencyRatesQuery);

  useEffect(() => {
      // Load active store from local storage on startup
      const storedStoreId = localStorage.getItem(ACTIVE_STORE_ID_KEY);
      if (user?.role === 'admin' && user.storeId) {
          setActiveStoreId(user.storeId);
      } else if (storedStoreId) {
          setActiveStoreId(storedStoreId);
      }
  }, [user]);

  useEffect(() => {
    if (remoteSettings) {
      setSettings(remoteSettings);
    }
  }, [remoteSettings]);


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
  
  // CRITICAL: Do not render children if the core dependencies are not ready on protected pages.
  if (!isLoginPage && (isUserLoading || isLoadingSettings)) {
    return null; // Or a full-page loader
  }

  const handleSetSettings = (newSettings: Settings) => {
    setSettings(newSettings);
  };

  const switchStore = (storeId: string) => {
      if (user?.role === 'superAdmin') {
          setActiveStoreId(storeId);
          localStorage.setItem(ACTIVE_STORE_ID_KEY, storeId);
          toast({ title: `Cambiado a la tienda ${storeId}` });
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
  
  const latestRate = currencyRates?.[0]?.rate;
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
        currencyRates: currencyRates || [], 
        setCurrencyRates: () => {},
        activeStoreId,
        switchStore,
        isLoadingSettings: isLoadingSettings || isLoadingRates,
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
