
"use client"

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useToast } from "@/hooks/use-toast";
import type { CurrencyRate, Settings, UserProfile, Product, Sale, Purchase, Customer, Supplier, Unit, Family, Warehouse } from '@/lib/types';
import { useUser as useAuthUser } from '@/firebase/auth/use-user';
import { useCollection, useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, doc, query, orderBy, limit } from 'firebase/firestore';
import { 
    defaultStore, 
    defaultStoreId, 
    mockProducts, 
    mockSales, 
    mockPurchases, 
    defaultCustomers, 
    defaultSuppliers, 
    initialUnits, 
    initialFamilies, 
    initialWarehouses,
    mockCurrencyRates
} from '@/lib/data';
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
  // Live data hooks replaced by context-provided data
  products: Product[];
  sales: Sale[];
  purchases: Purchase[];
  customers: Customer[];
  suppliers: Supplier[];
  units: Unit[];
  families: Family[];
  warehouses: Warehouse[];
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

  // --- LOCAL DEMO DATA STATE ---
  const [demoProducts, setDemoProducts] = useState<Product[]>([]);
  const [demoSales, setDemoSales] = useState<Sale[]>([]);
  const [demoPurchases, setDemoPurchases] = useState<Purchase[]>([]);
  const [demoCustomers, setDemoCustomers] = useState<Customer[]>([]);
  const [demoSuppliers, setDemoSuppliers] = useState<Supplier[]>([]);
  const [demoUnits, setDemoUnits] = useState<Unit[]>([]);
  const [demoFamilies, setDemoFamilies] = useState<Family[]>([]);
  const [demoWarehouses, setDemoWarehouses] = useState<Warehouse[]>([]);
  const [demoRates, setDemoRates] = useState<CurrencyRate[]>([]);
  
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
    // Only fetch if NOT in demo mode
    if (firestore && activeStoreId && !isAuthLoading && userProfile && !settings?.useDemoData) {
      return doc(firestore, 'stores', activeStoreId);
    }
    return null;
  }, [firestore, activeStoreId, isAuthLoading, userProfile, settings?.useDemoData]);

  const { data: storeSettings, isLoading: isLoadingStoreSettings } = useDoc<Settings>(storeDocRef);

  const ratesCollectionRef = useMemoFirebase(() => {
    // Only fetch if NOT in demo mode
    if (firestore && activeStoreId && userProfile && !settings?.useDemoData) {
        return query(
          collection(firestore, 'stores', activeStoreId, 'currencyRates'), 
          orderBy('date', 'desc'), 
          limit(30)
        );
    }
    return null;
  }, [firestore, activeStoreId, userProfile, settings?.useDemoData]);

  const { data: firestoreRates } = useCollection<CurrencyRate>(ratesCollectionRef);

  useEffect(() => {
    if (isAuthLoading) return;

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

    // Logic to decide between Firestore data and demo data
    if (storeSettings) {
      if(storeSettings.useDemoData) {
        setSettingsState(defaultStore);
        setDemoProducts(mockProducts.map(p => ({ ...p, storeId: activeStoreId, createdAt: new Date().toISOString() })));
        setDemoSales(mockSales.map(s => ({ ...s, storeId: activeStoreId })));
        setDemoPurchases(mockPurchases.map(p => ({ ...p, storeId: activeStoreId })));
        setDemoCustomers(defaultCustomers.map(c => ({...c, storeId: activeStoreId})));
        setDemoSuppliers(defaultSuppliers.map(s => ({...s, storeId: activeStoreId})));
        setDemoUnits(initialUnits.map(u => ({...u, storeId: activeStoreId})));
        setDemoFamilies(initialFamilies.map(f => ({...f, storeId: activeStoreId})));
        setDemoWarehouses(initialWarehouses.map(w => ({...w, storeId: activeStoreId})));
        setDemoRates(mockCurrencyRates);
      } else {
        setSettingsState(storeSettings);
      }
      setIsReady(true);
    } else if (!isLoadingStoreSettings && !storeSettings && userProfile) {
      // Fallback to default demo store if no settings are found
      setSettingsState(defaultStore);
      setDemoProducts(mockProducts.map(p => ({ ...p, storeId: activeStoreId, createdAt: new Date().toISOString() })));
      setDemoSales(mockSales.map(s => ({ ...s, storeId: activeStoreId })));
      setDemoPurchases(mockPurchases.map(p => ({ ...p, storeId: activeStoreId })));
      setDemoCustomers(defaultCustomers.map(c => ({...c, storeId: activeStoreId})));
      setDemoSuppliers(defaultSuppliers.map(s => ({...s, storeId: activeStoreId})));
      setDemoUnits(initialUnits.map(u => ({...u, storeId: activeStoreId})));
      setDemoFamilies(initialFamilies.map(f => ({...f, storeId: activeStoreId})));
      setDemoWarehouses(initialWarehouses.map(w => ({...w, storeId: activeStoreId})));
      setDemoRates(mockCurrencyRates);
      setIsReady(true);
    }

  }, [isAuthLoading, needsProfileCreation, userProfile, storeSettings, isLoadingStoreSettings, pathname, router, activeStoreId]);

  
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
  
  const useDemo = settings?.useDemoData ?? true;

  const currencyRates = useDemo ? demoRates : (firestoreRates || []);
  const activeCurrency = displayCurrency;
  const activeSymbol = activeCurrency === 'primary' ? (settings?.primaryCurrencySymbol || '$') : (settings?.secondaryCurrencySymbol || 'Bs.');
  const latestRate = (currencyRates && currencyRates.length > 0) ? currencyRates[0].rate : 1;
  const activeRate = activeCurrency === 'primary' ? 1 : (latestRate > 0 ? latestRate : 1);
  
  // Conditionally use live data or demo data
  const { data: liveProducts } = useCollection<Product>(useMemoFirebase(() => !useDemo && firestore ? query(collection(firestore, 'products'), where('storeId', '==', activeStoreId)) : null, [firestore, activeStoreId, useDemo]));
  const { data: liveSales } = useCollection<Sale>(useMemoFirebase(() => !useDemo && firestore ? query(collection(firestore, 'sales'), where('storeId', '==', activeStoreId)) : null, [firestore, activeStoreId, useDemo]));
  const { data: livePurchases } = useCollection<Purchase>(useMemoFirebase(() => !useDemo && firestore ? query(collection(firestore, 'purchases'), where('storeId', '==', activeStoreId)) : null, [firestore, activeStoreId, useDemo]));
  const { data: liveCustomers } = useCollection<Customer>(useMemoFirebase(() => !useDemo && firestore ? query(collection(firestore, 'customers'), where('storeId', '==', activeStoreId)) : null, [firestore, activeStoreId, useDemo]));
  const { data: liveSuppliers } = useCollection<Supplier>(useMemoFirebase(() => !useDemo && firestore ? query(collection(firestore, 'suppliers'), where('storeId', '==', activeStoreId)) : null, [firestore, activeStoreId, useDemo]));
  const { data: liveUnits } = useCollection<Unit>(useMemoFirebase(() => !useDemo && firestore ? query(collection(firestore, 'units'), where('storeId', '==', activeStoreId)) : null, [firestore, activeStoreId, useDemo]));
  const { data: liveFamilies } = useCollection<Family>(useMemoFirebase(() => !useDemo && firestore ? query(collection(firestore, 'families'), where('storeId', '==', activeStoreId)) : null, [firestore, activeStoreId, useDemo]));
  const { data: liveWarehouses } = useCollection<Warehouse>(useMemoFirebase(() => !useDemo && firestore ? query(collection(firestore, 'warehouses'), where('storeId', '==', activeStoreId)) : null, [firestore, activeStoreId, useDemo]));


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
    currencyRates,
    activeStoreId,
    switchStore,
    isLoadingSettings: !isReady,
    userProfile,
    products: useDemo ? demoProducts : (liveProducts || []),
    sales: useDemo ? demoSales : (liveSales || []),
    purchases: useDemo ? demoPurchases : (livePurchases || []),
    customers: useDemo ? demoCustomers : (liveCustomers || []),
    suppliers: useDemo ? demoSuppliers : (liveSuppliers || []),
    units: useDemo ? demoUnits : (liveUnits || []),
    families: useDemo ? demoFamilies : (liveFamilies || []),
    warehouses: useDemo ? demoWarehouses : (liveWarehouses || []),
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
