
"use client"

import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { useToast } from "@/hooks/use-toast";
import type { CurrencyRate, Settings, UserProfile } from '@/lib/types';
import { useUser, useFirestore, useDoc, useCollection, setDocumentNonBlocking } from '@/firebase';
import { collection, doc, query, orderBy, getDoc } from 'firebase/firestore';
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
};

export const SettingsProvider = ({ children }: { children: React.ReactNode }) => {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const pathname = usePathname();

  const isPublicPage = useMemo(() => pathname === '/' || pathname.startsWith('/catalog') || pathname.startsWith('/login'), [pathname]);
  
  const [activeStoreId, setActiveStoreId] = useState<string>(defaultStoreId);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  const [isLoading, setIsLoading] = useState(true);

  const [displayCurrency, setDisplayCurrency] = useState<DisplayCurrency>('primary');
  useEffect(() => {
    try {
      const storedCurrencyPref = localStorage.getItem(CURRENCY_PREF_STORAGE_KEY) as DisplayCurrency;
      if(storedCurrencyPref) setDisplayCurrency(storedCurrencyPref);
    } catch (error) {
      console.error("Could not access localStorage for currency preference", error);
    }
  }, []);

  useEffect(() => {
    if (isUserLoading || !firestore) return;
  
    const fetchUserProfile = async () => {
      if (!user) {
        setUserProfile(null);
        setActiveStoreId(defaultStoreId);
        setIsLoading(false);
        return;
      }
      
      const userRef = doc(firestore, 'users', user.uid);
      try {
        const docSnap = await getDoc(userRef);
        const profile = docSnap.exists() ? docSnap.data() as UserProfile : null;
        
        setUserProfile(profile);

        let resolvedId = defaultStoreId;
        if (profile) {
            if (profile.role === 'superAdmin') {
                const storedId = typeof window !== 'undefined' ? localStorage.getItem(ACTIVE_STORE_ID_KEY) : null;
                resolvedId = storedId || defaultStoreId;
            } else if (profile.storeId) {
                resolvedId = profile.storeId;
            }
        }
        setActiveStoreId(resolvedId);
        if(profile?.role === 'superAdmin' && typeof window !== 'undefined') {
            localStorage.setItem(ACTIVE_STORE_ID_KEY, resolvedId);
        }

      } catch (error) {
        console.error("Error fetching user profile:", error);
        setUserProfile(null);
        setActiveStoreId(defaultStoreId);
      }
    };
  
    fetchUserProfile();

  }, [user, isUserLoading, firestore, isPublicPage]);

  const settingsDocRef = useMemo(() => {
    if (!firestore || isPublicPage) return null;
    return doc(firestore, 'stores', activeStoreId);
  }, [firestore, activeStoreId, isPublicPage]);
  const { data: settingsData, isLoading: isLoadingSettingsDoc } = useDoc<Settings>(settingsDocRef);
  
  const currencyRatesQuery = useMemo(() => {
    // CRITICAL FIX: Do not attempt to query rates until the settings have been loaded.
    if (!firestore || isPublicPage || !settingsData) return null;
    return query(collection(firestore, 'stores', activeStoreId, 'currencyRates'), orderBy('date', 'desc'));
  }, [firestore, activeStoreId, isPublicPage, settingsData]); // Add settingsData dependency
  const { data: currencyRatesData, isLoading: isLoadingRates } = useCollection<CurrencyRate>(currencyRatesQuery);
  
  useEffect(() => {
      if (isPublicPage) {
          setIsLoading(false);
      } else {
          // Now, isLoading depends on the full chain: user -> settings -> rates
          setIsLoading(isUserLoading || isLoadingSettingsDoc || (settingsData ? isLoadingRates : false));
      }
  }, [isUserLoading, isLoadingSettingsDoc, isLoadingRates, isPublicPage, settingsData]);


  const settings = settingsData ?? (isPublicPage ? fallbackSettings : null);
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
    try {
      localStorage.setItem(CURRENCY_PREF_STORAGE_KEY, newPreference);
    } catch(error) {
      console.error("Could not access localStorage to set currency preference", error);
    }
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
