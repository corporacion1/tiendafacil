
"use client"

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useToast } from "@/hooks/use-toast";
import type { CurrencyRate, Settings, UserProfile } from "@/lib/types";
import { defaultStore, defaultStoreId, mockCurrencyRates } from '@/lib/data';
import { SUPER_ADMIN_UID } from '@/lib/constants';
import { getAuth, onAuthStateChanged, User } from 'firebase/auth';
import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps } from 'firebase/app';
import { doc, getDoc, getFirestore } from 'firebase/firestore';

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
  firebaseUser: User | null;
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

  const [settings, setLocalSettings] = useState<Settings | null>(defaultStore);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [activeStoreId, setActiveStoreId] = useState<string>(defaultStoreId);
  const [currencyRates, setCurrencyRates] = useState<CurrencyRate[]>(mockCurrencyRates);
  const [displayCurrency, setDisplayCurrency] = useState<DisplayCurrency>('primary');
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    
    if (!getApps().length) {
        initializeApp(firebaseConfig);
    }
    const auth = getAuth();
    const db = getFirestore();

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
        setIsLoadingSettings(true);
        if (user) {
            setFirebaseUser(user);
            // Fetch user profile from Firestore
            const userDocRef = doc(db, 'users', user.uid);
            const userDoc = await getDoc(userDocRef);

            if (userDoc.exists()) {
                const profileData = userDoc.data() as UserProfile;
                setUserProfile(profileData);
                const storeIdToUse = profileData.storeId || localStorage.getItem(ACTIVE_STORE_ID_STORAGE_KEY) || defaultStoreId;
                setActiveStoreId(storeIdToUse);
            } else {
                 // User exists in Auth, but not in Firestore 'users' collection.
                 // This is a new user that needs to go through setup.
                const newUserProfile: UserProfile = {
                    uid: user.uid,
                    email: user.email,
                    displayName: user.displayName,
                    photoURL: user.photoURL,
                    role: user.uid === SUPER_ADMIN_UID ? 'superAdmin' : 'user',
                    status: 'active',
                    createdAt: new Date().toISOString(),
                    storeId: user.uid === SUPER_ADMIN_UID ? defaultStoreId : undefined,
                };
                setUserProfile(newUserProfile);
                if (user.uid === SUPER_ADMIN_UID) {
                     setActiveStoreId(defaultStoreId);
                }
            }
        } else {
            setFirebaseUser(null);
            setUserProfile(null);
            if (!pathname.startsWith('/catalog') && !pathname.startsWith('/login')) {
                 router.push(`/catalog?storeId=${defaultStoreId}`);
            }
        }
        setIsLoadingSettings(false);
    });

    try {
      const storedPref = localStorage.getItem(CURRENCY_PREF_STORAGE_KEY);
      if (storedPref === 'secondary') setDisplayCurrency('secondary');
    } catch (error) {
      console.error("Could not access localStorage for currency preference", error);
    }
    
    return () => unsubscribe();
  }, [router, pathname]);


  const handleSetSettings = useCallback((newSettings: Partial<Settings>) => {
    setLocalSettings(prev => ({ ...(prev || defaultStore), ...newSettings }));
    toast({ title: "Configuración Guardada (DEMO)", description: "Tus cambios se han guardado localmente." });
  }, [toast]);

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

  const activeSymbol = displayCurrency === 'primary' ? (settings?.primaryCurrencySymbol || '$') : (settings?.secondaryCurrencySymbol || 'Bs.');
  const latestRate = currencyRates.length > 0 ? currencyRates[0].rate : 1;
  const activeRate = displayCurrency === 'primary' ? 1 : (latestRate > 0 ? latestRate : 1);
  
  const isPublicPath = pathname.startsWith('/catalog') || pathname === '/' || pathname.startsWith('/login');
  
  if (isLoadingSettings && !isPublicPath && isClient) {
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
    activeStoreId,
    switchStore,
    isLoadingSettings,
    userProfile,
    firebaseUser
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
