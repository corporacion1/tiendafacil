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
  updateOrderStatus: (orderId: string, status: string, saleId?: string) => Promise<void>;
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
  const POLLING_INTERVAL = 10000; // 10 segundos
  const MIN_FETCH_INTERVAL = 2000; // Mínimo 2 segundos entre fetches
  const MAX_RETRIES = 3;

  const fetchOrders = useCallback(async (showLoadingState = true) => {
    if (!storeId || !isActiveRef.current) {
      setOrders([]);
      return;
    }

    // Evitar fetches muy frecuentes
    const now = Date.now();
    if (now - lastFetchTimeRef.current < MIN_FETCH_INTERVAL) {
      console.log('⏳ [POS] Skipping fetch - too frequent');
      return;
    }
    lastFetchTimeRef.current = now;

    if (showLoadingState) {
      setIsLoading(true);
    }
    setError(null);

    try {
      console.log('🔍 [POS] Fetching pending orders for store:', storeId);
      
      // Obtener pedidos pendientes y en procesamiento (no completamente procesados)
      const url = `/api/orders?storeId=${encodeURIComponent(storeId)}&status=pending,processing`;
      console.log('🔗 [POS] API URL:', url);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('📦 [POS] Pending orders fetched:', data.length);
      console.log('📋 [POS] Orders data:', data);
      
      // Log de clientes únicos para confirmar que son de diferentes usuarios
      if (Array.isArray(data) && data.length > 0) {
        const uniqueCustomers = [...new Set(data.map(order => order.customerName))];
        console.log('👥 [POS] Clientes únicos en pedidos:', uniqueCustomers.length, uniqueCustomers);
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
        status: order.status || 'pending'
      })) : [];

      // Solo actualizar si hay cambios reales
      setOrders(prevOrders => {
        const hasChanges = JSON.stringify(prevOrders) !== JSON.stringify(formattedOrders);
        if (hasChanges) {
          console.log('🔄 [POS] Orders updated - changes detected');
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
  const updateOrderStatus = useCallback(async (orderId: string, status: string, saleId?: string) => {
    try {
      console.log('🔄 [POS] Updating order status:', orderId, 'to', status);
      
      const response = await fetch('/api/orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          status,
          processedBy: 'POS', // Identificar que fue procesado desde POS
          saleId,
          processedAt: new Date().toISOString()
        })
      });

      if (!response.ok) {
        throw new Error('Error al actualizar estado del pedido');
      }

      // Refrescar la lista de pedidos
      await fetchOrders(false);
      
      console.log('✅ [POS] Order status updated successfully');
      
    } catch (error) {
      console.error('❌ [POS] Error updating order status:', error);
      throw error; // Re-throw para que el caller pueda manejar el error
    }
  }, [fetchOrders]);

  // Función para iniciar polling
  const startPolling = useCallback(() => {
    if (pollingIntervalRef.current || !storeId) {
      return;
    }

    console.log('🔄 [POS] Starting order polling...');
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
      console.log('⏹️ [POS] Stopping order polling...');
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
      console.log('🔄 [POS] Network reconnected - fetching orders');
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
        console.log('📱 [POS] Page hidden - stopping polling');
        stopPolling();
      } else if (storeId) {
        console.log('📱 [POS] Page visible - resuming polling');
        fetchOrders(false); // Fetch inmediato al volver
        startPolling();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [storeId, fetchOrders, startPolling, stopPolling]);

  return {
    orders,
    isLoading,
    error,
    refetch: () => fetchOrders(true),
    isPolling,
    updateOrderStatus
  };
};