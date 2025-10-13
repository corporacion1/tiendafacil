
"use client"

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useToast } from "@/hooks/use-toast";
import type { CurrencyRate, Settings, UserProfile } from '@/lib/types';
import { useUser as useAuthUser } from '@/firebase/auth/use-user';
import { defaultStore, defaultStoreId, mockCurrencyRates, defaultUsers } from '@/lib/data';

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
  const router = useRouter();
  const pathname = usePathname();

  const { user: authUserProfile, isUserLoading: isAuthLoading } = useAuthUser();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  
  const [activeStoreId, setActiveStoreId] = useState<string>(defaultStoreId);
  const [settings, setSettingsState] = useState<Settings | null>(defaultStore);
  const [currencyRates, setCurrencyRates] = useState<CurrencyRate[]>(mockCurrencyRates);
  const [displayCurrency, setDisplayCurrency] = useState<DisplayCurrency>('primary');
  
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
      if (isAuthLoading) return;
      
      // Simulate finding a user profile from local data
      const localUserProfile = defaultUsers.find(u => u.uid === authUserProfile?.uid);
      setUserProfile(localUserProfile || null);

      try {
        const storedStoreId = localStorage.getItem(ACTIVE_STORE_ID_STORAGE_KEY);
        if (localUserProfile?.role === 'superAdmin' && storedStoreId) {
          setActiveStoreId(storedStoreId);
        } else if (localUserProfile?.storeId) {
          setActiveStoreId(localUserProfile.storeId);
        }
      } catch (error) {
        console.error("Could not access localStorage for storeId", error);
      }
      
      const isPublicPath = pathname.startsWith('/catalog') || pathname === '/';
      if (!localUserProfile && !isPublicPath) {
          router.replace('/catalog');
      }

      setIsReady(true);
  }, [isAuthLoading, authUserProfile, pathname, router]);

  const handleSetSettings = useCallback((newSettings: Partial<Settings>) => {
    setSettingsState(prev => prev ? {...prev, ...newSettings} : null);
    toast({ title: "Configuración guardada (DEMO)", description: "Tus cambios se han guardado localmente." });
  }, [toast]);

  const switchStore = (storeId: string) => {
      if (userProfile?.role === 'superAdmin') {
        setActiveStoreId(storeId);
        try {
            localStorage.setItem(ACTIVE_STORE_ID_STORAGE_KEY, storeId);
        } catch (error) {
            console.error("Could not save storeId to localStorage", error);
        }
        toast({ title: `Cambiado a la tienda ${storeId}` });
        window.location.reload(); 
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
  const latestRate = (currencyRates && currencyRates.length > 0) ? currencyRates[0].rate : 1;
  const activeRate = activeCurrency === 'primary' ? 1 : (latestRate > 0 ? latestRate : 1);
  
  const isPublicPath = pathname.startsWith('/catalog') || pathname === '/';

  if (!isReady && !isPublicPath) {
      return <AppLoadingScreen />;
  }

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
    isLoadingSettings: !isReady,
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
