
"use client"

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useToast } from "@/hooks/use-toast";
import { doc, collection, getDocs, limit, query, where } from 'firebase/firestore';
import { useDoc, useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import type { CurrencyRate, Settings, UserProfile, Product } from '@/lib/types';
import { defaultStore, defaultUsers, defaultStoreId, mockCurrencyRates, initialFamilies, initialUnits, initialWarehouses, mockProducts } from '@/lib/data';
import { useUser as useAuthUserHook } from '@/firebase/provider';

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
  useDemoData: boolean;
  setUseDemoData: (useDemo: boolean) => Promise<boolean>;
  families: any[];
  units: any[];
  warehouses: any[];
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

const CURRENCY_PREF_STORAGE_KEY = 'tienda_facil_currency_pref';
const ACTIVE_STORE_ID_STORAGE_KEY = 'tienda_facil_active_store_id';
const DEMO_DATA_FLAG_KEY = 'tienda_facil_use_demo_data';

export const SettingsProvider = ({ children }: { children: React.ReactNode }) => {
  const { toast } = useToast();
  const router = useRouter();
  const pathname = usePathname();
  const firestore = useFirestore();

  const { user: authUser, isUserLoading } = useAuthUserHook();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  const [activeStoreId, setActiveStoreId] = useState<string>(defaultStoreId);
  const [displayCurrency, setDisplayCurrency] = useState<DisplayCurrency>('primary');
  const [useDemoData, setUseDemoDataState] = useState<boolean>(true);

  useEffect(() => {
    try {
      const demoFlag = localStorage.getItem(DEMO_DATA_FLAG_KEY);
      setUseDemoDataState(demoFlag === null ? true : demoFlag === 'true');
    } catch (error) {
      console.error("Could not access localStorage for demo flag", error);
      setUseDemoDataState(true);
    }
  }, []);

  // Firestore hooks - Now conditional based on useDemoData
  const storeRef = useMemoFirebase(() => (!useDemoData && firestore) ? doc(firestore, 'stores', activeStoreId) : null, [firestore, activeStoreId, useDemoData]);
  const { data: settingsFromDB, isLoading: isLoadingSettingsDoc } = useDoc<Settings>(storeRef);

  const ratesRef = useMemoFirebase(() => (!useDemoData && firestore) ? collection(firestore, 'stores', activeStoreId, 'currencyRates') : null, [firestore, activeStoreId, useDemoData]);
  const { data: ratesFromDB } = useCollection<CurrencyRate>(ratesRef);

  const familiesRef = useMemoFirebase(() => (!useDemoData && firestore) ? query(collection(firestore, 'families'), where('storeId', '==', activeStoreId)) : null, [firestore, activeStoreId, useDemoData]);
  const { data: familiesFromDB } = useCollection(familiesRef);

  const unitsRef = useMemoFirebase(() => (!useDemoData && firestore) ? query(collection(firestore, 'units'), where('storeId', '==', activeStoreId)) : null, [firestore, activeStoreId, useDemoData]);
  const { data: unitsFromDB } = useCollection(unitsRef);
  
  const warehousesRef = useMemoFirebase(() => (!useDemoData && firestore) ? query(collection(firestore, 'warehouses'), where('storeId', '==', activeStoreId)) : null, [firestore, activeStoreId, useDemoData]);
  const { data: warehousesFromDB } = useCollection(warehousesRef);
  
  // Data sources are now properly conditional
  const settings = useMemo(() => useDemoData ? defaultStore : settingsFromDB, [useDemoData, settingsFromDB]);
  const currencyRates = useMemo(() => useDemoData ? mockCurrencyRates.map((r,i)=>({...r, id: `rate-${i}`})) : (ratesFromDB || []), [useDemoData, ratesFromDB]);
  const families = useMemo(() => useDemoData ? initialFamilies : (familiesFromDB || []), [useDemoData, familiesFromDB]);
  const units = useMemo(() => useDemoData ? initialUnits : (unitsFromDB || []), [useDemoData, unitsFromDB]);
  const warehouses = useMemo(() => useDemoData ? initialWarehouses : (warehousesFromDB || []), [useDemoData, warehousesFromDB]);

  const setUseDemoData = useCallback(async (useDemo: boolean): Promise<boolean> => {
      if (useDemo === false) {
          if (!firestore || !activeStoreId) {
              toast({ variant: 'destructive', title: 'Error', description: 'La conexión a la base de datos no está lista.' });
              return false;
          }
          
          // The settings object will be from local data when switching, so we check it directly
          if (!settings || !settings.name || !settings.primaryCurrencySymbol) {
              toast({ variant: 'destructive', title: 'Configuración Incompleta', description: 'Por favor, completa el nombre de la tienda y el símbolo de la moneda principal antes de salir del modo demo.' });
              return false;
          }

          const ratesQuery = query(collection(firestore, 'stores', activeStoreId, 'currencyRates'), limit(1));
          const ratesSnapshot = await getDocs(ratesQuery);
          if (ratesSnapshot.empty) {
              toast({ variant: 'destructive', title: 'Falta Tasa de Cambio', description: 'Debes registrar al menos una tasa de cambio para la moneda secundaria.' });
              return false;
          }

          const productsQuery = query(collection(firestore, 'products'), where('storeId', '==', activeStoreId), limit(1));
          const productsSnapshot = await getDocs(productsQuery);
          if (productsSnapshot.empty) {
              toast({ variant: 'destructive', title: 'No Hay Productos', description: 'Debes crear al menos un producto antes de salir del modo demo.' });
              return false;
          }
      }

      try {
          localStorage.setItem(DEMO_DATA_FLAG_KEY, useDemo.toString());
          setUseDemoDataState(useDemo);
          toast({ title: useDemo ? 'Modo Demo Activado' : 'Modo Demo Desactivado', description: 'La aplicación ahora leerá los datos correspondientes.' });
          setTimeout(() => window.location.reload(), 500);
          return true;
      } catch (error) {
          console.error("Could not access localStorage for demo flag", error);
          toast({ variant: 'destructive', title: 'Error de Almacenamiento' });
          return false;
      }
  }, [firestore, activeStoreId, toast, settings]);

  useEffect(() => {
    if (!isUserLoading && authUser) {
        // Find a matching local profile to get the role and status.
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
     if (!isUserLoading && !authUser && !pathname.startsWith('/catalog') && !pathname.startsWith('/login')) {
      router.push('/catalog');
    }
  }, [isUserLoading, authUser, pathname, router]);

  const handleSetSettings = (newSettings: Settings) => {
    if(activeStoreId && firestore) {
      const settingsDoc = doc(firestore, 'stores', activeStoreId);
      setDocumentNonBlocking(settingsDoc, newSettings, { merge: true });
    }
    toast({ title: "Configuración Guardada", description: "Los cambios se están guardando en la nube." });
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
  const latestRate = (currencyRates && currencyRates.length > 0) ? currencyRates[0].rate : 1;
  const activeRate = activeCurrency === 'primary' ? 1 : (latestRate > 0 ? latestRate : 1);

  const isLoading = isUserLoading || (!useDemoData && isLoadingSettingsDoc);

  const contextValue: SettingsContextType = {
    settings, 
    setSettings: handleSetSettings, 
    displayCurrency, 
    toggleDisplayCurrency, 
    activeCurrency, 
    activeSymbol, 
    activeRate, 
    currencyRates,
    setCurrencyRates: () => {},
    activeStoreId,
    switchStore,
    isLoadingSettings: isLoading,
    userProfile,
    useDemoData,
    setUseDemoData,
    families,
    units,
    warehouses
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
