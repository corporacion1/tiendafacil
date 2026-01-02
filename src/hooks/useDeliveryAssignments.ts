import { useState, useEffect } from 'react';
import type { DeliveryAssignment, DeliveryStatus } from '@/lib/types';

export const useDeliveryAssignments = (storeId: string) => {
  const [assignments, setAssignments] = useState<DeliveryAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAssignments = async (status?: DeliveryStatus, deliveryProviderId?: string) => {
    if (!storeId) {
      setLoading(false);
      return;
    }

    try {
      const params = new URLSearchParams({
        storeId,
        ...(status && { status }),
        ...(deliveryProviderId && { deliveryProviderId }),
      });

      const response = await fetch(`/api/delivery-assignments?${params}`);
      if (!response.ok) throw new Error('Error fetching assignments');
      const data = await response.json();
      setAssignments(data);
    } catch (err) {
      console.error('Error fetching delivery assignments:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingOrders = async () => {
    if (!storeId) {
      setLoading(false);
      return [];
    }

    try {
      const response = await fetch(`/api/delivery-assignments/pending?storeId=${encodeURIComponent(storeId)}`);
      if (!response.ok) throw new Error('Error fetching pending orders');
      const data = await response.json();
      return data;
    } catch (err) {
      console.error('Error fetching pending orders:', err);
      return [];
    } finally {
      setLoading(false);
    }
  };

  const fetchActiveAssignments = async () => {
    if (!storeId) {
      setLoading(false);
      return [];
    }

    try {
      const response = await fetch(`/api/delivery-assignments/active?storeId=${encodeURIComponent(storeId)}`);
      if (!response.ok) throw new Error('Error fetching active assignments');
      const data = await response.json();
      setAssignments(data);
    } catch (err) {
      console.error('Error fetching active assignments:', err);
      return [];
    } finally {
      setLoading(false);
    }
  };

  const createAssignment = async (assignmentData: any) => {
    try {
      const response = await fetch('/api/delivery-assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(assignmentData),
      });

      if (!response.ok) {
        throw new Error('Error creating assignment');
      }

      const newAssignment = await response.json();
      setAssignments(prev => [...prev, newAssignment]);
      return newAssignment;
    } catch (error) {
      console.error('Error creating delivery assignment:', error);
      throw error;
    }
  };

  const updateAssignmentStatus = async (id: string, status: DeliveryStatus) => {
    try {
      const response = await fetch(`/api/delivery-assignments/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        throw new Error('Error updating status');
      }

      const updated = await response.json();
      setAssignments(prev => prev.map(a => a.id === id ? updated : a));
      return updated;
    } catch (error) {
      console.error('Error updating assignment status:', error);
      throw error;
    }
  };

  const updateAssignmentLocation = async (id: string, currentLatitude: number, currentLongitude: number) => {
    try {
      const response = await fetch(`/api/delivery-assignments/${id}/location`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentLatitude, currentLongitude }),
      });

      if (!response.ok) {
        throw new Error('Error updating location');
      }

      const updated = await response.json();
      setAssignments(prev => prev.map(a => a.id === id ? updated : a));
      return updated;
    } catch (error) {
      console.error('Error updating assignment location:', error);
      throw error;
    }
  };

  const completeDelivery = async (id: string, data: {
    customerRating?: number;
    customerFeedback?: string;
    actualDurationMinutes?: number;
    proofOfDeliveryUrl?: string;
  }) => {
    try {
      const response = await fetch(`/api/delivery-assignments/${id}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Error completing delivery');
      }

      const updated = await response.json();
      setAssignments(prev => prev.map(a => a.id === id ? updated : a));
      return updated;
    } catch (error) {
      console.error('Error completing delivery:', error);
      throw error;
    }
  };

  const cancelDelivery = async (id: string, cancellationReason: string) => {
    try {
      const response = await fetch(`/api/delivery-assignments/${id}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cancellationReason }),
      });

      if (!response.ok) {
        throw new Error('Error cancelling delivery');
      }

      const updated = await response.json();
      setAssignments(prev => prev.map(a => a.id === id ? updated : a));
      return updated;
    } catch (error) {
      console.error('Error cancelling delivery:', error);
      throw error;
    }
  };

  const deleteAssignment = async (id: string) => {
    try {
      const response = await fetch(`/api/delivery-assignments/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Error deleting assignment');
      }

      setAssignments(prev => prev.filter(a => a.id !== id));
    } catch (error) {
      console.error('Error deleting delivery assignment:', error);
      throw error;
    }
  };

  return {
    assignments,
    loading,
    error,
    fetchAssignments,
    fetchPendingOrders,
    fetchActiveAssignments,
    createAssignment,
    updateAssignmentStatus,
    updateAssignmentLocation,
    completeDelivery,
    cancelDelivery,
    deleteAssignment,
    refetch: () => {
      setAssignments([]);
      setLoading(true);
      setError(null);
    },
  };
};
