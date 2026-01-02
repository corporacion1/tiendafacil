import { useState, useEffect } from 'react';
import type { DeliveryZone } from '@/lib/types';

export const useDeliveryZones = (storeId: string) => {
  const [zones, setZones] = useState<DeliveryZone[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!storeId) {
      setLoading(false);
      return;
    }

    const fetchZones = async () => {
      try {
        const response = await fetch(`/api/delivery-zones?storeId=${encodeURIComponent(storeId)}`);
        if (!response.ok) throw new Error('Error fetching zones');
        const data = await response.json();
        setZones(data);
      } catch (err) {
        console.error('Error fetching delivery zones:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchZones();
  }, [storeId]);

  const createZone = async (zoneData: Partial<DeliveryZone>) => {
    try {
      const response = await fetch('/api/delivery-zones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(zoneData),
      });

      if (!response.ok) {
        throw new Error('Error creating zone');
      }

      const newZone = await response.json();
      setZones(prev => [...prev, newZone]);
      return newZone;
    } catch (error) {
      console.error('Error creating delivery zone:', error);
      throw error;
    }
  };

  const updateZone = async (id: string, updates: Partial<DeliveryZone>) => {
    try {
      const response = await fetch(`/api/delivery-zones/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error('Error updating zone');
      }

      const updatedZone = await response.json();
      setZones(prev => prev.map(z => z.id === id ? updatedZone : z));
      return updatedZone;
    } catch (error) {
      console.error('Error updating delivery zone:', error);
      throw error;
    }
  };

  const deleteZone = async (id: string) => {
    try {
      const response = await fetch(`/api/delivery-zones/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Error deleting zone');
      }

      setZones(prev => prev.filter(z => z.id !== id));
    } catch (error) {
      console.error('Error deleting delivery zone:', error);
      throw error;
    }
  };

  return {
    zones,
    loading,
    error,
    createZone,
    updateZone,
    deleteZone,
    refetch: () => {
      setZones([]);
      setLoading(true);
      setError(null);
    },
  };
};
