
"use client"

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useToast } from "@/hooks/use-toast";
import { doc, collection, getDocs, limit, query, where, getDoc } from 'firebase/firestore';
import { useDoc, useCollection, useFirestore, useMemoFirebase, useAuth, useUser as useAuthUserHook } from '@/firebase';
import type { CurrencyRate, Settings, UserProfile, Product } from '@/lib/types';
import { defaultStore, defaultStoreId, mockCurrencyRates, initialFamilies, initialUnits, initialWarehouses } from '@/lib/data';
import { useUser as useUserHook } from '@/firebase/auth/use-user';

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
  const auth = useAuth(); // Use the hook to get the auth instance
  const firestore = useFirestore(); // Use the hook to get the firestore instance
  const { user: authUser } = useAuthUserHook(); // Get the raw auth user

  const [useDemoData, setUseDemoDataState] = useState<boolean>(true);
  const [isLoadingPersistence, setIsLoadingPersistence] = useState(true);
  
  const [activeStoreId, setActiveStoreId] = useState<string>(defaultStoreId);
  const [displayCurrency, setDisplayCurrency] = useState<DisplayCurrency>('primary');
  
  useEffect(() => {
    try {
      const demoFlag = localStorage.getItem(DEMO_DATA_FLAG_KEY);
      const currencyPref = localStorage.getItem(CURRENCY_PREF_STORAGE_KEY) as DisplayCurrency | null;
      const storedStoreId = localStorage.getItem(ACTIVE_STORE_ID_STORAGE_KEY);

      setUseDemoDataState(demoFlag === null ? true : demoFlag === 'true');
      if (currencyPref) setDisplayCurrency(currencyPref);
      if (storedStoreId) setActiveStoreId(storedStoreId);
      
    } catch (error) {
      console.warn("Could not access localStorage. Defaulting to demo mode.", error);
      setUseDemoDataState(true);
    } finally {
      setIsLoadingPersistence(false);
    }
  }, []);

  const { user: userProfile, isUserLoading, needsProfileCreation } = useUserHook();

  // Determine if we are on a public page
  const isPublicPage = useMemo(() => pathname === '/' || pathname.startsWith('/catalog'), [pathname]);
  
  // Memoize Firestore references, but only if not on a public page and not in demo mode
  const canFetchFirestoreData = !isPublicPage && !useDemoData;
  
  const storeRef = useMemoFirebase(() => (canFetchFirestoreData && firestore) ? doc(firestore, 'stores', activeStoreId) : null, [canFetchFirestoreData, firestore, activeStoreId]);
  const ratesRef = useMemoFirebase(() => (canFetchFirestoreData && firestore) ? collection(firestore, 'stores', activeStoreId, 'currencyRates') : null, [canFetchFirestoreData, firestore, activeStoreId]);
  const familiesRef = useMemoFirebase(() => (canFetchFirestoreData && firestore) ? query(collection(firestore, 'families'), where('storeId', '==', activeStoreId)) : null, [canFetchFirestoreData, firestore, activeStoreId]);
  const unitsRef = useMemoFirebase(() => (canFetchFirestoreData && firestore) ? query(collection(firestore, 'units'), where('storeId', '==', activeStoreId)) : null, [canFetchFirestoreData, firestore, activeStoreId]);
  const warehousesRef = useMemoFirebase(() => (canFetchFirestoreData && firestore) ? query(collection(firestore, 'warehouses'), where('storeId', '==', activeStoreId)) : null, [canFetchFirestoreData, firestore, activeStoreId]);
  
  const { data: settingsFromDB, isLoading: isLoadingSettingsDoc } = useDoc<Settings>(storeRef);
  const { data: ratesFromDB } = useCollection<CurrencyRate>(ratesRef);
  const { data: familiesFromDB } = useCollection(familiesRef);
  const { data: unitsFromDB } = useCollection(unitsRef);
  const { data: warehousesFromDB } = useCollection(warehousesRef);

  const settings = useMemo(() => (useDemoData || isPublicPage) ? defaultStore : settingsFromDB, [useDemoData, isPublicPage, settingsFromDB]);
  const currencyRates = useMemo(() => (useDemoData || isPublicPage) ? mockCurrencyRates.map((r,i)=>({...r, id: `rate-${i}`})) : (ratesFromDB || []), [useDemoData, isPublicPage, ratesFromDB]);
  const families = useMemo(() => (useDemoData || isPublicPage) ? initialFamilies : (familiesFromDB || []), [useDemoData, isPublicPage, familiesFromDB]);
  const units = useMemo(() => (useDemoData || isPublicPage) ? initialUnits : (unitsFromDB || []), [useDemoData, isPublicPage, unitsFromDB]);
  const warehouses = useMemo(() => (useDemoData || isPublicPage) ? initialWarehouses : (warehousesFromDB || []), [useDemoData, isPublicPage, warehousesFromDB]);
  
  const isLoading = isLoadingPersistence || isUserLoading || (!useDemoData && !isPublicPage && isLoadingSettingsDoc);

  useEffect(() => {
    if (isLoading || isPublicPage) return;

    if (userProfile?.role === 'superAdmin' && localStorage.getItem(ACTIVE_STORE_ID_STORAGE_KEY)) {
      setActiveStoreId(localStorage.getItem(ACTIVE_STORE_ID_STORAGE_KEY)!);
    } else if (userProfile?.storeId) {
      setActiveStoreId(userProfile.storeId);
      try {
        localStorage.setItem(ACTIVE_STORE_ID_STORAGE_KEY, userProfile.storeId);
      } catch (e) { console.warn('localStorage not available for storeId') }
    }

  }, [isLoading, isPublicPage, userProfile]);

  const setUseDemoData = useCallback(async (useDemo: boolean): Promise<boolean> => {
      if (useDemo === false) {
          if (!firestore || !authUser) {
              toast({ variant: 'destructive', title: 'Error', description: 'La conexión a la base de datos o la autenticación no está lista.' });
              return false;
          }
          
          try {
            const userDocSnap = await getDoc(doc(firestore, 'users', authUser.uid));
            if (!userDocSnap.exists() || !userDocSnap.data()?.storeId) {
                toast({ variant: 'destructive', title: 'Configuración Incompleta', description: 'Tu perfil de usuario no está completo o no tienes una tienda asignada.' });
                return false;
            }
            const userStoreId = userDocSnap.data().storeId;
            const storeDoc = await getDoc(doc(firestore, 'stores', userStoreId));

            if (!storeDoc.exists()) {
                toast({ variant: 'destructive', title: 'Configuración Incompleta', description: 'No se encontró la configuración de tu tienda en la base de datos.' });
                return false;
            }

            const liveSettings = storeDoc.data() as Settings;

            const validationChecks = [
                { check: !!liveSettings.name, message: 'El nombre de la tienda no está configurado.' },
                { check: !!liveSettings.address, message: 'La dirección de la tienda no está configurada.' },
                { check: !!liveSettings.phone, message: 'El teléfono de la tienda no está configurado.' },
                { check: !!liveSettings.businessType, message: 'El tipo de negocio no está configurado.' },
                { check: async () => { const snapshot = await getDocs(query(collection(firestore, 'stores', userStoreId, 'currencyRates'), limit(1))); return !snapshot.empty; }, message: 'Debes registrar al menos una tasa de cambio.' },
            ];

            for (const { check, message } of validationChecks) {
                const isValid = typeof check === 'function' ? await check() : check;
                if (!isValid) {
                    toast({ variant: 'destructive', title: 'Configuración Incompleta', description: message });
                    return false;
                }
            }
          } catch (error) {
              console.error("Validation error:", error);
              toast({ variant: 'destructive', title: 'Error de Validación', description: 'No se pudo verificar la configuración de la tienda.' });
              return false;
          }
      }

      try {
          localStorage.setItem(DEMO_DATA_FLAG_KEY, useDemo.toString());
          setUseDemoDataState(useDemo);
          toast({ title: useDemo ? 'Modo Demo Activado' : 'Modo Demo Desactivado', description: 'La aplicación ahora leerá los datos correspondientes. La página se recargará.' });
          setTimeout(() => window.location.reload(), 1500);
          return true;
      } catch (error) {
          console.error("Could not access localStorage for demo flag", error);
          toast({ variant: 'destructive', title: 'Error de Almacenamiento' });
          return false;
      }
  }, [firestore, authUser, toast]);

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
      console.warn("Could not access localStorage to set currency preference", error);
    }
  };

  const activeCurrency = displayCurrency;
  const activeSymbol = activeCurrency === 'primary' ? (settings?.primaryCurrencySymbol || '$') : (settings?.secondaryCurrencySymbol || 'Bs.');
  const latestRate = (currencyRates && currencyRates.length > 0) ? currencyRates.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0].rate : 1;
  const activeRate = activeCurrency === 'primary' ? 1 : (latestRate > 0 ? latestRate : 1);

  const contextValue: SettingsContextType = {
    settings, 
    setSettings: () => {}, 
    displayCurrency, 
    toggleDisplayCurrency, 
    activeCurrency, 
    activeSymbol, 
    activeRate, 
    currencyRates,
    activeStoreId,
    switchStore,
    isLoadingSettings: isLoading,
    userProfile,
    useDemoData,
    setUseDemoData,
    families,
    units,
    warehouses,
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
