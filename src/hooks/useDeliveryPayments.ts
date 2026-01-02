import { useState, useEffect } from 'react';
import type { DeliveryPayment } from '@/lib/types';

export const useDeliveryPayments = (storeId: string) => {
  const [payments, setPayments] = useState<DeliveryPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!storeId) {
      setLoading(false);
      return;
    }

    const fetchPayments = async () => {
      try {
        const response = await fetch(`/api/delivery-payments?storeId=${encodeURIComponent(storeId)}`);
        if (!response.ok) throw new Error('Error fetching payments');
        const data = await response.json();
        setPayments(data);
      } catch (err) {
        console.error('Error fetching delivery payments:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchPayments();
  }, [storeId]);

  const createPayment = async (paymentData: any) => {
    try {
      const response = await fetch('/api/delivery-payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paymentData),
      });

      if (!response.ok) {
        throw new Error('Error creating payment');
      }

      const newPayment = await response.json();
      setPayments(prev => [...prev, newPayment]);
      return newPayment;
    } catch (error) {
      console.error('Error creating payment:', error);
      throw error;
    }
  };

  const deletePayment = async (id: string) => {
    try {
      const response = await fetch(`/api/delivery-payments/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Error deleting payment');
      }

      setPayments(prev => prev.filter(p => p.id !== id));
    } catch (error) {
      console.error('Error deleting payment:', error);
      throw error;
    }
  };

  return {
    payments,
    loading,
    error,
    createPayment,
    deletePayment,
    refetch: () => {
      setPayments([]);
      setLoading(true);
      setError(null);
    },
  };
};
