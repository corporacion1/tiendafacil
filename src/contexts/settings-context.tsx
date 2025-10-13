
"use client"

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useToast } from "@/hooks/use-toast";
import type { CurrencyRate, Settings, UserProfile, UserRole } from "@/lib/types";
import { defaultStore, defaultStoreId, mockCurrencyRates, defaultUsers } from '@/lib/data';
import { useUser } from '@/firebase';

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
  setCurrencyRates: React.Dispatch<React.SetStateAction<CurrencyRate[]>>;
  activeStoreId: string;
  switchStore: (storeId: string) => void;
  isLoadingSettings: boolean;
  userProfile: UserProfile | null;
  setUserProfile: (user: UserProfile | null) => void;
  firebaseUser: UserProfile | null;
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
  const { user: firebaseUser, isLoading: isLoadingAuth } = useUser();

  const [settings, setLocalSettings] = useState<Settings | null>(defaultStore);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [activeStoreId, setActiveStoreId] = useState<string>(defaultStoreId);
  const [currencyRates, setCurrencyRates] = useState<CurrencyRate[]>(mockCurrencyRates);
  const [displayCurrency, setDisplayCurrency] = useState<DisplayCurrency>('primary');
  const [isLoading, setIsLoading] = useState(true);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const storedStoreId = localStorage.getItem(ACTIVE_STORE_ID_STORAGE_KEY) || defaultStoreId;
    setActiveStoreId(storedStoreId);
    
    const storedCurrencyPref = localStorage.getItem(CURRENCY_PREF_STORAGE_KEY);
    if (storedCurrencyPref === 'secondary') {
      setDisplayCurrency('secondary');
    }
  }, []);

  useEffect(() => {
    if (!isLoadingAuth) {
      if (firebaseUser) {
        // Find user in our local data. If not found, create a new 'user' profile.
        const existingUser = defaultUsers.find(u => u.uid === firebaseUser.uid);
        if (existingUser) {
          setUserProfile(existingUser);
        } else {
          const newUserProfile: UserProfile = {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
            photoURL: firebaseUser.photoURL,
            role: 'user', // Default role for new users
            status: 'active',
            storeId: defaultStoreId, 
            createdAt: new Date().toISOString(),
          };
          // In a real app, you would save this new user to the database.
          // For demo purposes, we can add it to the local array if needed.
          setUserProfile(newUserProfile);
        }
      } else {
        setUserProfile(null);
      }
      setIsLoading(false);
    }
  }, [firebaseUser, isLoadingAuth]);

  const handleSetSettings = useCallback((newSettings: Partial<Settings>) => {
    setLocalSettings(prev => ({ ...(prev || defaultStore), ...newSettings }));
  }, []);

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
  
  const handleSetUserProfile = (user: UserProfile | null) => {
    // This function is now mainly for local state updates if needed,
    // as auth state is driven by the useUser hook.
    setUserProfile(user);
  }

  const activeSymbol = displayCurrency === 'primary' ? (settings?.primaryCurrencySymbol || '$') : (settings?.secondaryCurrencySymbol || 'Bs.');
  const latestRate = currencyRates.length > 0 ? currencyRates[0].rate : 1;
  const activeRate = displayCurrency === 'primary' ? 1 : (latestRate > 0 ? latestRate : 1);
  
  const isPublicPath = pathname.startsWith('/catalog') || pathname === '/' || pathname.startsWith('/login');
  
  if (isLoading && !isPublicPath && isClient) {
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
    setCurrencyRates,
    activeStoreId,
    switchStore,
    isLoadingSettings: isLoading,
    userProfile,
    setUserProfile: handleSetUserProfile,
    firebaseUser,
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
