import { useState, useEffect } from 'react';
import type { DeliveryProvider } from '@/lib/types';

export const useDeliveryProviders = (storeId: string) => {
  const [providers, setProviders] = useState<DeliveryProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!storeId) {
      setLoading(false);
      return;
    }

    const fetchProviders = async () => {
      try {
        const response = await fetch(`/api/delivery-providers?storeId=${encodeURIComponent(storeId)}`);
        if (!response.ok) throw new Error('Error fetching providers');
        const data = await response.json();
        setProviders(data);
      } catch (err) {
        console.error('Error fetching delivery providers:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchProviders();
  }, [storeId]);

  const createProvider = async (providerData: Partial<DeliveryProvider>) => {
    try {
      const response = await fetch('/api/delivery-providers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(providerData),
      });

      if (!response.ok) {
        throw new Error('Error creating provider');
      }

      const newProvider = await response.json();
      setProviders(prev => [...prev, newProvider]);
      return newProvider;
    } catch (error) {
      console.error('Error creating delivery provider:', error);
      throw error;
    }
  };

  const updateProvider = async (id: string, updates: Partial<DeliveryProvider>) => {
    try {
      const response = await fetch(`/api/delivery-providers/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error('Error updating provider');
      }

      const updatedProvider = await response.json();
      setProviders(prev => prev.map(p => p.id === id ? updatedProvider : p));
      return updatedProvider;
    } catch (error) {
      console.error('Error updating delivery provider:', error);
      throw error;
    }
  };

  const deleteProvider = async (id: string) => {
    try {
      const response = await fetch(`/api/delivery-providers/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Error deleting provider');
      }

      setProviders(prev => prev.filter(p => p.id !== id));
    } catch (error) {
      console.error('Error deleting delivery provider:', error);
      throw error;
    }
  };

  return {
    providers,
    loading,
    error,
    createProvider,
    updateProvider,
    deleteProvider,
    refetch: () => {
      setProviders([]);
      setLoading(true);
      setError(null);
    },
  };
};
