"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { usePathname } from 'next/navigation';
import { useToast } from "@/hooks/use-toast";
import { toastLogger } from "@/utils/toast-logger";
import type { CurrencyRate, Settings, UserProfile, Product, Sale, Purchase, Customer, Supplier, Unit, Family, Warehouse, Ad, CashSession, PendingOrder } from "@/lib/types";

type DisplayCurrency = 'primary' | 'secondary';

interface SettingsContextType {
  settings: Settings | null;
  updateSettings: (settings: Partial<Settings>) => void;
  saveSettings: (settings?: Partial<Settings>) => Promise<boolean>;
  displayCurrency: DisplayCurrency;
  toggleDisplayCurrency: () => void;
  activeCurrency: 'primary' | 'secondary';
  activeSymbol: string;
  activeRate: number;
  currencyRates: CurrencyRate[];
  setCurrencyRates: React.Dispatch<React.SetStateAction<CurrencyRate[]>>;

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
  pendingOrders: PendingOrder[];
  setPendingOrders: React.Dispatch<React.SetStateAction<PendingOrder[]>>;
  users: UserProfile[];
  setUsers: React.Dispatch<React.SetStateAction<UserProfile[]>>;

  activeStoreId: string;
  switchStore: (storeId: string) => void;
  isLoadingSettings: boolean;
  userProfile: UserProfile | null;
  setUserProfile: (user: UserProfile | null) => void;
  signOut: () => Promise<void>;
  seedDatabase: (storeId: string) => Promise<boolean>;
  fetchCurrencyRates: () => Promise<CurrencyRate | null>;
  saveCurrencyRate: (rate: number, userName: string) => Promise<boolean>;
  reloadProducts: () => Promise<void>;
  // Funciones de sincronización automática
  syncAfterSave: (storeId: string) => Promise<void>;
  syncProducts: () => Promise<void>;
}




const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

