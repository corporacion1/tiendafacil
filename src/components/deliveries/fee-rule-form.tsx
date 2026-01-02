'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { useDeliveryFeeRules } from '@/hooks/useDeliveryFeeRules';
import type { DeliveryFeeRule } from '@/lib/types';

interface FeeRuleFormProps {
  open: boolean;
  onClose: () => void;
  rule?: DeliveryFeeRule | null;
  onSave?: () => void;
}

export const FeeRuleForm = ({ open, onClose, rule, onSave }: FeeRuleFormProps) => {
  const { toast } = useToast();
  const { createRule: create, updateRule: update } = useDeliveryFeeRules('');
  const isEditing = !!rule;

  const [formData, setFormData] = useState({
    name: rule?.name || '',
    description: rule?.description || '',
    feeType: rule?.feeType || 'fixed',
    fixedFeeAmount: rule?.fixedFeeAmount || 0,
    distanceBaseFee: rule?.distanceBaseFee || 0,
    distanceThresholdKm: rule?.distanceThresholdKm || 0,
    perKmFee: rule?.perKmFee || 0,
    maxDistanceKm: rule?.maxDistanceKm || 0,
    minimumOrderAmount: rule?.minimumOrderAmount || 0,
    freeDeliveryThreshold: rule?.freeDeliveryThreshold || 0,
    applyToProviderType: rule?.applyToProviderType || 'all' as 'all' | 'internal' | 'external',
    isPeakHours: rule?.isPeakHours || false,
    peakHoursStart: rule?.peakHoursStart || '12:00',
    peakHoursEnd: rule?.peakHoursEnd || '14:00',
    peakHoursMultiplier: rule?.peakHoursMultiplier || 1.5,
    applicableDays: rule?.applicableDays || [],
    status: rule?.status || 'active' as 'active' | 'inactive',
    priority: rule?.priority || 0,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (isEditing && rule) {
        await update(rule.id, formData);
        toast({
          title: 'Regla actualizada',
          description: 'La regla de tarifa se actualizó exitosamente',
        });
      } else {
        await create(formData);
        toast({
          title: 'Regla creada',
          description: 'La regla de tarifa se creó exitosamente',
        });
      }
      
      onSave?.();
      onClose();
    } catch (error) {
      console.error('Error al guardar regla de tarifa:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error instanceof Error ? error.message : 'No se pudo guardar la regla de tarifa'
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar Regla de Tarifa' : 'Nueva Regla de Tarifa'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label htmlFor="name">Nombre *</Label>
              <Input
                id="name"
                required
                placeholder="Ej: Tarifa Estándar, Tarifa Express, etc."
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div className="col-span-2">
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                placeholder="Descripción de la regla..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={2}
              />
            </div>

            <div className="col-span-2">
              <Label htmlFor="feeType">Tipo de Tarifa *</Label>
              <Select
                value={formData.feeType}
                onValueChange={(value) => setFormData({ ...formData, feeType: value as any })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona tipo de tarifa" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fixed">Fija</SelectItem>
                  <SelectItem value="by_zone">Por Zona</SelectItem>
                  <SelectItem value="by_distance">Por Distancia</SelectItem>
                  <SelectItem value="combination">Combinada</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.feeType === 'fixed' && (
              <div className="col-span-2">
                <Label htmlFor="fixedFeeAmount">Monto Fijo (BS) *</Label>
                <Input
                  id="fixedFeeAmount"
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  placeholder="Ej: 50.00"
                  value={formData.fixedFeeAmount}
                  onChange={(e) => setFormData({ ...formData, fixedFeeAmount: parseFloat(e.target.value) || 0 })}
                />
              </div>
            )}

            {formData.feeType === 'by_distance' && (
              <>
                <div>
                  <Label htmlFor="distanceBaseFee">Tarifa Base (BS) *</Label>
                  <Input
                    id="distanceBaseFee"
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    placeholder="Ej: 30.00"
                    value={formData.distanceBaseFee}
                    onChange={(e) => setFormData({ ...formData, distanceBaseFee: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <Label htmlFor="distanceThresholdKm">Distancia Umbral (km) *</Label>
                  <Input
                    id="distanceThresholdKm"
                    type="number"
                    step="0.1"
                    min="0"
                    required
                    placeholder="Ej: 3.0"
                    value={formData.distanceThresholdKm}
                    onChange={(e) => setFormData({ ...formData, distanceThresholdKm: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div className="col-span-2">
                  <Label htmlFor="perKmFee">Tarifa por km Adicional (BS) *</Label>
                  <Input
                    id="perKmFee"
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    placeholder="Ej: 5.00"
                    value={formData.perKmFee}
                    onChange={(e) => setFormData({ ...formData, perKmFee: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </>
            )}

            {(formData.feeType === 'by_zone' || formData.feeType === 'combination') && (
              <>
                <div>
                  <Label htmlFor="minimumOrderAmount">Monto Mínimo de Pedido (BS)</Label>
                  <Input
                    id="minimumOrderAmount"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="Ej: 100.00"
                    value={formData.minimumOrderAmount}
                    onChange={(e) => setFormData({ ...formData, minimumOrderAmount: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <Label htmlFor="freeDeliveryThreshold">Umbral de envío gratis (BS)</Label>
                  <Input
                    id="freeDeliveryThreshold"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="Ej: 200.00"
                    value={formData.freeDeliveryThreshold}
                    onChange={(e) => setFormData({ ...formData, freeDeliveryThreshold: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </>
            )}

            <div>
              <Label htmlFor="maxDistanceKm">Distancia Máxima (km)</Label>
              <Input
                id="maxDistanceKm"
                type="number"
                step="0.1"
                min="0"
                placeholder="Ej: 15.0"
                value={formData.maxDistanceKm}
                onChange={(e) => setFormData({ ...formData, maxDistanceKm: parseFloat(e.target.value) || 0 })}
              />
            </div>

            <div>
              <Label htmlFor="applyToProviderType">Aplicar a tipo de proveedor</Label>
              <Select
                value={formData.applyToProviderType}
                onValueChange={(value) => setFormData({ ...formData, applyToProviderType: value as 'all' | 'internal' | 'external' })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="internal">Interno</SelectItem>
                  <SelectItem value="external">Externo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="col-span-2 flex items-center gap-2">
              <Switch
                id="isPeakHours"
                checked={formData.isPeakHours}
                onCheckedChange={(checked) => setFormData({ ...formData, isPeakHours: checked })}
              />
              <Label htmlFor="isPeakHours" className="cursor-pointer">
                Habilitar Horas Pico
              </Label>
            </div>

            {formData.isPeakHours && (
              <>
                <div>
                  <Label htmlFor="peakHoursStart">Hora Inicio</Label>
                  <Input
                    id="peakHoursStart"
                    type="time"
                    value={formData.peakHoursStart}
                    onChange={(e) => setFormData({ ...formData, peakHoursStart: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="peakHoursEnd">Hora Fin</Label>
                  <Input
                    id="peakHoursEnd"
                    type="time"
                    value={formData.peakHoursEnd}
                    onChange={(e) => setFormData({ ...formData, peakHoursEnd: e.target.value })}
                  />
                </div>
                <div className="col-span-2">
                  <Label htmlFor="peakHoursMultiplier">Multiplicador</Label>
                  <Input
                    id="peakHoursMultiplier"
                    type="number"
                    step="0.1"
                    min="1"
                    placeholder="Ej: 1.5"
                    value={formData.peakHoursMultiplier}
                    onChange={(e) => setFormData({ ...formData, peakHoursMultiplier: parseFloat(e.target.value) || 1 })}
                  />
                </div>
              </>
            )}

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
