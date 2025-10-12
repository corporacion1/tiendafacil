
"use client"

import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useToast } from "@/hooks/use-toast";
import { doc, collection } from 'firebase/firestore';
import { useDoc, useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import type { CurrencyRate, Settings, UserProfile } from '@/lib/types';
import { defaultStore, defaultUsers, defaultStoreId, mockCurrencyRates, forceSeedDatabase } from '@/lib/data';
import { useUser } from '@/firebase/auth/use-user';

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
const DB_SEEDED_FLAG_KEY = 'tienda_facil_db_seeded_v1_forced';

export const SettingsProvider = ({ children }: { children: React.ReactNode }) => {
  const { toast } = useToast();
  const router = useRouter();
  const pathname = usePathname();
  const firestore = useFirestore();

  const { user: authUser, isUserLoading } = useUser();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  const [settings, setSettingsState] = useState<Settings | null>(defaultStore);
  const [currencyRates, setCurrencyRates] = useState<CurrencyRate[]>(mockCurrencyRates.map((r, i) => ({ ...r, id: `rate-${i}` })));
  const isLoadingSettingsDoc = false;

  const [activeStoreId, setActiveStoreId] = useState<string>(defaultStoreId);
  const [displayCurrency, setDisplayCurrency] = useState<DisplayCurrency>('primary');
  
  useEffect(() => {
    if (!isUserLoading && authUser) {
        const localProfile = defaultUsers.find(u => u.uid === authUser.uid);
        if (localProfile) {
            setUserProfile({
                ...localProfile,
                displayName: authUser.displayName,
                email: authUser.email,
                photoURL: authUser.photoURL,
            });
        } else {
            setUserProfile({
                uid: authUser.uid,
                displayName: authUser.displayName,
                email: authUser.email,
                photoURL: authUser.photoURL,
                role: 'user',
                status: 'active',
                createdAt: new Date().toISOString(),
            });
        }
    } else if (!isUserLoading && !authUser) {
        setUserProfile(null);
    }
  }, [authUser, isUserLoading]);


  useEffect(() => {
    const seedDatabase = async () => {
        try {
            const isSeeded = localStorage.getItem(DB_SEEDED_FLAG_KEY);
            if (!isSeeded) {
                toast({
                    title: 'Poblando Base de Datos...',
                    description: 'Por favor espera. Esto solo ocurrirá una vez.',
                });
                await forceSeedDatabase(firestore);
                localStorage.setItem(DB_SEEDED_FLAG_KEY, 'true');
                toast({
                    title: '¡Base de Datos Poblada!',
                    description: 'Los datos de demostración se han cargado. Refresca la página para verlos.',
                });
                window.location.reload();
            }
        } catch (error) {
            console.error("Database seeding failed:", error);
             toast({
                variant: 'destructive',
                title: 'Error al poblar la base de datos',
                description: 'No se pudieron cargar los datos de demostración.',
            });
        }
    };
    if (firestore) {
        seedDatabase();
    }
  }, [firestore, toast]);
  

  useEffect(() => {
    try {
      const storedCurrencyPref = localStorage.getItem(CURRENCY_PREF_STORAGE_KEY) as DisplayCurrency;
      if (storedCurrencyPref) setDisplayCurrency(storedCurrencyPref);

      const storedStoreId = localStorage.getItem(ACTIVE_STORE_ID_STORAGE_KEY);
      
      if (userProfile?.role === 'superAdmin' && storedStoreId) {
        setActiveStoreId(storedStoreId);
      } else if (userProfile?.storeId) {
        setActiveStoreId(userProfile.storeId);
      }

    } catch (error) {
      console.error("Could not access localStorage", error);
    }
  }, [userProfile]);


  useEffect(() => {
     if (!isUserLoading && !authUser && !pathname.startsWith('/catalog')) {
      router.push('/catalog');
    }
  }, [isUserLoading, authUser, pathname, router]);

  const handleSetSettings = (newSettings: Settings) => {
    setSettingsState(newSettings);
    toast({ title: "Configuración Guardada (Simulación)", description: "Los cambios se guardaron localmente." });
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

  const isLoading = isUserLoading || isLoadingSettingsDoc;

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
