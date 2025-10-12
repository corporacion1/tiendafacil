
"use client"

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useToast } from "@/hooks/use-toast";
import type { CurrencyRate, Settings, UserProfile, Product, Customer, Family, Unit, Warehouse, Supplier, Ad } from '@/lib/types';
import { useUser as useAuthUser } from '@/firebase/auth/use-user';
import { useCollection, useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, doc, writeBatch, getDocs } from 'firebase/firestore';
import { defaultStore, defaultStoreId } from '@/lib/data';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { forceSeedDatabase } from '@/lib/seed';
import { Skeleton } from '@/components/ui/skeleton';

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

const CURRENCY_PREF_STORAGE_KEY = 'tienda_facil_currency_pref';
const ACTIVE_STORE_ID_STORAGE_KEY = 'tienda_facil_active_store_id';


function AppLoadingScreen() {
    return (
        <div className="flex min-h-screen w-full items-center justify-center bg-background">
            <div className="flex flex-col items-center gap-4">
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-muted border-t-primary" />
                <p className="text-muted-foreground">Cargando configuración de la tienda...</p>
            </div>
        </div>
    );
}

export const SettingsProvider = ({ children }: { children: React.ReactNode }) => {
  const { toast } = useToast();
  const router = useRouter();
  const pathname = usePathname();
  const firestore = useFirestore();

  const { user: userProfile, isUserLoading: isAuthLoading } = useAuthUser();
  
  const [activeStoreId, setActiveStoreId] = useState<string>(defaultStoreId);
  const [displayCurrency, setDisplayCurrency] = useState<DisplayCurrency>('primary');
  const [isLoading, setIsLoading] = useState(true);

  // Set active store ID from local storage or user profile
  useEffect(() => {
    try {
      const storedStoreId = localStorage.getItem(ACTIVE_STORE_ID_STORAGE_KEY);
      if (userProfile?.role === 'superAdmin' && storedStoreId) {
        setActiveStoreId(storedStoreId);
      } else if (userProfile?.storeId) {
        setActiveStoreId(userProfile.storeId);
      }
    } catch (error) {
      console.error("Could not access localStorage for storeId", error);
    }
  }, [userProfile]);

  const storeDocRef = useMemoFirebase(() => firestore ? doc(firestore, 'stores', activeStoreId) : null, [firestore, activeStoreId]);
  const { data: settings, isLoading: isLoadingStoreSettings } = useDoc<Settings>(storeDocRef);
  
  const ratesCollectionRef = useMemoFirebase(() => firestore ? collection(firestore, 'stores', activeStoreId, 'currencyRates') : null, [firestore, activeStoreId]);
  const { data: currencyRates } = useCollection<CurrencyRate>(ratesCollectionRef);


  // Handle redirection and initial loading state
  useEffect(() => {
    if (isAuthLoading) return; // Wait for user auth to resolve

    const isPublicPath = pathname.startsWith('/catalog') || pathname === '/';
    if (!userProfile && !isPublicPath) {
      router.replace('/catalog');
    }
    
    setIsLoading(isLoadingStoreSettings);
  }, [isAuthLoading, userProfile, pathname, router, isLoadingStoreSettings]);
  
  // Seed database if store is in demo mode and has no products
  useEffect(() => {
      const seedDataIfNeeded = async () => {
          if (firestore && settings && settings.useDemoData) {
              const productsRef = collection(firestore, 'products');
              const productsSnapshot = await getDocs(productsRef);

              if (productsSnapshot.empty) {
                  toast({ title: 'Configurando tu tienda demo...', description: 'Estamos agregando datos de ejemplo para que puedas empezar.' });
                  await forceSeedDatabase(firestore, activeStoreId);
                  toast({ title: '¡Tienda lista!', description: 'Tus datos de demostración han sido cargados.' });
                  // Optionally, you can trigger a reload or state update here
              }
          }
      };
      if (!isLoadingStoreSettings) {
          seedDataIfNeeded();
      }
  }, [firestore, settings, activeStoreId, isLoadingStoreSettings, toast]);

  const handleSetSettings = useCallback((newSettings: Partial<Settings>) => {
    if (storeDocRef) {
      setDocumentNonBlocking(storeDocRef, newSettings, { merge: true });
      toast({ title: "Configuración guardada", description: "Tus cambios se están guardando en la nube." });
    }
  }, [storeDocRef, toast]);

  const switchStore = (storeId: string) => {
      if (userProfile?.role === 'superAdmin') {
        setActiveStoreId(storeId);
        try {
            localStorage.setItem(ACTIVE_STORE_ID_STORAGE_KEY, storeId);
        } catch (error) {
            console.error("Could not save storeId to localStorage", error);
        }
        toast({ title: `Cambiado a la tienda ${storeId}` });
        router.refresh();
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
  
  const isLoadingContext = isAuthLoading || isLoading;
  
  if (isLoadingContext && !pathname.startsWith('/catalog')) {
      return <AppLoadingScreen />;
  }

  const contextValue: SettingsContextType = {
    settings, 
    setSettings: handleSetSettings as (settings: Settings) => void, 
    displayCurrency, 
    toggleDisplayCurrency, 
    activeCurrency, 
    activeSymbol, 
    activeRate, 
    currencyRates: currencyRates || [],
    activeStoreId,
    switchStore,
    isLoadingSettings: isLoadingContext,
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

