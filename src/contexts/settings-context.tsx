
"use client"

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";
import type { CurrencyRate } from '@/lib/types';
import { mockCurrencyRates, mockSales } from '@/lib/data';

export interface Settings {
    storeName: string;
    storeAddress: string;
    storePhone: string;
    storeSlogan: string;
    storeTiktok: string;
    storeMeta: string;
    saleSeries: string;
    saleCorrelative: number;
    tax1: number;
    tax2: number;
    primaryCurrencyName: string;
    primaryCurrencySymbol: string;
    secondaryCurrencyName: string;
    secondaryCurrencySymbol: string;
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
  setCurrencyRates: React.Dispatch<React.SetStateAction<CurrencyRate[]>>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

const SETTINGS_STORAGE_KEY = 'tienda_facil_settings';
const CURRENCY_PREF_STORAGE_KEY = 'tienda_facil_currency_pref';

const findHighestSaleCorrelative = () => {
    if (!mockSales || mockSales.length === 0) {
        return 1;
    }
    const highestId = mockSales.reduce((max, sale) => {
        const parts = sale.id.split('-');
        const currentNum = parseInt(parts[parts.length - 1], 10);
        return !isNaN(currentNum) && currentNum > max ? currentNum : max;
    }, 0);
    return highestId + 1;
};


const defaultSettings: Settings = {
    storeName: 'TIENDA FACIL WEB',
    storeAddress: 'Calle Falsa 123',
    storePhone: '+58-412-6915593',
    storeSlogan: '¡Gracias por tu compra!',
    storeTiktok: '@corporacion1plus',
    storeMeta: '@corporacion1plus',
    saleSeries: 'SALE',
    saleCorrelative: 1, // Will be updated on client
    tax1: 16,
    tax2: 0,
    primaryCurrencyName: 'Dólar',
    primaryCurrencySymbol: '$',
    secondaryCurrencyName: 'Bolívares',
    secondaryCurrencySymbol: 'Bs.',
};

export const SettingsProvider = ({ children }: { children: React.ReactNode }) => {
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [currencyRates, setCurrencyRates] = useState(mockCurrencyRates);
  const [displayCurrency, setDisplayCurrency] = useState<DisplayCurrency>('primary');
  const { toast } = useToast();

  useEffect(() => {
    try {
      const storedSettings = localStorage.getItem(SETTINGS_STORAGE_KEY);
      const nextCorrelative = findHighestSaleCorrelative();
      
      if (storedSettings) {
        const parsedSettings = JSON.parse(storedSettings);
        setSettings(prev => ({ ...defaultSettings, ...parsedSettings, saleCorrelative: parsedSettings.saleCorrelative > nextCorrelative ? parsedSettings.saleCorrelative : nextCorrelative }));
      } else {
        const initialSettings = { ...defaultSettings, saleCorrelative: nextCorrelative };
        localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(initialSettings));
        setSettings(initialSettings);
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
  
  // Ensure activeRate is never 0 to prevent division by zero errors.
  const latestRate = currencyRates?.[0]?.rate;
  const activeRate = activeCurrency === 'primary' ? 1 : (latestRate && latestRate > 0 ? latestRate : 1);


  return (
    <SettingsContext.Provider value={{ settings, setSettings: handleSetSettings, displayCurrency, toggleDisplayCurrency, activeCurrency, activeSymbol, activeRate, currencyRates, setCurrencyRates }}>
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

    