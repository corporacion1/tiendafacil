
"use client"

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useToast } from "@/hooks/use-toast";
import type { CurrencyRate, Settings, UserProfile, Product, Sale, Purchase, Customer, Supplier, Unit, Family, Warehouse, Ad, CashSession } from "@/lib/types";
import { 
    defaultStore as initialStore, 
    defaultUsers as initialUsers,
    mockCurrencyRates as initialCurrencyRates,
    mockProducts as initialProducts,
    mockSales as initialSales,
    mockPurchases as initialPurchases,
    defaultCustomers as initialCustomers,
    defaultSuppliers as initialSuppliers,
    initialUnits,
    initialFamilies,
    initialWarehouses,
    mockAds as initialAds,
    mockCashSessions as initialCashSessions,
    defaultStoreId
} from '@/lib/data';
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
  
  // Shared Data States
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  sales: Sale[];
  setSales: React.Dispatch<React.SetStateAction<Sale[]>>;
  purchases: Purchase[];
  setPurchases: React.Dispatch<React.SetStateAction<Purchase[]>>;
  customers: Customer[];
  setCustomers: React.Dispatch<React.SetStateAction<Customer[]>>;
  suppliers: Supplier[];
  setSuppliers: React.Dispatch<React.SetStateAction<Supplier[]>>;
  units: Unit[];
  setUnits: React.Dispatch<React.SetStateAction<Unit[]>>;
  families: Family[];
  setFamilies: React.Dispatch<React.SetStateAction<Family[]>>;
  warehouses: Warehouse[];
  setWarehouses: React.Dispatch<React.SetStateAction<Warehouse[]>>;
  ads: Ad[];
  setAds: React.Dispatch<React.SetStateAction<Ad[]>>;
  cashSessions: CashSession[];
  setCashSessions: React.Dispatch<React.SetStateAction<CashSession[]>>;
  
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

  // Main settings state
  const [settings, setLocalSettings] = useState<Settings | null>(initialStore);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [activeStoreId, setActiveStoreId] = useState<string>(defaultStoreId);
  
  // Data states
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [sales, setSales] = useState<Sale[]>(initialSales);
  const [purchases, setPurchases] = useState<Purchase[]>(initialPurchases);
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers);
  const [suppliers, setSuppliers] = useState<Supplier[]>(initialSuppliers);
  const [units, setUnits] = useState<Unit[]>(initialUnits);
  const [families, setFamilies] = useState<Family[]>(initialFamilies);
  const [warehouses, setWarehouses] = useState<Warehouse[]>(initialWarehouses);
  const [ads, setAds] = useState<Ad[]>(initialAds);
  const [cashSessions, setCashSessions] = useState<CashSession[]>(initialCashSessions);
  const [currencyRates, setCurrencyRates] = useState<CurrencyRate[]>(initialCurrencyRates);
  
  // UI states
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
        const existingUser = initialUsers.find(u => u.uid === firebaseUser.uid);
        if (existingUser) {
          setUserProfile(existingUser);
        } else {
          const newUserProfile: UserProfile = {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
            photoURL: firebaseUser.photoURL,
            role: 'user',
            status: 'active',
            storeId: defaultStoreId, 
            createdAt: new Date().toISOString(),
          };
          setUserProfile(newUserProfile);
        }
      } else {
        setUserProfile(null);
      }
      setIsLoading(false);
    }
  }, [firebaseUser, isLoadingAuth]);

  const handleSetSettings = useCallback((newSettings: Partial<Settings>) => {
    setLocalSettings(prev => ({ ...(prev || initialStore), ...newSettings }));
  }, []);

  const switchStore = (storeId: string) => {
    setActiveStoreId(storeId);
    localStorage.setItem(ACTIVE_STORE_ID_STORAGE_KEY, storeId);
    toast({ title: `Cambiado a la tienda ${storeId}` });
    window.location.reload();
  };

  const toggleDisplayCurrency = () => {
    const newPreference = displayCurrency === 'primary' ? 'secondary' : 'primary';
    setDisplayCurrency(newPreference);
    localStorage.setItem(CURRENCY_PREF_STORAGE_KEY, newPreference);
  };
  
  const handleSetUserProfile = (user: UserProfile | null) => {
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
    products,
    setProducts,
    sales,
    setSales,
    purchases,
    setPurchases,
    customers,
    setCustomers,
    suppliers,
    setSuppliers,
    units,
    setUnits,
    families,
    setFamilies,
    warehouses,
    setWarehouses,
    ads,
    setAds,
    cashSessions,
    setCashSessions,
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
