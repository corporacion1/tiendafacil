'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Truck } from 'lucide-react';
import { useDeliveryAssignments } from '@/hooks/useDeliveryAssignments';
import { useDeliveryProviders } from '@/hooks/useDeliveryProviders';
import { useSettings } from '@/contexts/settings-context';
import { DeliveryCard } from '@/components/deliveries/delivery-card';
import { DeliveryDetailsPanel } from '@/components/deliveries/delivery-details-panel';
import type { DeliveryAssignment, DeliveryStatus } from '@/lib/types';

export default function DeliveriesPage() {
  const { activeStoreId, userProfile } = useSettings();

  // Estados
  const [activeTab, setActiveTab] = useState<'pending' | 'active' | 'details'>('pending');
  const [selectedAssignment, setSelectedAssignment] = useState<DeliveryAssignment | null>(null);

  // Hooks
  const { 
    fetchPendingOrders, 
    fetchActiveAssignments,
    createAssignment,
    updateAssignmentStatus,
    completeDelivery,
    cancelDelivery 
  } = useDeliveryAssignments(activeStoreId || '');
  const { providers } = useDeliveryProviders(activeStoreId || '');

  const loadData = async () => {
    try {
      const [pendingData, activeData] = await Promise.all([
        fetchPendingOrders(),
        fetchActiveAssignments()
      ]);
    } catch (error) {
      console.error('Error loading delivery data:', error);
    }
  };

  useEffect(() => {
    if (!activeStoreId) return;
    loadData();
  }, [activeStoreId]);

  const handleSelectAssignment = (assignment: DeliveryAssignment) => {
    setSelectedAssignment(assignment);
    setActiveTab('details');
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      await updateAssignmentStatus(id, newStatus as DeliveryStatus);
    } catch (error) {
      console.error('Error updating delivery status:', error);
    }
  };

  const handleMarkComplete = async (data: { customerRating: number; customerFeedback: string }) => {
    if (!selectedAssignment) return;
    try {
      await completeDelivery(selectedAssignment.id, data);
    } catch (error) {
      console.error('Error completing delivery:', error);
    }
  };

  const handleCancel = async (id: string, reason: string) => {
    try {
      await cancelDelivery(id, reason);
    } catch (error) {
      console.error('Error cancelling delivery:', error);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Encabezado y navegación */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Administración de Deliveries</h1>
        <p className="text-muted-foreground">
          Gestiona pedidos con delivery y asigna repartidores
        </p>
      </div>

      {/* Tabla de navegación */}
      <div className="flex gap-2">
        <Button
          variant={activeTab === 'pending' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('pending')}
        >
          Pedidos Pendientes
        </Button>
        <Button
          variant={activeTab === 'active' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('active')}
        >
          Asignaciones Activas
        </Button>
      </div>

      {/* Contenido principal */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Tarjeta 1: Pedidos Pendientes de Asignar */}
        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Pedidos Pendientes de Asignar</CardTitle>
          </CardHeader>
          <CardContent>
            {activeTab === 'pending' && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Estón son pedidos con estatus <Badge>processed</Badge> y método de entrega 
                  <Badge variant="secondary">delivery</Badge> 
                  que aún no tienen repartidor asignado.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tarjeta 2: Asignaciones Activas */}
        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Asignaciones Activas</CardTitle>
          </CardHeader>
          <CardContent>
            {activeTab === 'active' && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Listado de asignaciones activas con estado <Badge>pending</Badge>, 
                  <Badge variant="secondary">picked_up</Badge> o 
                  <Badge variant="secondary">in_transit</Badge>.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tarjeta 3: Panel de Control de Reparto */}
        <Card className="h-fit sticky top-0">
          <CardHeader>
            <CardTitle>Control del Reparto</CardTitle>
          </CardHeader>
          <CardContent>
            {selectedAssignment && activeTab === 'details' ? (
              <DeliveryDetailsPanel
                assignment={selectedAssignment}
                onUpdateStatus={handleUpdateStatus}
                onMarkComplete={handleMarkComplete}
                onCancel={handleCancel}
              />
            ) : (
              <div className="flex items-center justify-center py-12 text-muted-foreground">
                <p>Selecciona una asignación para ver detalles del reparto</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Empty state cuando no hay selección */}
      {activeTab === 'details' && !selectedAssignment && (
        <Card className="h-full min-h-[400px] flex items-center justify-center">
          <CardContent className="py-12">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto bg-primary/10 flex items-center justify-center rounded-full">
                <Truck className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">
                No hay selección
              </h3>
              <p className="text-sm text-muted-foreground">
                Selecciona una asignación o pedidos pendientes para comenzar
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
