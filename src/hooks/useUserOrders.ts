import { useState, useEffect, useCallback, useRef } from 'react';
import { PendingOrder } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { useNetworkStatus } from './useNetworkStatus';

interface UseUserOrdersReturn {
  orders: PendingOrder[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  isPolling: boolean;
  startPolling: () => void;
  stopPolling: () => void;
}

export const useUserOrders = (userEmail?: string, storeId?: string): UseUserOrdersReturn => {
  const [orders, setOrders] = useState<PendingOrder[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const { toast } = useToast();
  const { isOnline, wasOffline } = useNetworkStatus();

  // Referencias para manejar el polling
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastFetchTimeRef = useRef<number>(0);
  const isActiveRef = useRef(true);
  const retryCountRef = useRef<number>(0);

  // Configuración del polling
  const POLLING_INTERVAL = 10000; // 10 segundos
  const MIN_FETCH_INTERVAL = 2000; // Mínimo 2 segundos entre fetches
  const MAX_RETRIES = 3;

  const fetchOrders = useCallback(async (showLoadingState = true) => {
    // CORREGIDO: No limpiar pedidos si faltan parámetros, solo no hacer fetch
    if (!userEmail || !storeId || !isActiveRef.current) {
      console.log('⏭️ Skipping fetch - missing parameters or inactive', { userEmail: !!userEmail, storeId: !!storeId, isActive: isActiveRef.current });
      return;
    }

    // Evitar fetches muy frecuentes
    const now = Date.now();
    if (now - lastFetchTimeRef.current < MIN_FETCH_INTERVAL) {
      console.log('⏳ Skipping fetch - too frequent');
      return;
    }
    lastFetchTimeRef.current = now;

    if (showLoadingState) {
      setIsLoading(true);
    }
    setError(null);

    try {
      console.log('🔍 Fetching orders for user:', userEmail, 'store:', storeId);

      const response = await fetch(`/api/orders?customerEmail=${encodeURIComponent(userEmail)}&storeId=${encodeURIComponent(storeId)}`);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('📦 Orders fetched:', data.length);

      // Convertir formato de respuesta a PendingOrder si es necesario
      const formattedOrders: PendingOrder[] = Array.isArray(data) ? data.map(order => ({
        orderId: order.orderId || order.id,
        createdAt: order.createdAt || order.date,
        updatedAt: order.updatedAt || order.createdAt || order.date,
        customerName: order.customerName,
        customerPhone: order.customerPhone,
        customerEmail: order.customerEmail,
        items: order.items,
        total: order.total,
        storeId: order.storeId,
        status: order.status || 'pending',
        notes: order.notes,
        processedBy: order.processedBy,
        saleId: order.saleId,
        customerAddress: order.customerAddress,
        deliveryMethod: order.deliveryMethod,
        deliveryStatus: order.deliveryStatus,
        deliveryProviderID: order.deliveryProviderID,
        deliveryFee: order.deliveryFee,
        deliveryDate: order.deliveryDate,
        deliveryTime: order.deliveryTime,
        deliveryNotes: order.deliveryNotes,
        latitude: order.latitude,
        longitude: order.longitude
      })) : [];

      // Solo actualizar si hay cambios reales
      setOrders(prevOrders => {
        const hasChanges = JSON.stringify(prevOrders) !== JSON.stringify(formattedOrders);
        if (hasChanges) {
          console.log('🔄 Orders updated - changes detected');
          return formattedOrders;
        }
        return prevOrders;
      });

    } catch (err: any) {
      console.error('❌ Error fetching user orders:', err);
      setError(err.message);

      // Incrementar contador de reintentos
      retryCountRef.current += 1;

      // Solo mostrar toast en fetch inicial o después de varios reintentos
      if (showLoadingState || retryCountRef.current >= MAX_RETRIES) {
        toast({
          variant: "destructive",
          title: "Error al cargar pedidos",
          description: isOnline
            ? "No se pudieron cargar tus pedidos. Intenta recargar la página."
            : "Sin conexión a internet. Los pedidos se actualizarán cuando vuelvas a estar online."
        });
      }

      // CORREGIDO: No limpiar pedidos en caso de error, mantener los existentes
      // Solo limpiar si es el primer fetch y no hay pedidos previos
      if (showLoadingState && orders.length === 0) {
        setOrders([]);
      }
    } finally {
      if (showLoadingState) {
        setIsLoading(false);
      }
    }
  }, [userEmail, storeId, toast]);

  // Función para iniciar polling
  const startPolling = useCallback(() => {
    if (pollingIntervalRef.current || !userEmail || !storeId) {
      return;
    }

    console.log('🔄 Starting order polling...');
    setIsPolling(true);

    pollingIntervalRef.current = setInterval(() => {
      if (isActiveRef.current && isOnline) {
        fetchOrders(false); // No mostrar loading state en polling
      }
    }, POLLING_INTERVAL);
  }, [userEmail, storeId, fetchOrders]);

  // Función para detener polling
  const stopPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      console.log('⏹️ Stopping order polling...');
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
      setIsPolling(false);
    }
  }, []);

  // Fetch inicial
  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Manejar reconexión de red
  useEffect(() => {
    if (isOnline && wasOffline && userEmail && storeId) {
      console.log('🔄 Network reconnected - fetching orders');
      retryCountRef.current = 0; // Reset retry counter
      fetchOrders(false);
    }
  }, [isOnline, wasOffline, userEmail, storeId, fetchOrders]);

  // Auto-start polling cuando hay usuario autenticado
  useEffect(() => {
    if (userEmail && storeId) {
      startPolling();
    } else {
      stopPolling();
    }

    return () => {
      stopPolling();
    };
  }, [userEmail, storeId, startPolling, stopPolling]);

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
        console.log('📱 Page hidden - stopping polling');
        stopPolling();
      } else if (userEmail && storeId) {
        console.log('📱 Page visible - resuming polling');
        fetchOrders(false); // Fetch inmediato al volver
        startPolling();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [userEmail, storeId, fetchOrders, startPolling, stopPolling]);

  return {
    orders,
    isLoading,
    error,
    refetch: () => fetchOrders(true),
    isPolling,
    startPolling,
    stopPolling
  };
};