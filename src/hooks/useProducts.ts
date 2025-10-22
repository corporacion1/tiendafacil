import { useState, useEffect, useCallback, useRef } from 'react';
import { Product } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { useNetworkStatus } from './useNetworkStatus';

interface UseProductsReturn {
  products: Product[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  isPolling: boolean;
  lastUpdated: Date | null;
}

export const useProducts = (storeId?: string): UseProductsReturn => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const { toast } = useToast();
  const { isOnline, wasOffline } = useNetworkStatus();
  
  // Referencias para manejar el polling
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastFetchTimeRef = useRef<number>(0);
  const isActiveRef = useRef(true);
  const retryCountRef = useRef<number>(0);
  
  // Configuración del polling - productos cambian menos frecuentemente
  const POLLING_INTERVAL = 30000; // 30 segundos (menos frecuente que pedidos)
  const MIN_FETCH_INTERVAL = 5000; // Mínimo 5 segundos entre fetches
  const MAX_RETRIES = 3;

  const fetchProducts = useCallback(async (showLoadingState = true) => {
    if (!storeId || !isActiveRef.current) {
      setProducts([]);
      return;
    }

    // Evitar fetches muy frecuentes
    const now = Date.now();
    if (now - lastFetchTimeRef.current < MIN_FETCH_INTERVAL) {
      console.log('⏳ [Products] Skipping fetch - too frequent');
      return;
    }
    lastFetchTimeRef.current = now;

    if (showLoadingState) {
      setIsLoading(true);
    }
    setError(null);

    try {
      console.log('🔍 [Products] Fetching products for store:', storeId);
      
      const response = await fetch(`/api/products?storeId=${encodeURIComponent(storeId)}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('📦 [Products] Products fetched:', data.length);
      
      // Asegurar que los productos tienen la estructura correcta
      const formattedProducts: Product[] = Array.isArray(data) ? data.map(product => ({
        id: product.id,
        name: product.name,
        sku: product.sku,
        barcode: product.barcode,
        stock: product.stock,
        price: product.price,
        wholesalePrice: product.wholesalePrice,
        cost: product.cost,
        status: product.status,
        tax1: product.tax1,
        tax2: product.tax2,
        unit: product.unit,
        family: product.family,
        warehouse: product.warehouse,
        description: product.description,
        imageUrl: product.imageUrl,
        imageHint: product.imageHint,
        createdAt: product.createdAt,
        storeId: product.storeId,
        // Nuevos campos con valores por defecto para compatibilidad
        type: product.type || 'product',
        affectsInventory: product.affectsInventory !== undefined ? product.affectsInventory : true
      })) : [];

      // Solo actualizar si hay cambios reales
      setProducts(prevProducts => {
        const hasChanges = JSON.stringify(prevProducts) !== JSON.stringify(formattedProducts);
        if (hasChanges) {
          console.log('🔄 [Products] Products updated - changes detected');
          setLastUpdated(new Date());
          return formattedProducts;
        }
        return prevProducts;
      });

      // Reset retry counter on success
      retryCountRef.current = 0;
      
    } catch (err: any) {
      console.error('❌ [Products] Error fetching products:', err);
      setError(err.message);
      
      // Incrementar contador de reintentos
      retryCountRef.current += 1;
      
      // Solo mostrar toast en fetch inicial o después de varios reintentos
      if (showLoadingState || retryCountRef.current >= MAX_RETRIES) {
        toast({
          variant: "destructive",
          title: "Error al cargar productos",
          description: isOnline 
            ? "No se pudieron cargar los productos. Algunos pueden estar desactualizados."
            : "Sin conexión. Los productos se actualizarán cuando vuelvas a estar online."
        });
      }
      
      if (showLoadingState && products.length === 0) {
        setProducts([]);
      }
    } finally {
      if (showLoadingState) {
        setIsLoading(false);
      }
    }
  }, [storeId, toast, isOnline, products.length]);

  // Función para iniciar polling
  const startPolling = useCallback(() => {
    if (pollingIntervalRef.current || !storeId) {
      return;
    }

    console.log('🔄 [Products] Starting product polling...');
    setIsPolling(true);
    
    pollingIntervalRef.current = setInterval(() => {
      if (isActiveRef.current && isOnline) {
        fetchProducts(false); // No mostrar loading state en polling
      }
    }, POLLING_INTERVAL);
  }, [storeId, fetchProducts, isOnline]);

  // Función para detener polling
  const stopPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      console.log('⏹️ [Products] Stopping product polling...');
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
      setIsPolling(false);
    }
  }, []);

  // Fetch inicial
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Manejar reconexión de red
  useEffect(() => {
    if (isOnline && wasOffline && storeId) {
      console.log('🔄 [Products] Network reconnected - fetching products');
      retryCountRef.current = 0; // Reset retry counter
      fetchProducts(false);
    }
  }, [isOnline, wasOffline, storeId, fetchProducts]);

  // Auto-start polling cuando hay storeId
  useEffect(() => {
    if (storeId) {
      startPolling();
    } else {
      stopPolling();
    }

    return () => {
      stopPolling();
    };
  }, [storeId, startPolling, stopPolling]);

  // Cleanup al desmontar
  useEffect(() => {
    return () => {
      isActiveRef.current = false;
      stopPolling();
    };
  }, [stopPolling]);

  // Manejo de visibilidad de la página para optimizar polling
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        console.log('📱 [Products] Page hidden - stopping polling');
        stopPolling();
      } else if (storeId) {
        console.log('📱 [Products] Page visible - resuming polling');
        fetchProducts(false); // Fetch inmediato al volver
        startPolling();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [storeId, fetchProducts, startPolling, stopPolling]);

  return {
    products,
    isLoading,
    error,
    refetch: () => fetchProducts(true),
    isPolling,
    lastUpdated
  };
};