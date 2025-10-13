
"use client"

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useToast } from "@/hooks/use-toast";
import type { CurrencyRate, Settings, UserProfile } from "@/lib/types";
import { defaultStore, defaultStoreId, mockCurrencyRates } from '@/lib/data';
import { useDoc, useCollection, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import { doc, collection, query, where, setDoc } from 'firebase/firestore';

type DisplayCurrency = 'primary' | 'secondary';

interface SettingsContextType {
  settings: Settings | null;
  setSettings: (settings: Partial<Settings>) => void;
  displayCurrency: DisplayCurrency;
  toggleDisplayCurrency: () => void;
  activeCurrency: 'primary' | 'secondary';
  activeSymbol: string;
  activeRate: number;
  currencyRates: CurrencyRate[];
  activeStoreId: string;
  switchStore: (storeId: string) => void;
  isLoadingSettings: boolean;
  userProfile: UserProfile | null;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

const CURRENCY_PREF_STORAGE_KEY = 'tienda_facil_currency_pref';
const ACTIVE_STORE_ID_STORAGE_KEY = 'tienda_facil_active_store_id';

function AppLoadingScreen() {
    return (
        <div className="flex min-h-screen w-full items-center justify-center bg-background">
            <div className="flex flex-col items-center gap-4">
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-muted border-t-primary" />
                <p className="text-muted-foreground">Cargando aplicación...</p>
            </div>
        </div>
    );
}

export const SettingsProvider = ({ children }: { children: React.ReactNode }) => {
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user: userProfile, isUserLoading, needsProfileCreation } = useUser();
  const router = useRouter();
  const pathname = usePathname();

  const [activeStoreId, setActiveStoreId] = useState<string>(defaultStoreId);
  const [displayCurrency, setDisplayCurrency] = useState<DisplayCurrency>('primary');
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    try {
      const storedPref = localStorage.getItem(CURRENCY_PREF_STORAGE_KEY);
      if (storedPref === 'secondary') setDisplayCurrency('secondary');

      const storedStoreId = localStorage.getItem(ACTIVE_STORE_ID_STORAGE_KEY);
      if (storedStoreId) {
        setActiveStoreId(storedStoreId);
      } else if (userProfile?.storeId) {
        setActiveStoreId(userProfile.storeId);
      }
    } catch (error) {
      console.error("Could not access localStorage", error);
    }
  }, [userProfile?.storeId]);
  
  useEffect(() => {
    if (!isUserLoading && !userProfile && !pathname.startsWith('/catalog') && !pathname.startsWith('/login')) {
        router.push('/login');
    }
  }, [isUserLoading, userProfile, router, pathname]);

  const storeQuery = useMemoFirebase(() => firestore && activeStoreId ? doc(firestore, 'stores', activeStoreId) : null, [firestore, activeStoreId]);
  const { data: settings, isLoading: isLoadingStoreSettings } = useDoc<Settings>(storeQuery);

  const ratesQuery = useMemoFirebase(() => firestore && activeStoreId ? query(collection(firestore, 'stores', activeStoreId, 'currencyRates'), where('rate', '>', 0)) : null, [firestore, activeStoreId]);
  const { data: ratesFromDb, isLoading: isLoadingRates } = useCollection<CurrencyRate>(ratesQuery);

  const currencyRates = ratesFromDb ?? (activeStoreId === defaultStoreId ? mockCurrencyRates : []);


  const handleSetSettings = useCallback(async (newSettings: Partial<Settings>) => {
    if (!firestore || !activeStoreId) return;
    const storeDocRef = doc(firestore, 'stores', activeStoreId);
    try {
      await setDoc(storeDocRef, newSettings, { merge: true });
      toast({ title: "Configuración Guardada", description: "Tus cambios han sido guardados en la base de datos." });
    } catch (error: any) {
      toast({ variant: 'destructive', title: "Error al guardar", description: error.message });
    }
  }, [firestore, activeStoreId, toast]);

  const switchStore = (storeId: string) => {
    setActiveStoreId(storeId);
    try {
      localStorage.setItem(ACTIVE_STORE_ID_STORAGE_KEY, storeId);
    } catch (error) {
       console.error("Could not access localStorage", error);
    }
    toast({ title: `Cambiado a la tienda ${storeId}` });
    window.location.reload();
  };

  const toggleDisplayCurrency = () => {
    const newPreference = displayCurrency === 'primary' ? 'secondary' : 'primary';
    setDisplayCurrency(newPreference);
    try {
      localStorage.setItem(CURRENCY_PREF_STORAGE_KEY, newPreference);
    } catch(error) {
      console.error("Could not access localStorage", error);
    }
  };

  const finalSettings = settings ?? (activeStoreId === defaultStoreId ? defaultStore : null);
  const activeSymbol = displayCurrency === 'primary' ? (finalSettings?.primaryCurrencySymbol || '$') : (finalSettings?.secondaryCurrencySymbol || 'Bs.');
  
  const latestRate = (currencyRates || []).length > 0 ? (currencyRates || [])[0].rate : 1;
  const activeRate = displayCurrency === 'primary' ? 1 : (latestRate > 0 ? latestRate : 1);
  
  const isLoading = isUserLoading || isLoadingStoreSettings || isLoadingRates;
  const isPublicPath = pathname.startsWith('/catalog') || pathname === '/' || pathname.startsWith('/login');
  
  if (isLoading && !isPublicPath && isClient && !needsProfileCreation) {
      return <AppLoadingScreen />;
  }

  const contextValue: SettingsContextType = {
    settings: finalSettings,
    setSettings: handleSetSettings,
    displayCurrency,
    toggleDisplayCurrency,
    activeCurrency: displayCurrency,
    activeSymbol,
    activeRate,
    currencyRates: currencyRates || [],
    activeStoreId,
    switchStore,
    isLoadingSettings: isLoading,
    userProfile,
  };

  return (
    <SettingsContext.Provider value={contextValue}>
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
