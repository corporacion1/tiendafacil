import { useState, useEffect, useCallback, useRef } from 'react';
import { PendingOrder } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { useNetworkStatus } from './useNetworkStatus';

interface UsePendingOrdersReturn {
  orders: PendingOrder[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  isPolling: boolean;
  updateOrderStatus: (orderId: string, status: string, saleId?: string, processedBy?: string) => Promise<boolean>;
}

export const usePendingOrders = (storeId?: string): UsePendingOrdersReturn => {
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
  const POLLING_INTERVAL = 3000; // 3 segundos
  const MIN_FETCH_INTERVAL = 2000; // Mínimo 2 segundos entre fetches
  const MAX_RETRIES = 3;

  const fetchOrders = useCallback(async (showLoadingState = true) => {
    if (!storeId || !isActiveRef.current || !isOnline) {
      if (!storeId || (!isOnline && showLoadingState)) {
        setOrders([]);
      }
      return;
    }

    // Evitar fetches muy frecuentes
    const now = Date.now();
    if (now - lastFetchTimeRef.current < MIN_FETCH_INTERVAL) {
      return;
    }
    lastFetchTimeRef.current = now;

    if (showLoadingState) {
      setIsLoading(true);
    }
    setError(null);

    try {

      // Obtener TODOS los pedidos (sin filtro de status)
      const url = `/api/orders?storeId=${encodeURIComponent(storeId)}`;

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      // Log de clientes únicos para confirmar que son de diferentes usuarios
      if (Array.isArray(data) && data.length > 0) {
        const uniqueCustomers = [...new Set(data.map(order => order.customerName))];
      }

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
          return formattedOrders;
        }
        return prevOrders;
      });

      // Reset retry counter on success
      retryCountRef.current = 0;

    } catch (err: any) {
      console.error('❌ [POS] Error fetching pending orders:', err);
      setError(err.message);

      // Incrementar contador de reintentos
      retryCountRef.current += 1;

      // Solo mostrar toast en fetch inicial o después de varios reintentos
      if (showLoadingState || retryCountRef.current >= MAX_RETRIES) {
        toast({
          variant: "destructive",
          title: "Error al cargar pedidos",
          description: isOnline
            ? "No se pudieron cargar los pedidos pendientes."
            : "Sin conexión. Los pedidos se actualizarán cuando vuelvas a estar online."
        });
      }

      if (showLoadingState) {
        setOrders([]);
      }
    } finally {
      if (showLoadingState) {
        setIsLoading(false);
      }
    }
  }, [storeId, toast, isOnline]);

  // Función para actualizar estado de pedido
  const updateOrderStatus = useCallback(async (orderId: string, status: string, saleId?: string, processedBy?: string): Promise<boolean> => {
    try {

      if (!storeId) {
        console.error('❌ [POS] No storeId provided for order status update');
        throw new Error('storeId es requerido para actualizar el estado del pedido');
      }

      const processor = processedBy || 'POS';
      const response = await fetch('/api/orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          storeId, // Add storeId required by API
          status,
          processedBy: processor,
          saleId,
          processedAt: new Date().toISOString()
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ [POS] API Error response:', errorText);
        throw new Error(`Error al actualizar estado del pedido: ${response.status} - ${errorText}`);
      }

      // Refrescar la lista de pedidos
      await fetchOrders(false);

      return true;

    } catch (error) {
      console.error('❌ [POS] Error updating order status:', error);
      throw error; // Re-throw para que el caller pueda manejar el error
    }
  }, [fetchOrders, storeId]);

  // Función para iniciar polling
  const startPolling = useCallback(() => {
    if (pollingIntervalRef.current || !storeId) {
      return;
    }

    setIsPolling(true);

    pollingIntervalRef.current = setInterval(() => {
      if (isActiveRef.current && isOnline) {
        fetchOrders(false); // No mostrar loading state en polling
      }
    }, POLLING_INTERVAL);
  }, [storeId, fetchOrders, isOnline]);

  // Función para detener polling
  const stopPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
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
    if (isOnline && wasOffline && storeId) {
      retryCountRef.current = 0; // Reset retry counter
      fetchOrders(false);
    }
  }, [isOnline, wasOffline, storeId, fetchOrders]);

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
        stopPolling();
      } else if (storeId) {
        fetchOrders(false); // Fetch inmediato al volver
        startPolling();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [storeId, fetchOrders, startPolling, stopPolling]);

  const refetch = useCallback(() => fetchOrders(true), [fetchOrders]);

  return {
    orders,
    isLoading,
    error,
    refetch,
    isPolling,
    updateOrderStatus
  };
};