
"use client"

import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { useToast } from "@/hooks/use-toast";
import type { CurrencyRate, Settings, UserProfile } from '@/lib/types';
import { useUser, useFirestore, useDoc, useCollection, setDocumentNonBlocking } from '@/firebase';
import { collection, doc, query, orderBy } from 'firebase/firestore';
import { Package } from 'lucide-react';

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

  const [activeStoreId, setActiveStoreId] = useState<string>(''); // INICIALIZAR VACÍO
  const [isLoading, setIsLoading] = useState(true);

  const userProfileRef = useMemo(() => {
    if (!user || !firestore) return null;
    return doc(firestore, 'users', user.uid);
  }, [user, firestore]);

  const { data: userProfile, isLoading: isLoadingProfile } = useDoc<UserProfile>(userProfileRef);

  useEffect(() => {
    if (isUserLoading || isLoadingProfile) {
        return; // Esperar a que el usuario y el perfil estén listos
    }

    // Lógica para determinar el storeId
    const storedStoreId = localStorage.getItem(ACTIVE_STORE_ID_KEY);
    
    if (userProfile?.role === 'superAdmin' && storedStoreId) {
        setActiveStoreId(storedStoreId);
    } else if (userProfile?.storeId) {
        setActiveStoreId(userProfile.storeId);
    } else {
        // Como último recurso, si no hay nada, usar 'tiendafacil'
        setActiveStoreId('tiendafacil');
    }
  }, [isUserLoading, isLoadingProfile, userProfile]);


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
    // A consolidated loading state
    const overallLoading = isLoadingSettingsDoc || isLoadingRates || isLoadingProfile || isUserLoading || !activeStoreId;
    setIsLoading(overallLoading);
  }, [isLoadingSettingsDoc, isLoadingRates, isLoadingProfile, isUserLoading, activeStoreId]);
  
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

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen w-full bg-background gap-4">
        <Package className="w-16 h-16 text-primary animate-pulse" />
        <p className="text-muted-foreground animate-pulse">Cargando configuración de la tienda...</p>
      </div>
    );
  }

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
