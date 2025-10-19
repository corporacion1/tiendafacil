// src/hooks/useDashboardStats.ts
import { useState, useEffect } from 'react';
import { useSettings } from '@/contexts/settings-context';

interface DashboardStats {
  sales: {
    totalSales: number;
    totalTransactions: number;
    averageSale: number;
  };
  inventory: {
    totalProducts: number;
    lowStockProducts: number;
    totalInventoryValue: number;
  };
  topProducts: Array<{
    _id: string;
    productName: string;
    totalSold: number;
    totalRevenue: number;
  }>;
  topCustomers: Array<{
    _id: string;
    customerName: string;
    totalSpent: number;
    purchaseCount: number;
  }>;
}

export const useDashboardStats = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { activeStoreId } = useSettings();

  useEffect(() => {
    const fetchStats = async () => {
      if (!activeStoreId) return;

      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch(`/api/dashboard/stats?storeId=${activeStoreId}`);
        
        if (!response.ok) {
          throw new Error('Error al cargar estadísticas');
        }

        const data = await response.json();
        
        if (data.success) {
          setStats(data.data);
        } else {
          throw new Error(data.error || 'Error desconocido');
        }
      } catch (err: any) {
        console.error('Error fetching dashboard stats:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();

    // Opcional: refrescar cada 30 segundos
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, [activeStoreId]);

  return { stats, loading, error };
};