'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useDeliveryProviders } from '@/hooks/useDeliveryProviders';
import { useDeliveryAssignments } from '@/hooks/useDeliveryAssignments';
import { useToast } from '@/hooks/use-toast';
import type { DeliveryProvider } from '@/lib/types';

interface AssignProviderDialogProps {
  open: boolean;
  onClose: () => void;
  orderId: string;
  customerName: string;
  customerAddress: string;
  customerPhone: string;
  orderTotal: number;
  onAssigned: (assignment: any) => void;
}

export const AssignProviderDialog = ({
  open,
  onClose,
  orderId,
  customerName,
  customerAddress,
  customerPhone,
  orderTotal,
  onAssigned
}: AssignProviderDialogProps) => {
  const { toast } = useToast();
  const { providers, loading } = useDeliveryProviders('');
  const { createAssignment } = useDeliveryAssignments('');
  const [selectedProviderId, setSelectedProviderId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedProviderId) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Por favor selecciona un repartidor'
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const provider = providers.find(p => p.id === selectedProviderId);
      if (!provider) {
        throw new Error('Proveedor no encontrado');
      }

      const assignment = await createAssignment({
        orderId,
        deliveryProviderId: provider.id,
        orderCustomerName: customerName,
        orderCustomerPhone: customerPhone,
        orderCustomerAddress: customerAddress,
        orderTotal,
      });

      toast({
        title: 'Asignación exitosa',
        description: `El pedido ha sido asignado a ${provider.name}`
      });
      
      onAssigned(assignment);
      onClose();
      setSelectedProviderId('');
    } catch (error) {
      console.error('Error asignando repartidor:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error instanceof Error ? error.message : 'No se pudo asignar el repartidor'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeProviders = providers.filter(p => p.status === 'active');

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Asignar Repartidor</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div>
            <Label htmlFor="provider">Repartidor</Label>
            <Select
              value={selectedProviderId}
              onValueChange={setSelectedProviderId}
              disabled={loading || isSubmitting}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un repartidor activo" />
              </SelectTrigger>
              <SelectContent>
                {activeProviders.length === 0 ? (
                  <div className="p-2 text-sm text-muted-foreground">
                    No hay repartidores activos disponibles
                  </div>
                ) : (
                  activeProviders.map((provider) => (
                    <SelectItem key={provider.id} value={provider.id}>
                      {provider.name} ({provider.phone})
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2 text-sm text-muted-foreground">
            <p><strong>Orden:</strong> #{orderId}</p>
            <p><strong>Cliente:</strong> {customerName}</p>
            <p><strong>Teléfono:</strong> {customerPhone}</p>
            <p><strong>Dirección:</strong> {customerAddress}</p>
            <p><strong>Total:</strong> ${orderTotal.toFixed(2)}</p>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button type="submit" disabled={!selectedProviderId || isSubmitting}>
              {isSubmitting ? 'Asignando...' : 'Asignar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
