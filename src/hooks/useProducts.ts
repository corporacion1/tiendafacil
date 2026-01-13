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

    // Evitar fetches muy frecuentes (a menos que se fuerce)
    const now = Date.now();
    if (!showLoadingState && now - lastFetchTimeRef.current < MIN_FETCH_INTERVAL) {
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

      const response = await fetch(`/api/products?storeId=${encodeURIComponent(storeId)}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('📦 [Products] Products fetched:', data.length);

      // Asegurar que los productos tienen la estructura correcta
      const formattedProducts: Product[] = Array.isArray(data) ? data.map(product => {
        // CRÍTICO: Incluir todas las propiedades del producto, especialmente images
        const formatted: Product = {
          id: product.id,
          name: product.name,
          sku: product.sku,
          barcode: product.barcode,
          stock: product.stock || 0,
          price: product.price || 0,
          wholesalePrice: product.wholesalePrice,
          cost: product.cost,
          status: product.status || 'active',
          tax1: product.tax1 || false,
          tax2: product.tax2 || false,
          unit: product.unit,
          family: product.family,
          warehouse: product.warehouse,
          description: product.description,
          imageUrl: product.imageUrl,
          imageHint: product.imageHint,
          createdAt: product.createdAt || new Date().toISOString(),
          storeId: product.storeId,
          // CRÍTICO: Incluir images array y primaryImageIndex - estos campos son esenciales
          images: product.images || [],
          primaryImageIndex: product.primaryImageIndex !== undefined ? product.primaryImageIndex : 0,
          // Nuevos campos con valores por defecto para compatibilidad
          type: product.type || 'product',
          affectsInventory: product.affectsInventory !== undefined ? product.affectsInventory : true
        };

        // Debug: Verificar si las imágenes están presentes
        if (formatted.images && formatted.images.length > 0) {
          console.log(`✅ [Products] Product ${formatted.name} has ${formatted.images.length} images`);
        } else if (formatted.imageUrl) {
          console.log(`⚠️ [Products] Product ${formatted.name} has legacy imageUrl but no images array`);
        } else {
          console.log(`❌ [Products] Product ${formatted.name} has NO images`);
        }

        return formatted;
      }) : [];

      // Actualizar productos
      setProducts(formattedProducts);
      setLastUpdated(new Date());

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

      // Si falla la carga inicial y no hay productos, asegurar que el estado quede limpio
      if (showLoadingState) {
        setProducts(prev => prev.length === 0 ? [] : prev);
      }
    } finally {
      if (showLoadingState) {
        setIsLoading(false);
      }
    }
  }, [storeId, toast, isOnline]);

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

  // Fetch inicial y reset al cambiar de tienda
  useEffect(() => {
    if (!storeId) return;

    console.log('🔄 [Products] StoreId changed, resetting products state:', storeId);

    // IMPORTANTE: Activar loading inmediatamente para evitar que el catálogo piense que no hay productos
    setIsLoading(true);
    setProducts([]);

    // Reset temporal para permitir fetch inmediato
    lastFetchTimeRef.current = 0;

    fetchProducts(true);
  }, [fetchProducts, storeId]);

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