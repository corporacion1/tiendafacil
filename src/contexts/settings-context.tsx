
"use client"

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { useToast } from "@/hooks/use-toast";
import type { CurrencyRate, Settings, UserProfile } from "@/lib/types";
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
  const pathname = usePathname();

  // Forzar la aplicación a modo de datos locales (demo)
  const [activeStoreId, setActiveStoreId] = useState<string>(defaultStoreId);
  const [settings, setSettingsState] = useState<Settings | null>(defaultStore);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(defaultUsers[0]);
  const [currencyRates, setCurrencyRates] = useState<CurrencyRate[]>(mockCurrencyRates);
  const [displayCurrency, setDisplayCurrency] = useState<DisplayCurrency>('primary');
  
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const storedPref = localStorage.getItem(CURRENCY_PREF_STORAGE_KEY);
      if (storedPref === 'secondary') {
        setDisplayCurrency('secondary');
      }
    } catch (error) {
      console.error("Could not access localStorage", error);
    }
    // Simular una carga para evitar parpadeos
    setTimeout(() => setIsLoading(false), 500);
  }, []);

  const handleSetSettings = useCallback((newSettings: Partial<Settings>) => {
    setSettingsState(prev => ({...prev!, ...newSettings}));
    toast({ title: "Configuración guardada (DEMO)", description: "Los cambios son locales y se perderán al recargar." });
  }, [toast]);

  const switchStore = (storeId: string) => {
      toast({ title: `Cambiado a la tienda ${storeId} (DEMO)` });
      // En una aplicación real, aquí cambiarías activeStoreId y recargarías los datos de esa tienda.
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

  const activeCurrency = displayCurrency;
  const activeSymbol = activeCurrency === 'primary' ? (settings?.primaryCurrencySymbol || '$') : (settings?.secondaryCurrencySymbol || 'Bs.');
  const latestRate = currencyRates.length > 0 ? currencyRates[0].rate : 1;
  const activeRate = activeCurrency === 'primary' ? 1 : (latestRate > 0 ? latestRate : 1);
  
  const isPublicPath = pathname.startsWith('/catalog') || pathname === '/';

  if (isLoading && !isPublicPath) {
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