// localStorage solo para preferencias de usuario (tienda activa y moneda display)
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
  const pathname = usePathname();
  const { user: authUser, logout: authSignOut } = useAuth();

  // Main settings state
  const [settings, setLocalSettings] = useState<Settings | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [activeStoreId, setActiveStoreId] = useState<string>('');

  // Data states - TODOS VACÍOS
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [families, setFamilies] = useState<Family[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [ads, setAds] = useState<Ad[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [cashSessions, setCashSessions] = useState<CashSession[]>([]);
  const [pendingOrders, setPendingOrders] = useState<PendingOrder[]>([]);
  const [currencyRates, setCurrencyRates] = useState<CurrencyRate[]>([]);

  // UI states
  const [displayCurrency, setDisplayCurrency] = useState<DisplayCurrency>('primary');
  const [isLoading, setIsLoading] = useState(true);
  const [isClient, setIsClient] = useState(false);

  // Función para cargar datos desde MongoDB
  const loadDataFromMongoDB = useCallback(async (storeId: string) => {
    try {
      setIsLoading(true);

      console.log(`📥 Cargando datos desde MongoDB para tienda: ${storeId}`);

      // Primero cargar settings para obtener el businessType
      let storeSettings = await fetch(`/api/stores?id=${storeId}`)
        .then(res => res.ok ? res.json() : null)
        .catch(() => null);

      // Si no existe la tienda, crear una con datos por defecto
      if (!storeSettings) {
        console.log(`⚠️ Tienda ${storeId} no encontrada, creando con datos por defecto...`);

        const defaultStoreData = {
          id: storeId,
          storeId: storeId,
          name: "Tienda Facil DEMO",
          ownerIds: ["5QLaiiIr4mcGsjRXVGeGx50nrpk1"],
          businessType: "Tecnologia",
          address: "Av. Principal, Local 1, Ciudad",
          phone: "+58 212-555-1234",
          slogan: "¡Gracias por tu compra!",
          logoUrl: "/tienda_facil_logo.svg",
          status: 'active',
          primaryCurrencyName: "Dólar Americano",
          primaryCurrencySymbol: "$",
          secondaryCurrencyName: "Bolívar Digital",
          secondaryCurrencySymbol: "Bs.",
          saleSeries: "SALE",
          saleCorrelative: 1,
          tax1: 16,
          tax2: 0,
          whatsapp: "+584126915593",
          tiktok: "@tiendafacil",
          meta: "@tiendafacil",
          useDemoData: true,
        };

        try {
          const createResponse = await fetch('/api/stores', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(defaultStoreData)
          });

          if (createResponse.ok) {
            storeSettings = await createResponse.json();
            console.log(`✅ Tienda creada exitosamente: ${storeSettings.name}`);
          } else {
            console.error('❌ Error creando tienda por defecto');
            storeSettings = defaultStoreData; // Usar datos locales como fallback
          }
        } catch (error) {
          console.error('❌ Error creando tienda:', error);
          storeSettings = defaultStoreData; // Usar datos locales como fallback
        }
      }

      // Array de promesas para cargar todos los datos en paralelo
      const promises = [
        // Cargar productos
        fetch(`/api/products?storeId=${storeId}`)
          .then(res => res.ok ? res.json() : [])
          .catch(() => []),

        // Cargar ventas
        fetch(`/api/sales?storeId=${storeId}`)
          .then(res => res.ok ? res.json() : [])
          .catch(() => []),

        // Cargar compras
        fetch(`/api/purchases?storeId=${storeId}`)
          .then(res => res.ok ? res.json() : [])
          .catch(() => []),

        // Cargar clientes
        fetch(`/api/costumers?storeId=${storeId}`)
          .then(res => res.ok ? res.json() : [])
          .catch(() => []),

        // Cargar proveedores
        fetch(`/api/suppliers?storeId=${storeId}`)
          .then(res => res.ok ? res.json() : [])
          .catch(() => []),

        // Cargar unidades
        fetch(`/api/units?storeId=${storeId}`)
          .then(res => res.ok ? res.json() : [])
          .catch(() => []),

        // Cargar familias
        fetch(`/api/families?storeId=${storeId}`)
          .then(res => res.ok ? res.json() : [])
          .catch(() => []),

        // Cargar almacenes
        fetch(`/api/warehouses?storeId=${storeId}`)
          .then(res => res.ok ? res.json() : [])
          .catch(() => []),

        // Cargar anuncios basados en businessType
        storeSettings?.businessType
          ? fetch(`/api/ads?businessType=${storeSettings.businessType}`)
            .then(res => res.ok ? res.json() : [])
            .catch(() => [])
          : Promise.resolve([]),

        // Cargar usuarios
        fetch(`/api/users?storeId=${storeId}`)
          .then(res => res.ok ? res.json() : [])
          .catch(() => []),

        // Cargar sesiones de caja
        fetch(`/api/cashsessions?storeId=${storeId}`)
          .then(res => res.ok ? res.json() : [])
          .catch(() => []),

        // Cargar órdenes pendientes
        fetch(`/api/pending-orders?storeId=${storeId}`)
          .then(res => res.ok ? res.json() : [])
          .catch(() => []),

        // Cargar tasas de cambio
        fetch(`/api/currency-rates?storeId=${storeId}`)
          .then(res => res.ok ? res.json() : [])
          .catch(() => [])
      ];

      // Ejecutar todas las peticiones en paralelo
      const results = await Promise.allSettled(promises);

      // Procesar resultados
      const [
        productsResult, salesResult, purchasesResult,
        customersResult, suppliersResult, unitsResult, familiesResult,
        warehousesResult, adsResult, usersResult, cashSessionsResult,
        pendingOrdersResult, currencyRatesResult
      ] = results;

      // Contador de datos cargados
      let loadedCount = 0;

      // Actualizar estados con los datos recibidos (settings ya se cargaron antes)
      if (storeSettings) {
        setLocalSettings(storeSettings);
        loadedCount++;
      }

      if (productsResult.status === 'fulfilled' && productsResult.value) {
        setProducts(productsResult.value);
        loadedCount++;
      }

      if (salesResult.status === 'fulfilled' && salesResult.value) {
        setSales(salesResult.value);
        loadedCount++;
      }

      if (purchasesResult.status === 'fulfilled' && purchasesResult.value) {
        setPurchases(purchasesResult.value);
        loadedCount++;
      }

      if (customersResult.status === 'fulfilled' && customersResult.value) {
        setCustomers(customersResult.value);
        loadedCount++;
      }

      if (suppliersResult.status === 'fulfilled' && suppliersResult.value) {
        setSuppliers(suppliersResult.value);
        loadedCount++;
      }

      if (unitsResult.status === 'fulfilled' && unitsResult.value) {
        setUnits(unitsResult.value);
        loadedCount++;
      }

      if (familiesResult.status === 'fulfilled' && familiesResult.value) {
        setFamilies(familiesResult.value);
        loadedCount++;
      }

      if (warehousesResult.status === 'fulfilled' && warehousesResult.value) {
        setWarehouses(warehousesResult.value);
        loadedCount++;
      }

      if (adsResult.status === 'fulfilled' && adsResult.value) {
        setAds(adsResult.value);
        loadedCount++;
      }

      if (usersResult.status === 'fulfilled' && usersResult.value) {
        setUsers(usersResult.value);
        loadedCount++;
      }

      if (cashSessionsResult.status === 'fulfilled' && cashSessionsResult.value) {
        setCashSessions(cashSessionsResult.value);
        loadedCount++;
      }

      if (pendingOrdersResult.status === 'fulfilled' && pendingOrdersResult.value) {
        setPendingOrders(pendingOrdersResult.value);
        loadedCount++;
      }

      if (currencyRatesResult.status === 'fulfilled' && currencyRatesResult.value) {
        setCurrencyRates(currencyRatesResult.value);
        loadedCount++;
      }

      console.log(`✅ ${loadedCount}/14 tipos de datos cargados desde MongoDB`);

    } catch (error) {
      console.error('❌ Error cargando datos desde MongoDB:', error);
      toast({
        variant: "destructive",
        title: "Error de conexión",
        description: "No se pudieron cargar los datos desde la base de datos"
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]); // Solo incluir toast como dependencia

  // ✅ FUNCIÓN SEEDDATABASE CORREGIDA Y DEFINITIVA
  const seedDatabase = useCallback(async (storeId: string) => {
    try {
      console.log('🌱 Iniciando SEED COMPLETO en MongoDB para store:', storeId);

      const response = await fetch('/api/seed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storeId })
      });

      // MEJOR MANEJO DE ERRORES
      if (!response.ok) {
        let errorMessage = 'Error en API seed';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch {
          errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      console.log('✅ SEED COMPLETO exitoso:', result);

      // Recargar datos después del seed
      await loadDataFromMongoDB(storeId);
      return true;

    } catch (error) {
      console.error('❌ Error en seedDatabase:', error);
      return false;
    }
  }, [loadDataFromMongoDB]); // Incluir la dependencia correctamente

  // Cargar configuración inicial al montar el componente
  useEffect(() => {
    const initializeSettings = async () => {
      setIsClient(true);

      // Solo localStorage para preferencias de usuario (tienda activa y moneda display)
      const storedStoreId = localStorage.getItem(ACTIVE_STORE_ID_STORAGE_KEY) || 'ST-1234567890123';
      setActiveStoreId(storedStoreId);

      const storedCurrencyPref = localStorage.getItem(CURRENCY_PREF_STORAGE_KEY);
      if (storedCurrencyPref === 'secondary') {
        setDisplayCurrency('secondary');
      }

      // Cargar datos de configuración SOLO desde MongoDB
      await loadDataFromMongoDB(storedStoreId);
    };

    initializeSettings();
  }, []); // Array vacío para ejecutar solo una vez

  // Sincroniza userProfile con authUser
  useEffect(() => {
    if (authUser) {
      setUserProfile(authUser);
    } else {
      setUserProfile(null);
    }
  }, [authUser]);

  // ✅ FUNCIÓN PARA ACTUALIZAR SOLO EL ESTADO (SIN GUARDAR EN BD)
  const updateSettingsState = useCallback((newSettings: Partial<Settings>) => {
    setLocalSettings(prev => {
      if (!prev) {
        // Si prev es null, crear un objeto Settings básico con los valores requeridos
        const baseSettings: Settings = {
          id: newSettings.id || '',
          storeId: newSettings.storeId || '',
          name: newSettings.name || '',
          ownerIds: newSettings.ownerIds || [],
          status: newSettings.status || 'active',
          businessType: newSettings.businessType || ''
        };
        return { ...baseSettings, ...newSettings };
      }
      return { ...prev, ...newSettings };
    });
  }, []); // Removido settings de las dependencias

  // ✅ FUNCIÓN PARA GUARDAR EN BASE DE DATOS SOLAMENTE
  const saveSettingsToDatabase = useCallback(async (settingsToSave?: Partial<Settings>) => {
    try {
      console.log('💾 [Context] Guardando configuración en BD...');

      if (!settingsToSave && !settings) {
        throw new Error("No hay configuración para guardar");
      }

      const finalSettings = settingsToSave || settings;
      console.log('📤 [Context] Datos a enviar:', { storeId: activeStoreId, ...finalSettings });
      console.log('🏷️ [Context] Nombre específico a guardar:', finalSettings?.name, 'Longitud:', finalSettings?.name?.length);

      const res = await fetch('/api/stores', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeId: activeStoreId,
          ...finalSettings
        })
      });

      console.log('📥 [Context] Response status:', res.status);

      const responseData = await res.json();
      console.log('📥 [Context] Response data:', responseData);

      if (!res.ok) {
        throw new Error(responseData.error || "Error al guardar");
      }

      // Actualizar el estado local con los datos guardados desde el servidor
      console.log('🔄 [Context] Actualizando estado local con datos del servidor...');
      updateSettingsState(responseData);
      
      // Opcional: Recargar datos completos para asegurar sincronización
      // Esto es útil si hay campos calculados o transformados en el servidor
      setTimeout(() => {
        console.log('🔄 [Context] Recargando datos completos para sincronización...');
        loadDataFromMongoDB(activeStoreId);
      }, 100);
      
      console.log('✅ [Context] Configuración guardada y estado actualizado exitosamente');
      return true;

    } catch (error: unknown) {
      console.error('❌ [Context] Error saving settings:', error);
      throw error;
    }
  }, [activeStoreId]); // Removido settings de las dependencias

  // ✅ FUNCIÓN GUARDARCURRENCYRATE CORREGIDA Y DEFINITIVA
  const saveCurrencyRate = useCallback(async (rate: number, userName: string) => {
    try {
      console.log('💰 [Context] Guardando tasa:', { rate, userName, activeStoreId });

      const requestBody = {
        storeId: activeStoreId,
        rate,
        userId: userName
      };

      console.log('📤 [Context] Enviando request:', requestBody);

      const res = await fetch('/api/currency-rates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      console.log('📥 [Context] Response status:', res.status);

      const data = await res.json();
      console.log('📥 [Context] Response data:', data);

      if (!res.ok) {
        throw new Error(data.error || `HTTP ${res.status}: ${res.statusText}`);
      }

      // Actualizar estado local
      const newRate = {
        ...data.data,
        id: data.data._id || data.data.id || `rate-${Date.now()}`
      };

      console.log('✅ [Context] Actualizando estado local con:', newRate);

      setCurrencyRates(prev => [newRate, ...prev.filter(r => r.id !== newRate.id)]);
      return true;

    } catch (error) {
      console.error("❌ [Context] Error saving rate:", error);
      return false;
    }
  }, [activeStoreId]);

  const fetchCurrencyRates = useCallback(async () => {
    if (!activeStoreId || activeStoreId === '') {
      console.warn('activeStoreId no está disponible, omitiendo carga de tasas');
      return null;
    }

    try {
      const res = await fetch(`/api/currency-rates?storeId=${activeStoreId}`);

      // Verificar si la respuesta es JSON
      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('API returned non-JSON response');
      }

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      // Manejar diferentes estructuras de respuesta
      let rates = [];

      if (Array.isArray(data)) {
        // Si la API devuelve directamente un array
        rates = data;
      } else if (data.data && Array.isArray(data.data)) {
        // Si la API devuelve { data: [...] }
        rates = data.data;
      } else if (data.history && Array.isArray(data.history)) {
        // Si la API devuelve { history: [...] }
        rates = data.history;
      } else if (data.data?.history && Array.isArray(data.data.history)) {
        // Si la API devuelve { data: { history: [...] } }
        rates = data.data.history;
      }

      // Asegurar que cada tasa tenga un ID único
      const processedRates = rates.map((rate: Record<string, unknown>) => ({
        ...rate,
        id: (rate._id as string) || (rate.id as string) || `rate-${(rate.createdAt as string) || (rate.date as string) || Date.now()}`,
        rate: rate.rate || rate.value || 1,
        createdAt: rate.createdAt || rate.date || new Date().toISOString(),
        createdBy: rate.createdBy || rate.userId || 'Sistema'
      }));

      setCurrencyRates(processedRates);
      return data.current || data.data?.current || null;

    } catch (error) {
      console.error("Error fetching rates:", error);
      setCurrencyRates([]); // Asegurar que siempre sea array
      return null;
    }
  }, [activeStoreId]);

  const switchStore = useCallback(async (storeId: string) => {
    console.log('🏪 Cambiando a tienda:', storeId);
    setActiveStoreId(storeId);

    // Guardar preferencia de tienda activa en localStorage
    localStorage.setItem(ACTIVE_STORE_ID_STORAGE_KEY, storeId);

    // Recargar datos de configuración desde MongoDB
    await loadDataFromMongoDB(storeId);

    toast({ title: `Cambiado a la tienda ${storeId}` });
  }, [loadDataFromMongoDB, toast]);

  const toggleDisplayCurrency = useCallback(() => {
    const newPreference = displayCurrency === 'primary' ? 'secondary' : 'primary';
    setDisplayCurrency(newPreference);

    // Guardar preferencia de moneda display en localStorage
    localStorage.setItem(CURRENCY_PREF_STORAGE_KEY, newPreference);
  }, [displayCurrency]);

  const reloadProducts = useCallback(async () => {
    if (!activeStoreId) return;
    
    try {
      console.log('🔄 Recargando productos desde MongoDB...');
      const response = await fetch(`/api/products?storeId=${activeStoreId}`);
      if (response.ok) {
        const productsData = await response.json();
        setProducts(productsData);
        console.log('✅ Productos recargados:', productsData.length);
      }
    } catch (error) {
      console.error('❌ Error recargando productos:', error);
    }
  }, [activeStoreId]);

  const handleSetUserProfile = useCallback((user: UserProfile | null) => {
    setUserProfile(user);
  }, []);

  const handleSignOut = useCallback(async () => {
    if (authSignOut) {
      authSignOut();
      toast({ title: "Sesión cerrada" });
    }
  }, [authSignOut, toast]);

  const activeSymbol = displayCurrency === 'primary' ? (settings?.primaryCurrencySymbol || '$') : (settings?.secondaryCurrencySymbol || 'Bs.');
  const latestRate = currencyRates.length > 0 ? currencyRates[0].rate : 1;
  const activeRate = displayCurrency === 'primary' ? 1 : (latestRate > 0 ? latestRate : 1);

  const isPublicPath = pathname.startsWith('/catalog') || pathname === '/' || pathname.startsWith('/login');

  const contextValue: SettingsContextType = useMemo(() => {
    // Log context changes para debugging
    toastLogger.log({
      type: 'CONTEXT_CHANGE',
      contextData: {
        context: 'SettingsContext',
        activeStoreId,
        isLoading,
        productsCount: products.length,
        settingsExists: !!settings
      }
    });

    return {
    settings,
    updateSettings: updateSettingsState,
    saveSettings: saveSettingsToDatabase,
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
    pendingOrders,
    setPendingOrders,
    users,
    setUsers,
    activeStoreId,
    switchStore,
    isLoadingSettings: isLoading,
    userProfile,
    setUserProfile: handleSetUserProfile,
    signOut: handleSignOut,
    seedDatabase,
    fetchCurrencyRates,
    saveCurrencyRate,
    reloadProducts,
    // Funciones de sincronización automática
    syncAfterSave: loadDataFromMongoDB,
    syncProducts: reloadProducts
  }}, [
    settings,
    updateSettingsState,
    saveSettingsToDatabase,
    displayCurrency,
    toggleDisplayCurrency,
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
    pendingOrders,
    setPendingOrders,
    users,
    setUsers,
    activeStoreId,
    switchStore,
    isLoading,
    userProfile,
    handleSetUserProfile,
    handleSignOut,
    seedDatabase,
    fetchCurrencyRates,
    saveCurrencyRate,
    reloadProducts
  ]);

  if (isLoading && !isPublicPath && isClient) {
    return <AppLoadingScreen />;
  }

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