
"use client"

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useToast } from "@/hooks/use-toast";
import type { CurrencyRate, Settings, UserProfile } from '@/lib/types';
import { useUser as useAuthUser } from '@/firebase/auth/use-user';
import { useCollection, useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, doc, query, orderBy, limit } from 'firebase/firestore';
import { defaultStore, defaultStoreId } from '@/lib/data';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { FirstTimeSetupModal } from '@/components/first-time-setup-modal';
import { Skeleton } from '@/components/ui/skeleton';

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
  const firestore = useFirestore();

  const { user: userProfile, isUserLoading: isAuthLoading, needsProfileCreation } = useAuthUser();
  
  const [activeStoreId, setActiveStoreId] = useState<string>(defaultStoreId);
  const [settings, setSettingsState] = useState<Settings | null>(null);
  const [displayCurrency, setDisplayCurrency] = useState<DisplayCurrency>('primary');
  
  const [isReady, setIsReady] = useState(false);

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
  
  const storeDocRef = useMemoFirebase(() => {
    // CRITICAL: Only attempt to fetch if we are NOT in the setup flow.
    if (firestore && activeStoreId && !isAuthLoading && userProfile) {
      return doc(firestore, 'stores', activeStoreId);
    }
    return null;
  }, [firestore, activeStoreId, isAuthLoading, userProfile]);

  const { data: storeSettings, isLoading: isLoadingStoreSettings } = useDoc<Settings>(storeDocRef);

  const ratesCollectionRef = useMemoFirebase(() => {
    // CRITICAL: Only create the query if userProfile exists, avoiding reads for new users.
    if (firestore && activeStoreId && userProfile) {
        return query(
          collection(firestore, 'stores', activeStoreId, 'currencyRates'), 
          orderBy('date', 'desc'), 
          limit(30)
        );
    }
    return null;
  }, [firestore, activeStoreId, userProfile]);

  const { data: currencyRates } = useCollection<CurrencyRate>(ratesCollectionRef);
  
  useEffect(() => {
    if (isAuthLoading) return;

    // If setup is needed, the app is "ready" to show the modal.
    if (needsProfileCreation) {
      setIsReady(true);
      return;
    }
    
    const isPublicPath = pathname.startsWith('/catalog') || pathname === '/';
    if (!userProfile && !isPublicPath) {
      router.replace('/catalog');
      setIsReady(true);
      return;
    }

    if (storeSettings) {
      setSettingsState(storeSettings);
      setIsReady(true);
    } else if (!isLoadingStoreSettings && !storeSettings && userProfile) {
      // If no settings are found for an existing user, fallback to default
      setSettingsState(defaultStore);
      setIsReady(true);
    }

  }, [isAuthLoading, needsProfileCreation, userProfile, storeSettings, isLoadingStoreSettings, pathname, router]);

  
  const handleSetSettings = useCallback((newSettings: Partial<Settings>) => {
    if (firestore && activeStoreId) {
      const storeDocRef = doc(firestore, 'stores', activeStoreId);
      setDocumentNonBlocking(storeDocRef, newSettings, { merge: true });
      toast({ title: "Configuración guardada", description: "Tus cambios se están guardando en la nube." });
    }
  }, [firestore, activeStoreId, toast]);

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
  
  if (needsProfileCreation) {
    return <FirstTimeSetupModal />;
  }

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
    currencyRates: currencyRates || [],
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
