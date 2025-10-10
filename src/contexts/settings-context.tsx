
"use client"

import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { useToast } from "@/hooks/use-toast";
import type { CurrencyRate, Settings, UserProfile } from '@/lib/types';
import { useUser, useFirestore, useDoc, useCollection, setDocumentNonBlocking } from '@/firebase';
import { collection, doc, query, orderBy } from 'firebase/firestore';
import { defaultStoreId } from '@/lib/data';
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
  const pathname = usePathname();

  const isPublicPage = useMemo(() => pathname === '/' || pathname.startsWith('/catalog') || pathname.startsWith('/login'), [pathname]);

  const [activeStoreId, setActiveStoreId] = useState<string>('');
  
  const userProfileRef = useMemo(() => {
    if (isUserLoading || !user || !firestore) return null;
    return doc(firestore, 'users', user.uid);
  }, [user, isUserLoading, firestore]);

  const { data: userProfile, isLoading: isLoadingProfile } = useDoc<UserProfile>(userProfileRef);

  useEffect(() => {
    if (isUserLoading) return;

    let resolvedId = '';
    if (isPublicPage) {
        resolvedId = defaultStoreId;
    } else if (user && userProfile) {
        if (userProfile.role === 'superAdmin') {
            resolvedId = localStorage.getItem(ACTIVE_STORE_ID_KEY) || defaultStoreId;
        } else if (userProfile.storeId) {
            resolvedId = userProfile.storeId;
        }
    }
    
    if (resolvedId && resolvedId !== activeStoreId) {
        setActiveStoreId(resolvedId);
        if (!isPublicPage && typeof window !== 'undefined') {
            localStorage.setItem(ACTIVE_STORE_ID_KEY, resolvedId);
        }
    }
  }, [isUserLoading, user, userProfile, isPublicPage, pathname, activeStoreId]);

  const settingsDocRef = useMemo(() => {
    if (isUserLoading || !activeStoreId || !firestore) return null;
    return doc(firestore, 'stores', activeStoreId);
  }, [activeStoreId, firestore, isUserLoading]);

  const { data: settings, isLoading: isLoadingSettingsDoc } = useDoc<Settings>(settingsDocRef);
  
  const currencyRatesQuery = useMemo(() => {
    if (isUserLoading || !activeStoreId || !firestore) return null;
    return query(collection(firestore, 'stores', activeStoreId, 'currencyRates'), orderBy('date', 'desc'));
  }, [isUserLoading, activeStoreId, firestore]);

  const { data: currencyRatesData = [], isLoading: isLoadingRates } = useCollection<CurrencyRate>(currencyRatesQuery);

  const [displayCurrency, setDisplayCurrency] = useState<DisplayCurrency>('primary');
  
  useEffect(() => {
    const storedCurrencyPref = localStorage.getItem(CURRENCY_PREF_STORAGE_KEY) as DisplayCurrency;
    if(storedCurrencyPref) setDisplayCurrency(storedCurrencyPref);
  }, []);
  
  // Master loading gate. Ensures all initial data is loaded before rendering the app.
  const isLoading = useMemo(() => {
    if (isPublicPage) {
      // For public pages, we only need a storeId and the settings for that store.
      // We don't wait for user authentication.
      return !activeStoreId || isLoadingSettingsDoc;
    }
    // For protected pages, we wait for everything.
    return isUserLoading || isLoadingProfile || !activeStoreId || isLoadingSettingsDoc || isLoadingRates;
  }, [isUserLoading, isLoadingProfile, activeStoreId, isLoadingSettingsDoc, isLoadingRates, isPublicPage]);


  const handleSetSettings = (newSettings: Settings) => {
    if (!settingsDocRef || !firestore) return;
    const { id, ...settingsToSave } = newSettings;
    setDocumentNonBlocking(settingsDocRef, settingsToSave, { merge: true });
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
    localStorage.setItem(CURRENCY_PREF_STORAGE_KEY, newPreference);
  };

  const activeCurrency = displayCurrency;
  const activeSymbol = activeCurrency === 'primary' ? settings?.primaryCurrencySymbol || '$' : settings?.secondaryCurrencySymbol || 'Bs.';
  
  const latestRate = currencyRatesData?.[0]?.rate;
  const activeRate = activeCurrency === 'primary' ? 1 : (latestRate && latestRate > 0 ? latestRate : 1);

  const contextValue: SettingsContextType = {
    settings, 
    setSettings: handleSetSettings, 
    displayCurrency, 
    toggleDisplayCurrency, 
    activeCurrency, 
    activeSymbol, 
    activeRate, 
    currencyRates: currencyRatesData, 
    activeStoreId,
    switchStore,
    isLoadingSettings: isLoading,
    userProfile: userProfile || null,
  };

  // If loading, show a full-page loading screen to prevent any child components
  // from rendering and making premature data requests.
  if (isLoading) {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen w-full bg-background gap-4">
            <div className="p-4 bg-muted rounded-full">
                <Package className="w-12 h-12 text-muted-foreground animate-pulse" />
            </div>
            <p className="text-muted-foreground animate-pulse">Iniciando aplicación y cargando datos...</p>
        </div>
    );
  }

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
