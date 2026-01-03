'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MapPinned, Navigation } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useDeliveryZones } from '@/hooks/useDeliveryZones';
import { useSettings } from '@/contexts/settings-context';
import ZoneMap from './zone-map';
import type { DeliveryZone } from '@/lib/types';

interface QuickAddZoneDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const QuickAddZoneDialog = ({ open, onClose, onSuccess }: QuickAddZoneDialogProps) => {
  const { toast } = useToast();
  const { activeStoreId, activeSymbol, activeRate } = useSettings();
  const { createZone } = useDeliveryZones(activeStoreId || '');

  const [showZoneMapModal, setShowZoneMapModal] = useState(false);

  const handleGetMyLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData({
            ...formData,
            centerLatitude: position.coords.latitude,
            centerLongitude: position.coords.longitude
          });
        },
        (error) => {
          toast({
            variant: 'destructive',
            title: 'Error',
            description: 'No se pudo obtener tu ubicación'
          });
        }
      );
    } else {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Geolocalización no soportada'
      });
    }
  };

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    centerLatitude: 0,
    centerLongitude: 0,
    radiusKm: 0,
    baseFee: 0,
    perKmFee: 0,
    perKmFeeOutsideZone: 0,
    estimatedMinutesPerKm: 0,
    priority: 1,
    status: 'active' as 'active' | 'inactive',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await createZone({
        ...formData,
        storeId: activeStoreId || '',
        baseFee: formData.baseFee / activeRate,
        perKmFee: formData.perKmFee / activeRate,
        perKmFeeOutsideZone: formData.perKmFeeOutsideZone / activeRate,
      });
      toast({
        title: 'Zona creada',
        description: `La zona ${formData.name} se creó exitosamente`
      });
      onClose();
      onSuccess?.();
      setFormData({
        name: '',
        description: '',
        centerLatitude: 0,
        centerLongitude: 0,
        radiusKm: 0,
        baseFee: 0,
        perKmFee: 0,
        perKmFeeOutsideZone: 0,
        estimatedMinutesPerKm: 0,
        priority: 1,
        status: 'active',
      });
    } catch (error) {
      console.error('Error al crear zona:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error instanceof Error ? error.message : 'No se pudo crear la zona'
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Agregar Nueva Zona</DialogTitle>
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

            <div className="col-span-2">
              <Label>Ubicación del Centro de la Zona *</Label>
              <div className="grid grid-cols-[1fr_1fr_auto_auto] gap-2">
                <Input
                  id="centerLatitude"
                  type="number"
                  step="any"
                  required
                  placeholder="Latitud: 10.4806"
                  value={formData.centerLatitude}
                  onChange={(e) => setFormData({ ...formData, centerLatitude: parseFloat(e.target.value) || 0 })}
                />
                <Input
                  id="centerLongitude"
                  type="number"
                  step="any"
                  required
                  placeholder="Longitud: -66.9036"
                  value={formData.centerLongitude}
                  onChange={(e) => setFormData({ ...formData, centerLongitude: parseFloat(e.target.value) || 0 })}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowZoneMapModal(true)}
                  className="shrink-0"
                  title="Seleccionar en mapa"
                >
                  <MapPinned className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleGetMyLocation}
                  className="shrink-0"
                  title="Usar mi ubicación"
                >
                  <Navigation className="h-4 w-4" />
                </Button>
              </div>
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
              <Label htmlFor="baseFee">Tarifa Base ({activeSymbol}) *</Label>
              <Input
                id="baseFee"
                type="number"
                step="0.01"
                min="0"
                required
                placeholder={`Ej: ${(50 * activeRate).toFixed(2)}`}
                value={formData.baseFee}
                onChange={(e) => setFormData({ ...formData, baseFee: parseFloat(e.target.value) || 0 })}
              />
            </div>

            <div>
              <Label htmlFor="perKmFee">Tarifa por km ({activeSymbol})</Label>
              <Input
                id="perKmFee"
                type="number"
                step="0.01"
                min="0"
                placeholder={`Ej: ${(5 * activeRate).toFixed(2)}`}
                value={formData.perKmFee}
                onChange={(e) => setFormData({ ...formData, perKmFee: parseFloat(e.target.value) || 0 })}
              />
            </div>

            <div>
              <Label htmlFor="perKmFeeOutsideZone">Tarifa por km fuera de zona ({activeSymbol})</Label>
              <Input
                id="perKmFeeOutsideZone"
                type="number"
                step="0.01"
                min="0"
                placeholder={`Ej: ${(8 * activeRate).toFixed(2)}`}
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
                onChange={(e) => setFormData({ ...formData, estimatedMinutesPerKm: Number(e.target.value) || 0 })}
              />
            </div>

            <div>
              <Label htmlFor="priority">Prioridad</Label>
              <Input
                id="priority"
                type="number"
                step="1"
                min="1"
                placeholder="Ej: 1"
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: Number(e.target.value) || 1 })}
              />
            </div>

            <div>
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
            <DialogClose asChild>
              <Button variant="outline">Cancelar</Button>
            </DialogClose>
            <Button type="submit">Crear Zona</Button>
          </DialogFooter>
        </form>

        <Dialog open={showZoneMapModal} onOpenChange={setShowZoneMapModal}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Seleccionar Centro de la Zona en el Mapa</DialogTitle>
            </DialogHeader>
            <ZoneMap
              currentLat={formData.centerLatitude}
              currentLon={formData.centerLongitude}
              onSave={(lat: number, lon: number) => {
                setFormData({ ...formData, centerLatitude: lat, centerLongitude: lon });
                setShowZoneMapModal(false);
              }}
              onCancel={() => setShowZoneMapModal(false)}
            />
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  );
};
