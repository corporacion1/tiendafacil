'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useDeliveryZones } from '@/hooks/useDeliveryZones';
import { useSettings } from '@/contexts/settings-context';
import { ZoneForm } from '@/components/deliveries/zone-form';
import { MapPin, Plus, Pencil, Trash2, Clock, DollarSign } from 'lucide-react';
import type { DeliveryZone } from '@/lib/types';

export default function ZonesPage() {
  const { activeStoreId } = useSettings();
  const { zones, loading, createZone, updateZone, deleteZone } = useDeliveryZones(activeStoreId || '');
  const [showForm, setShowForm] = useState(false);
  const [editingZone, setEditingZone] = useState<DeliveryZone | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [zoneToDelete, setZoneToDelete] = useState<string | null>(null);

  const handleEdit = (zone: DeliveryZone) => {
    setEditingZone(zone);
    setShowForm(true);
  };

  const handleDeleteClick = (id: string) => {
    setZoneToDelete(id);
    setShowDeleteDialog(true);
  };

  const handleDelete = async () => {
    if (!zoneToDelete) return;
    try {
      await deleteZone(zoneToDelete);
      setShowDeleteDialog(false);
      setZoneToDelete(null);
    } catch (error) {
      console.error('Error deleting zone:', error);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-2 border-gray-200 rounded-full animate-spin" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Zonas de Delivery</h1>
          <p className="text-muted-foreground">Configura las zonas de entrega y sus tarifas</p>
        </div>
        <Button onClick={() => {
          setEditingZone(null);
          setShowForm(true);
        }}>
          <Plus className="mr-2 h-4" />
          Nueva Zona
        </Button>
      </div>

      {zones.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <MapPin className="w-16 h-16 text-muted-foreground opacity-50 mb-4" />
            <p className="text-sm text-muted-foreground">
              No hay zonas configuradas
            </p>
            <Button 
              variant="outline" 
              onClick={() => {
                setEditingZone(null);
                setShowForm(true);
              }}
              className="mt-4"
            >
              <Plus className="mr-2 h-4" />
              Crear primera zona
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {zones.map((zone: DeliveryZone) => (
            <Card key={zone.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between w-full">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{zone.name}</CardTitle>
                    <Badge variant={zone.status === 'active' ? 'default' : 'secondary'} className="mt-1">
                      {zone.status === 'active' ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(zone)}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => handleDeleteClick(zone.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {zone.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {zone.description}
                  </p>
                )}
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <span>{zone.radiusKm.toFixed(1)} km radio</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-muted-foreground" />
                    <span>${zone.baseFee.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-muted-foreground" />
                    <span>${zone.perKmFee.toFixed(2)}/km</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span>{zone.estimatedMinutesPerKm} min/km</span>
                  </div>
                </div>
                <div className="pt-2 border-t">
                  <p className="text-xs text-muted-foreground">
                    Prioridad: {zone.priority}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <ZoneForm
        open={showForm}
        onClose={() => setShowForm(false)}
        zone={editingZone}
        onSave={() => setShowForm(false)}
      />

      {showDeleteDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background p-6 rounded-lg shadow-lg max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Eliminar Zona</h3>
            <p className="text-sm text-muted-foreground mb-6">
              ¿Estás seguro que deseas eliminar esta zona?
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => {
                setShowDeleteDialog(false);
                setZoneToDelete(null);
              }}>
                Cancelar
              </Button>
              <Button variant="destructive" onClick={handleDelete}>
                Eliminar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
