
"use client"

import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { useToast } from "@/hooks/use-toast";
import type { CurrencyRate, Settings, UserProfile } from '@/lib/types';
import { useUser, useFirestore, useDoc, useCollection, setDocumentNonBlocking } from '@/firebase';
import { collection, doc, query, orderBy } from 'firebase/firestore';
import { defaultStoreId, defaultStore } from '@/lib/data';

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

const fallbackSettings: Settings = {
  ...defaultStore,
  name: "Tienda Facil",
  primaryCurrencySymbol: "$",
  secondaryCurrencySymbol: "Bs.",
  tax1: 16,
  tax2: 0,
}

export const SettingsProvider = ({ children }: { children: React.ReactNode }) => {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const pathname = usePathname();

  const isPublicPage = useMemo(() => pathname === '/' || pathname.startsWith('/catalog') || pathname.startsWith('/login'), [pathname]);
  const [activeStoreId, setActiveStoreId] = useState<string>(defaultStoreId);
  const [isStoreIdResolved, setIsStoreIdResolved] = useState(false);

  // Step 1: Determine the active store ID based on user profile.
  // This must complete before any data fetching hooks are activated.
  const userProfileRef = useMemo(() => {
    if (isUserLoading || !user || !firestore || isPublicPage) return null;
    return doc(firestore, 'users', user.uid);
  }, [user, isUserLoading, firestore, isPublicPage]);
  const { data: userProfile, isLoading: isLoadingProfile } = useDoc<UserProfile>(userProfileRef);

  useEffect(() => {
    if (isUserLoading || isLoadingProfile || isPublicPage) return;

    let resolvedId = defaultStoreId;
    if (userProfile) {
        if (userProfile.role === 'superAdmin') {
            resolvedId = localStorage.getItem(ACTIVE_STORE_ID_KEY) || defaultStoreId;
        } else if (userProfile.storeId) {
            resolvedId = userProfile.storeId;
        }
    }
    
    setActiveStoreId(resolvedId);
    if(userProfile?.role === 'superAdmin') {
        localStorage.setItem(ACTIVE_STORE_ID_KEY, resolvedId);
    }
    setIsStoreIdResolved(true);
  }, [isUserLoading, isLoadingProfile, userProfile, isPublicPage]);


  // Step 2: Fetch store settings ONLY after the store ID is resolved.
  const settingsDocRef = useMemo(() => {
    if (!firestore || (!isStoreIdResolved && !isPublicPage)) return null;
    return doc(firestore, 'stores', activeStoreId);
  }, [firestore, activeStoreId, isStoreIdResolved, isPublicPage]);
  const { data: settingsData, isLoading: isLoadingSettingsDoc } = useDoc<Settings>(settingsDocRef);
  
  // Step 3: Fetch currency rates ONLY after the store ID is resolved.
  const currencyRatesQuery = useMemo(() => {
    if (!firestore || (!isStoreIdResolved && !isPublicPage)) return null;
    return query(collection(firestore, 'stores', activeStoreId, 'currencyRates'), orderBy('date', 'desc'));
  }, [firestore, activeStoreId, isStoreIdResolved, isPublicPage]);
  const { data: currencyRatesData, isLoading: isLoadingRates } = useCollection<CurrencyRate>(currencyRatesQuery);


  const [displayCurrency, setDisplayCurrency] = useState<DisplayCurrency>('primary');
  useEffect(() => {
    const storedCurrencyPref = localStorage.getItem(CURRENCY_PREF_STORAGE_KEY) as DisplayCurrency;
    if(storedCurrencyPref) setDisplayCurrency(storedCurrencyPref);
  }, []);
  
  // The master loading state. The entire app waits on this.
  const isLoadingSettings = useMemo(() => {
    if (isPublicPage) return false;
    return isUserLoading || isLoadingProfile || !isStoreIdResolved || isLoadingSettingsDoc || isLoadingRates;
  }, [isUserLoading, isLoadingProfile, isStoreIdResolved, isLoadingSettingsDoc, isLoadingRates, isPublicPage]);
  
  const settings = settingsData ?? fallbackSettings;
  const currencyRates = currencyRatesData ?? [];

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
  const activeSymbol = activeCurrency === 'primary' ? (settings?.primaryCurrencySymbol || '$') : (settings?.secondaryCurrencySymbol || 'Bs.');
  const latestRate = (currencyRates.length > 0) ? currencyRates[0].rate : 1;
  const activeRate = activeCurrency === 'primary' ? 1 : (latestRate > 0 ? latestRate : 1);

  const contextValue: SettingsContextType = {
    settings, 
    setSettings: handleSetSettings, 
    displayCurrency, 
    toggleDisplayCurrency, 
    activeCurrency, 
    activeSymbol, 
    activeRate, 
    currencyRates, 
    activeStoreId,
    switchStore,
    isLoadingSettings,
    userProfile: userProfile || null,
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
