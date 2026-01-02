import { useState, useEffect } from 'react';
import type { DeliveryFeeRule } from '@/lib/types';

export const useDeliveryFeeRules = (storeId: string) => {
  const [rules, setRules] = useState<DeliveryFeeRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!storeId) {
      setLoading(false);
      return;
    }

    const fetchRules = async () => {
      try {
        const response = await fetch(`/api/delivery-fee-rules?storeId=${encodeURIComponent(storeId)}`);
        if (!response.ok) throw new Error('Error fetching fee rules');
        const data = await response.json();
        setRules(data);
      } catch (err) {
        console.error('Error fetching delivery fee rules:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchRules();
  }, [storeId]);

  const createRule = async (ruleData: Partial<DeliveryFeeRule>) => {
    try {
      const response = await fetch('/api/delivery-fee-rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ruleData),
      });

      if (!response.ok) {
        throw new Error('Error creating fee rule');
      }

      const newRule = await response.json();
      setRules(prev => [...prev, newRule]);
      return newRule;
    } catch (error) {
      console.error('Error creating delivery fee rule:', error);
      throw error;
    }
  };

  const updateRule = async (id: string, updates: Partial<DeliveryFeeRule>) => {
    try {
      const response = await fetch(`/api/delivery-fee-rules/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error('Error updating fee rule');
      }

      const updatedRule = await response.json();
      setRules(prev => prev.map(r => r.id === id ? updatedRule : r));
      return updatedRule;
    } catch (error) {
      console.error('Error updating delivery fee rule:', error);
      throw error;
    }
  };

  const deleteRule = async (id: string) => {
    try {
      const response = await fetch(`/api/delivery-fee-rules/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Error deleting fee rule');
      }

      setRules(prev => prev.filter(r => r.id !== id));
    } catch (error) {
      console.error('Error deleting delivery fee rule:', error);
      throw error;
    }
  };

  const calculateFee = async (params: {
    storeId: string;
    destinationLat: number;
    destinationLon: number;
    storeLat: number;
    storeLon: number;
    orderAmount: number;
    providerType?: string;
  }) => {
    try {
      const response = await fetch('/api/delivery-fee-rules/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        throw new Error('Error calculating delivery fee');
      }

      return await response.json();
    } catch (error) {
      console.error('Error calculating delivery fee:', error);
      throw error;
    }
  };

  return {
    rules,
    loading,
    error,
    createRule,
    updateRule,
    deleteRule,
    calculateFee,
    refetch: () => {
      setRules([]);
      setLoading(true);
      setError(null);
    },
  };
};
