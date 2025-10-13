"use client"

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useToast } from "@/hooks/use-toast";
import type { CurrencyRate, Settings, UserProfile } from "@/lib/types";
import { defaultStore, defaultStoreId, mockCurrencyRates, defaultUsers } from '@/lib/data';
import { SUPER_ADMIN_UID } from '@/lib/constants';

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
const LOGGED_IN_USER_UID_KEY = 'tienda_facil_user_uid';

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
  const router = useRouter();
  const pathname = usePathname();

  const [settings, setLocalSettings] = useState<Settings | null>(defaultStore);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [activeStoreId, setActiveStoreId] = useState<string>(defaultStoreId);
  const [currencyRates, setCurrencyRates] = useState<CurrencyRate[]>(mockCurrencyRates);
  const [displayCurrency, setDisplayCurrency] = useState<DisplayCurrency>('primary');
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    try {
      const storedPref = localStorage.getItem(CURRENCY_PREF_STORAGE_KEY);
      if (storedPref === 'secondary') setDisplayCurrency('secondary');

      const storedStoreId = localStorage.getItem(ACTIVE_STORE_ID_STORAGE_KEY);
      if (storedStoreId) {
        setActiveStoreId(storedStoreId);
      }

      // Simulate user login check
      const loggedInUserUID = localStorage.getItem(LOGGED_IN_USER_UID_KEY) || SUPER_ADMIN_UID;
      const profile = defaultUsers.find(u => u.uid === loggedInUserUID);
      
      setUserProfile(profile || defaultUsers.find(u => u.role === 'superAdmin')!);
      
    } catch (error) {
      console.error("Could not access localStorage", error);
      // Fallback to default super admin if localStorage fails
      setUserProfile(defaultUsers.find(u => u.role === 'superAdmin')!);
    } finally {
        setIsLoadingSettings(false);
    }
  }, []);
  
  useEffect(() => {
    if (!isLoadingSettings && !userProfile && !pathname.startsWith('/catalog') && !pathname.startsWith('/login')) {
        // This is a simulated login redirect
        const superAdmin = defaultUsers.find(u => u.role === 'superAdmin');
        if(superAdmin) {
            setUserProfile(superAdmin);
            localStorage.setItem(LOGGED_IN_USER_UID_KEY, superAdmin.uid);
        }
        toast({ title: 'Redirigiendo...', description: 'Inicia sesión para continuar.' });
    }
  }, [isLoadingSettings, userProfile, router, pathname, toast]);


  const handleSetSettings = useCallback((newSettings: Partial<Settings>) => {
    setLocalSettings(prev => ({ ...(prev || defaultStore), ...newSettings }));
    toast({ title: "Configuración Guardada (DEMO)", description: "Tus cambios se han guardado localmente." });
  }, [toast]);

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

  const activeSymbol = displayCurrency === 'primary' ? (settings?.primaryCurrencySymbol || '$') : (settings?.secondaryCurrencySymbol || 'Bs.');
  const latestRate = currencyRates.length > 0 ? currencyRates[0].rate : 1;
  const activeRate = displayCurrency === 'primary' ? 1 : (latestRate > 0 ? latestRate : 1);
  
  const isPublicPath = pathname.startsWith('/catalog') || pathname === '/' || pathname.startsWith('/login');
  
  if (isLoadingSettings && !isPublicPath && isClient) {
      return <AppLoadingScreen />;
  }

  const contextValue: SettingsContextType = {
    settings,
    setSettings: handleSetSettings,
    displayCurrency,
    toggleDisplayCurrency,
    activeCurrency: displayCurrency,
    activeSymbol,
    activeRate,
    currencyRates,
    activeStoreId,
    switchStore,
    isLoadingSettings,
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
