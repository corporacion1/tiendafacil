
"use client"

import React, { createContext, useContext, useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useToast } from "@/hooks/use-toast";
import type { CurrencyRate, Settings, UserProfile } from '@/lib/types';
import { defaultStoreId, defaultStore, defaultUsers, mockCurrencyRates } from '@/lib/data';

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

export const SettingsProvider = ({ children }: { children: React.ReactNode }) => {
  const { toast } = useToast();
  const router = useRouter();
  const pathname = usePathname();

  const [settings, setLocalSettings] = useState<Settings | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [currencyRates, setCurrencyRates] = useState<CurrencyRate[]>([]);
  const [activeStoreId, setActiveStoreId] = useState<string>(defaultStoreId);
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);
  const [displayCurrency, setDisplayCurrency] = useState<DisplayCurrency>('primary');
  
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Cargar preferencias y datos iniciales una sola vez
  useEffect(() => {
    try {
      const storedCurrencyPref = localStorage.getItem(CURRENCY_PREF_STORAGE_KEY) as DisplayCurrency;
      if (storedCurrencyPref) setDisplayCurrency(storedCurrencyPref);
    } catch (error) {
      console.error("Could not access localStorage for currency preference", error);
    }
    
    // Simular carga de datos inicial
    setLocalSettings(defaultStore);
    setCurrencyRates(mockCurrencyRates.map(r => ({ ...r, id: `rate-${Math.random()}`})));
    // Simular un usuario logueado por defecto (el superAdmin)
    setUserProfile(defaultUsers.find(u => u.role === 'superAdmin') || defaultUsers[0]);

    setIsLoadingSettings(false);
    setIsInitialLoad(false);
    
  }, []);

  const handleSetSettings = (newSettings: Settings) => {
    setLocalSettings(newSettings);
    toast({ title: "Configuración Guardada", description: "Tus cambios se han aplicado en la sesión actual." });
  };

  const switchStore = (storeId: string) => {
      toast({ title: `Cambiado a la tienda ${storeId} (Simulación)` });
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
