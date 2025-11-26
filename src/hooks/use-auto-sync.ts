import { useCallback } from 'react';
import { useSettings } from '@/contexts/settings-context';
import { useToast } from '@/hooks/use-toast';

/**
 * Hook personalizado para manejar operaciones CRUD con sincronización automática
 */
export function useAutoSync() {
  const { 
    syncAfterSave, 
    syncProducts, 
    setProducts, 
    setSales, 
    setPurchases, 
    setCustomers, 
    setSuppliers,
    activeStoreId 
  } = useSettings();
  const { toast } = useToast();

  /**
   * Wrapper para operaciones POST que actualiza automáticamente el estado local
   */
  const createWithSync = useCallback(async <T>(
    endpoint: string,
    data: any,
    options: {
      successMessage?: string;
      errorMessage?: string;
      updateState?: (newItem: T) => void;
      syncType?: 'full' | 'products' | 'none';
    } = {}
  ): Promise<T | null> => {
    try {
      console.log(`🔄 [AutoSync] Creating ${endpoint}:`, data);

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, storeId: activeStoreId })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error en la operación');
      }

      const result = await response.json();
      console.log(`✅ [AutoSync] Created successfully:`, result);

      // Actualizar estado local si se proporciona la función
      if (options.updateState) {
        options.updateState(result);
      }

      // Sincronización automática
      if (options.syncType === 'full') {
        setTimeout(() => syncAfterSave(activeStoreId), 100);
      } else if (options.syncType === 'products') {
        setTimeout(() => syncProducts(), 100);
      }

      // Mostrar mensaje de éxito
      if (options.successMessage) {
        toast({
          title: "Operación exitosa",
          description: options.successMessage,
        });
      }

      return result;
    } catch (error: any) {
      console.error(`❌ [AutoSync] Error creating ${endpoint}:`, error);
      
      toast({
        variant: "destructive",
        title: "Error",
        description: options.errorMessage || error.message || "Error en la operación",
      });

      return null;
    }
  }, [activeStoreId, syncAfterSave, syncProducts, toast]);

  /**
   * Wrapper para operaciones PUT que actualiza automáticamente el estado local
   */
  const updateWithSync = useCallback(async <T>(
    endpoint: string,
    data: any,
    options: {
      successMessage?: string;
      errorMessage?: string;
      updateState?: (updatedItem: T) => void;
      syncType?: 'full' | 'products' | 'none';
    } = {}
  ): Promise<T | null> => {
    try {
      console.log(`🔄 [AutoSync] Updating ${endpoint}:`, data);

      const response = await fetch(endpoint, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, storeId: activeStoreId })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error en la actualización');
      }

      const result = await response.json();
      console.log(`✅ [AutoSync] Updated successfully:`, result);

      // Actualizar estado local si se proporciona la función
      if (options.updateState) {
        options.updateState(result);
      }

      // Sincronización automática
      if (options.syncType === 'full') {
        setTimeout(() => syncAfterSave(activeStoreId), 100);
      } else if (options.syncType === 'products') {
        setTimeout(() => syncProducts(), 100);
      }

      // Mostrar mensaje de éxito
      if (options.successMessage) {
        toast({
          title: "Actualización exitosa",
          description: options.successMessage,
        });
      }

      return result;
    } catch (error: any) {
      console.error(`❌ [AutoSync] Error updating ${endpoint}:`, error);
      
      toast({
        variant: "destructive",
        title: "Error",
        description: options.errorMessage || error.message || "Error en la actualización",
      });

      return null;
    }
  }, [activeStoreId, syncAfterSave, syncProducts, toast]);

  /**
   * Wrapper para operaciones DELETE que actualiza automáticamente el estado local
   */
  const deleteWithSync = useCallback(async (
    endpoint: string,
    id: string,
    options: {
      successMessage?: string;
      errorMessage?: string;
      updateState?: (deletedId: string) => void;
      syncType?: 'full' | 'products' | 'none';
    } = {}
  ): Promise<boolean> => {
    try {
      console.log(`🔄 [AutoSync] Deleting ${endpoint}:`, id);

      const response = await fetch(`${endpoint}?id=${id}&storeId=${activeStoreId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error en la eliminación');
      }

      console.log(`✅ [AutoSync] Deleted successfully:`, id);

      // Actualizar estado local si se proporciona la función
      if (options.updateState) {
        options.updateState(id);
      }

      // Sincronización automática
      if (options.syncType === 'full') {
        setTimeout(() => syncAfterSave(activeStoreId), 100);
      } else if (options.syncType === 'products') {
        setTimeout(() => syncProducts(), 100);
      }

      // Mostrar mensaje de éxito
      if (options.successMessage) {
        toast({
          title: "Eliminación exitosa",
          description: options.successMessage,
        });
      }

      return true;
    } catch (error: any) {
      console.error(`❌ [AutoSync] Error deleting ${endpoint}:`, error);
      
      toast({
        variant: "destructive",
        title: "Error",
        description: options.errorMessage || error.message || "Error en la eliminación",
      });

      return false;
    }
  }, [activeStoreId, syncAfterSave, syncProducts, toast]);

  return {
    createWithSync,
    updateWithSync,
    deleteWithSync
  };
}