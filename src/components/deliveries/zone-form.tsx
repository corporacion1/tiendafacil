'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useDeliveryZones } from '@/hooks/useDeliveryZones';
import type { DeliveryZone } from '@/lib/types';

interface ZoneFormProps {
  open: boolean;
  onClose: () => void;
  zone?: DeliveryZone | null;
  onSave?: () => void;
}

export const ZoneForm = ({ open, onClose, zone, onSave }: ZoneFormProps) => {
  const { toast } = useToast();
  const { createZone: create, updateZone: update } = useDeliveryZones('');
  const isEditing = !!zone;

  const [formData, setFormData] = useState({
    name: zone?.name || '',
    description: zone?.description || '',
    centerLatitude: zone?.centerLatitude || 0,
    centerLongitude: zone?.centerLongitude || 0,
    radiusKm: zone?.radiusKm || 0,
    baseFee: zone?.baseFee || 0,
    perKmFee: zone?.perKmFee || 0,
    perKmFeeOutsideZone: zone?.perKmFeeOutsideZone || 0,
    estimatedMinutesPerKm: zone?.estimatedMinutesPerKm || 0,
    priority: zone?.priority || 0,
    status: zone?.status || 'active' as 'active' | 'inactive',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (isEditing && zone) {
        await update(zone.id, formData);
        toast({
          title: 'Zona actualizada',
          description: 'La zona se actualizó exitosamente',
        });
      } else {
        await create(formData);
        toast({
          title: 'Zona creada',
          description: 'La zona se creó exitosamente',
        });
      }
      
      onSave?.();
      onClose();
    } catch (error) {
      console.error('Error al guardar zona:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error instanceof Error ? error.message : 'No se pudo guardar la zona'
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar Zona' : 'Nueva Zona'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label htmlFor="name">Nombre *</Label>
              <Input
                id="name"
                required
                placeholder="Ej: Zona Norte, Centro, etc."
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div className="col-span-2">
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                placeholder="Descripción de la zona..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={2}
              />
            </div>

            <div>
              <Label htmlFor="centerLatitude">Latitud Central *</Label>
              <Input
                id="centerLatitude"
                type="number"
                step="any"
                required
                placeholder="Ej: 10.4806"
                value={formData.centerLatitude}
                onChange={(e) => setFormData({ ...formData, centerLatitude: parseFloat(e.target.value) || 0 })}
              />
            </div>

            <div>
              <Label htmlFor="centerLongitude">Longitud Central *</Label>
              <Input
                id="centerLongitude"
                type="number"
                step="any"
                required
                placeholder="Ej: -66.9036"
                value={formData.centerLongitude}
                onChange={(e) => setFormData({ ...formData, centerLongitude: parseFloat(e.target.value) || 0 })}
              />
            </div>

            <div>
              <Label htmlFor="radiusKm">Radio (km) *</Label>
              <Input
                id="radiusKm"
                type="number"
                step="0.1"
                min="0"
                required
                placeholder="Ej: 5.0"
                value={formData.radiusKm}
                onChange={(e) => setFormData({ ...formData, radiusKm: parseFloat(e.target.value) || 0 })}
              />
            </div>

            <div>
              <Label htmlFor="baseFee">Tarifa Base (BS) *</Label>
              <Input
                id="baseFee"
                type="number"
                step="0.01"
                min="0"
                required
                placeholder="Ej: 50.00"
                value={formData.baseFee}
                onChange={(e) => setFormData({ ...formData, baseFee: parseFloat(e.target.value) || 0 })}
              />
            </div>

            <div>
              <Label htmlFor="perKmFee">Tarifa por km (BS)</Label>
              <Input
                id="perKmFee"
                type="number"
                step="0.01"
                min="0"
                placeholder="Ej: 5.00"
                value={formData.perKmFee}
                onChange={(e) => setFormData({ ...formData, perKmFee: parseFloat(e.target.value) || 0 })}
              />
            </div>

            <div>
              <Label htmlFor="perKmFeeOutsideZone">Tarifa por km fuera de zona (BS)</Label>
              <Input
                id="perKmFeeOutsideZone"
                type="number"
                step="0.01"
                min="0"
                placeholder="Ej: 8.00"
                value={formData.perKmFeeOutsideZone}
                onChange={(e) => setFormData({ ...formData, perKmFeeOutsideZone: parseFloat(e.target.value) || 0 })}
              />
            </div>

            <div>
              <Label htmlFor="estimatedMinutesPerKm">Minutos por km</Label>
              <Input
                id="estimatedMinutesPerKm"
                type="number"
                step="1"
                min="0"
                placeholder="Ej: 3"
                value={formData.estimatedMinutesPerKm}
                onChange={(e) => setFormData({ ...formData, estimatedMinutesPerKm: parseInt(e.target.value) || 0 })}
              />
            </div>

            <div>
              <Label htmlFor="priority">Prioridad</Label>
              <Input
                id="priority"
                type="number"
                step="1"
                min="0"
                placeholder="Ej: 1"
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 0 })}
              />
            </div>

            <div className="col-span-2">
              <Label htmlFor="status">Estado</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value as 'active' | 'inactive' })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Activo</SelectItem>
                  <SelectItem value="inactive">Inactivo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit">
              {isEditing ? 'Actualizar' : 'Crear'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
