
"use client"

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";

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
}

interface SettingsContextType {
  settings: Settings;
  setSettings: (settings: Settings) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

const SETTINGS_STORAGE_KEY = 'tienda_facil_settings';

const defaultSettings: Settings = {
    storeName: 'TIENDA FACIL WEB',
    storeAddress: 'Calle Falsa 123',
    storePhone: '+1 (555) 123-4567',
    storeSlogan: '¡Gracias por tu compra!',
    tax1: 16,
    tax2: 0,
    primaryCurrencyName: 'Bolívares',
    primaryCurrencySymbol: 'Bs.',
    secondaryCurrencyName: 'Dólares',
    secondaryCurrencySymbol: '$',
};

export const SettingsProvider = ({ children }: { children: React.ReactNode }) => {
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const { toast } = useToast();

  useEffect(() => {
    try {
      const storedSettings = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (storedSettings) {
        // Merge stored settings with defaults to ensure all keys are present
        const parsedSettings = JSON.parse(storedSettings);
        setSettings(prev => ({ ...prev, ...parsedSettings }));
      } else {
        // If no settings are stored, store the default ones
        localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(defaultSettings));
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

  return (
    <SettingsContext.Provider value={{ settings, setSettings: handleSetSettings }}>
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
