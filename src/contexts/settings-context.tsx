
"use client"

import React, { createContext, useContext, useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useToast } from "@/hooks/use-toast";
import type { CurrencyRate, Settings, UserProfile } from '@/lib/types';
import { defaultStoreId, defaultStore, mockCurrencyRates, defaultUsers } from '@/lib/data';
import { useUser as useAuthUserFromFirebase } from '@/firebase/auth/use-user'; // Keep for auth state, but not for profile data

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

const CURRENCY_PREF_STORAGE_KEY = 'tienda_facil_currency_pref';
const ACTIVE_STORE_ID_STORAGE_KEY = 'tienda_facil_active_store_id';

export const SettingsProvider = ({ children }: { children: React.ReactNode }) => {
  const { toast } = useToast();
  const router = useRouter();
  const pathname = usePathname();

  // We still use this to know IF a user is logged in via Firebase Auth
  const { user: authUser, isUserLoading: isAuthLoading } = useAuthUserFromFirebase();

  // --- LOCAL STATE MANAGEMENT ---
  const [settings, setSettingsState] = useState<Settings | null>(defaultStore);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [activeStoreId, setActiveStoreId] = useState<string>(defaultStoreId);
  const [displayCurrency, setDisplayCurrency] = useState<DisplayCurrency>('primary');
  const [currencyRates, setCurrencyRates] = useState<CurrencyRate[]>(mockCurrencyRates);
  const [isLoading, setIsLoading] = useState(true);

  // Load preferences and set user profile from local data
  useEffect(() => {
    try {
      const storedCurrencyPref = localStorage.getItem(CURRENCY_PREF_STORAGE_KEY) as DisplayCurrency;
      if (storedCurrencyPref) setDisplayCurrency(storedCurrencyPref);

      const storedStoreId = localStorage.getItem(ACTIVE_STORE_ID_STORAGE_KEY);

      if (authUser) {
        // Find user profile from local mock data
        const profile = defaultUsers.find(u => u.uid === authUser.uid) || defaultUsers.find(u => u.role === 'superAdmin')!;
        setUserProfile(profile);

        if (profile.role === 'superAdmin' && storedStoreId) {
          setActiveStoreId(storedStoreId);
        } else if (profile.storeId) {
          setActiveStoreId(profile.storeId);
        }
      } else {
        setUserProfile(null);
      }
    
    } catch (error) {
      console.error("Could not access localStorage", error);
    } finally {
        setIsLoading(false);
    }
  }, [authUser]);


  useEffect(() => {
     if (!isAuthLoading && !authUser && !pathname.startsWith('/catalog')) {
      router.push('/catalog');
    }
  }, [isAuthLoading, authUser, pathname, router]);

  const handleSetSettings = (newSettings: Settings) => {
    setSettingsState(newSettings);
    toast({ title: "Configuración Guardada (Simulación)", description: "Tus cambios se han guardado localmente." });
  };

  const switchStore = (storeId: string) => {
      if (userProfile?.role === 'superAdmin') {
        setActiveStoreId(storeId);
        try {
            localStorage.setItem(ACTIVE_STORE_ID_STORAGE_KEY, storeId);
        } catch (error) {
            console.error("Could not save storeId to localStorage", error);
        }
        toast({ title: `Cambiado a la tienda ${storeId}` });
      } else {
        toast({ variant: 'destructive', title: 'Acción no permitida' });
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
    setCurrencyRates,
    activeStoreId,
    switchStore,
    isLoadingSettings: isLoading || isAuthLoading,
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
