
"use client"

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";
import type { CurrencyRate } from '@/lib/types';
import { mockCurrencyRates } from '@/lib/data';

export interface Settings {
    storeName: string;
    storeAddress: string;
    storePhone: string;
    storeSlogan: string;
    tax1: number;
    tax2: number;
    primaryCurrencyName: string;
    primaryCurrencySymbol: string;
    secondaryCurrencyName: string;
    secondaryCurrencySymbol: string;
    storeLocation?: { lat: number; lng: number };
}

type DisplayCurrency = 'primary' | 'secondary';

interface SettingsContextType {
  settings: Settings;
  setSettings: (settings: Settings) => void;
  displayCurrency: DisplayCurrency;
  toggleDisplayCurrency: () => void;
  activeCurrency: 'primary' | 'secondary';
  activeSymbol: string;
  activeRate: number;
  currencyRates: CurrencyRate[];
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

const SETTINGS_STORAGE_KEY = 'tienda_facil_settings';
const CURRENCY_PREF_STORAGE_KEY = 'tienda_facil_currency_pref';

const defaultSettings: Settings = {
    storeName: 'TIENDA FACIL WEB',
    storeAddress: 'Calle Falsa 123',
    storePhone: '+1 (555) 123-4567',
    storeSlogan: '¡Gracias por tu compra!',
    tax1: 16,
    tax2: 0,
    primaryCurrencyName: 'Dólar',
    primaryCurrencySymbol: '$',
    secondaryCurrencyName: 'Bolívares',
    secondaryCurrencySymbol: 'Bs.',
    storeLocation: { lat: 10.4806, lng: -66.9036 }, // Default to Caracas, VE
};

export const SettingsProvider = ({ children }: { children: React.ReactNode }) => {
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [currencyRates, setCurrencyRates] = useState(mockCurrencyRates);
  const [displayCurrency, setDisplayCurrency] = useState<DisplayCurrency>('primary');
  const { toast } = useToast();

  useEffect(() => {
    try {
      const storedSettings = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (storedSettings) {
        const parsedSettings = JSON.parse(storedSettings);
        setSettings(prev => ({ ...prev, ...parsedSettings }));
      } else {
        localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(defaultSettings));
      }

      const storedCurrencyPref = localStorage.getItem(CURRENCY_PREF_STORAGE_KEY) as DisplayCurrency;
      if(storedCurrencyPref && ['primary', 'secondary'].includes(storedCurrencyPref)) {
        setDisplayCurrency(storedCurrencyPref);
      }

    } catch (error) {
      console.error("Could not access localStorage for settings", error);
    }
  }, []);

  const handleSetSettings = (newSettings: Settings) => {
    try {
        localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(newSettings));
        setSettings(newSettings);
    } catch (error) {
        console.error("Could not save settings to localStorage", error);
        toast({
            variant: "destructive",
            title: "Error",
            description: "No se pudo guardar la configuración."
        });
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
  const activeSymbol = activeCurrency === 'primary' ? settings.primaryCurrencySymbol : settings.secondaryCurrencySymbol;
  const activeRate = activeCurrency === 'primary' ? 1 : (currencyRates[0]?.rate || 1);

  return (
    <SettingsContext.Provider value={{ settings, setSettings: handleSetSettings, displayCurrency, toggleDisplayCurrency, activeCurrency, activeSymbol, activeRate, currencyRates }}>
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
