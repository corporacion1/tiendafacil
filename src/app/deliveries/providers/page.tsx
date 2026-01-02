'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectTrigger, SelectValue, SelectItem } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useDeliveryProviders } from '@/hooks/useDeliveryProviders';
import { useSettings } from '@/contexts/settings-context';
import type { DeliveryProvider } from '@/lib/types';
import { formatWhatsAppLink } from '@/lib/delivery-utils';
import { Phone, User, Plus, Pencil, Trash2, ExternalLink, Truck, MessageCircle, MapPin } from 'lucide-react';

export default function ProvidersPage() {
  const { activeStoreId } = useSettings();
  const { toast } = useToast();
  const {
    providers,
    loading,
    createProvider,
    updateProvider,
    deleteProvider
  } = useDeliveryProviders(activeStoreId);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [providerToDelete, setProviderToDelete] = useState<string | null>(null);
  const [editingProvider, setEditingProvider] = useState<DeliveryProvider | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    providerType: 'internal' as 'internal' | 'external',
    externalServiceName: '',
    externalProviderId: '',
    vehicleType: 'moto' as 'moto' | 'bicycle' | 'car' | 'walking',
    vehiclePlate: '',
    commissionType: 'fixed' as 'fixed' | 'percentage' | 'combination',
    commissionFixedAmount: 0,
    commissionPercentage: 0,
    paymentMethod: 'cash' as 'cash' | 'transfer' | 'external_platform',
    bankAccountInfo: {} as { bankName?: string; accountNumber?: string },
    status: 'active' as 'active' | 'inactive' | 'suspended',
    notes: '',
  });

  const resetForm = () => {
    setFormData({
      name: '',
      phone: '',
      email: '',
      address: '',
      providerType: 'internal',
      externalServiceName: '',
      externalProviderId: '',
      vehicleType: 'moto',
      vehiclePlate: '',
      commissionType: 'fixed',
      commissionFixedAmount: 0,
      commissionPercentage: 0,
      paymentMethod: 'cash',
      bankAccountInfo: {},
      status: 'active',
      notes: '',
    });
    setEditingProvider(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingProvider) {
        await updateProvider(editingProvider.id, formData);
        toast({
          title: 'Proveedor actualizado',
          description: 'El proveedor se actualizó exitosamente',
        });
      } else {
        await createProvider(formData);
        toast({
          title: 'Proveedor creado',
          description: 'El proveedor se creó exitosamente',
        });
      }
      resetForm();
      setShowCreateModal(false);
    } catch (error) {
      console.error('Error al guardar proveedor:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error instanceof Error ? error.message : 'No se pudo guardar el proveedor'
      });
    }
  };

  const handleEdit = (provider: DeliveryProvider) => {
    setEditingProvider(provider);
    setFormData({
      name: provider.name,
      phone: provider.phone,
      email: provider.email || '',
      address: provider.address || '',
      providerType: provider.providerType,
      externalServiceName: provider.externalServiceName || '',
      externalProviderId: provider.externalProviderId || '',
      vehicleType: provider.vehicleType || 'moto',
      vehiclePlate: provider.vehiclePlate || '',
      commissionType: provider.commissionType,
      commissionFixedAmount: provider.commissionFixedAmount,
      commissionPercentage: provider.commissionPercentage,
      paymentMethod: provider.paymentMethod || 'cash',
      bankAccountInfo: provider.bankAccountInfo || {},
      status: provider.status,
      notes: provider.notes || '',
    });
    setShowCreateModal(true);
  };

  const handleDeleteClick = (id: string) => {
    setProviderToDelete(id);
    setShowDeleteDialog(true);
  };

  const handleDelete = async () => {
    if (!providerToDelete) return;
    try {
      await deleteProvider(providerToDelete);
      setShowDeleteDialog(false);
      toast({
        title: 'Proveedor eliminado',
        description: 'El proveedor se eliminó exitosamente',
      });
      setProviderToDelete(null);
    } catch (error) {
      console.error('Error al eliminar proveedor:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error instanceof Error ? error.message : 'No se pudo eliminar el proveedor'
      });
    }
  };

  const sendWhatsAppNotification = (provider: DeliveryProvider) => {
    if (!provider.phone) return;
    const message = `Hola ${provider.name}, tienes una nueva asignación de delivery. Por favor revísala en el sistema.`;
    const link = formatWhatsAppLink(provider.phone, message);
    window.open(link, '_blank');
  };

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-gray-200 rounded-full animate-spin mx-auto" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Proveedores de Delivery</h1>
        </div>
        <Button onClick={() => {
          resetForm();
          setShowCreateModal(true);
        }}>
          <Plus className="mr-2 h-4" />
          Nuevo Proveedor
        </Button>
      </div>

      {providers.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Truck className="w-16 h-16 text-muted-foreground opacity-50 mb-4" />
            <p className="text-sm text-muted-foreground">
              No hay proveedores de delivery configurados
            </p>
            <Button 
              variant="outline" 
              onClick={() => {
                resetForm();
                setShowCreateModal(true);
              }}
              className="mt-4"
            >
              <Plus className="mr-2 h-4" />
              Crear primer proveedor
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {providers.map((provider: DeliveryProvider) => (
            <Card key={provider.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between w-full">
                  <div className="flex items-center gap-3 flex-1">
                    {provider.photoUrl ? (
                      <img
                        src={provider.photoUrl}
                        alt={provider.name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="w-6 h-6 text-primary" />
                      </div>
                    )}
                    <div className="flex-1">
                      <CardTitle className="text-lg">{provider.name}</CardTitle>
                      <Badge variant={provider.status === 'active' ? 'default' : 'secondary'} className="mt-1">
                        {provider.status === 'active' ? 'Activo' : 'Inactivo'}
                      </Badge>
                      {provider.providerType === 'external' && (
                        <Badge variant="outline" className="ml-2 mt-1">
                          {provider.externalServiceName || 'Externo'}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(provider)}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => handleDeleteClick(provider.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium">{provider.phone}</span>
                </div>
                {provider.address && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <span className="line-clamp-1">{provider.address}</span>
                  </div>
                )}
                {provider.vehiclePlate && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>📋 {provider.vehiclePlate}</span>
                  </div>
                )}
                <div className="pt-2 border-t">
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>Comisión:</span>
                    <span className="font-semibold text-foreground">
                      {provider.commissionType === 'fixed' ? `$${provider.commissionFixedAmount.toFixed(2)}`
                        : provider.commissionType === 'percentage'
                        ? `${provider.commissionPercentage}%`
                        : `$${provider.commissionFixedAmount.toFixed(2)} + ${provider.commissionPercentage}%`
                      }
                    </span>
                  </div>
                  {provider.externalServiceName && (
                    <div className="flex items-center justify-between text-sm text-muted-foreground mt-1">
                      <span>Servicio:</span>
                      <span className="font-medium text-foreground">{provider.externalServiceName}</span>
                    </div>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full mt-2"
                  onClick={() => sendWhatsAppNotification(provider)}
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  WhatsApp
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showCreateModal} onOpenChange={(open) => {
        if (!open) resetForm();
        setShowCreateModal(open);
      }}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingProvider ? 'Editar Proveedor' : 'Nuevo Proveedor'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            <div className="space-y-3">
              <h3 className="font-semibold">Información Básica</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Nombre *</Label>
                  <Input
                    id="name"
                    required
                    placeholder="Nombre del proveedor"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Teléfono *</Label>
                  <Input
                    id="phone"
                    required
                    placeholder="+58 412 34567"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="email@ejemplo.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="address">Dirección</Label>
                <Textarea
                  id="address"
                  placeholder="Dirección del proveedor"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold">Tipo de Proveedor</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="providerType">Tipo *</Label>
                  <Select
                    value={formData.providerType}
                    onValueChange={(value) => setFormData({ ...formData, providerType: value as 'internal' | 'external' })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="internal">Interno (Propio)</SelectItem>
                      <SelectItem value="external">Externo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {formData.providerType === 'external' && (
                  <div>
                    <Label htmlFor="externalServiceName">Servicio Externo</Label>
                    <Input
                      id="externalServiceName"
                      placeholder="Ej: Uber Eats, Rappi, etc."
                      value={formData.externalServiceName}
                      onChange={(e) => setFormData({ ...formData, externalServiceName: e.target.value })}
                    />
                  </div>
                )}
              </div>
            </div>

            {formData.providerType === 'internal' && (
              <div className="space-y-3">
                <h3 className="font-semibold">Información del Vehículo</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="vehicleType">Tipo de Vehículo</Label>
                    <Select
                      value={formData.vehicleType}
                      onValueChange={(value) => setFormData({ ...formData, vehicleType: value as 'moto' | 'bicycle' | 'car' | 'walking' })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona vehículo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="moto">🏍️ Moto</SelectItem>
                        <SelectItem value="bicycle">🚴 Bicicleta</SelectItem>
                        <SelectItem value="car">🚗 Auto</SelectItem>
                        <SelectItem value="walking">🚶 Caminando</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {formData.vehicleType !== 'walking' && (
                    <div>
                      <Label htmlFor="vehiclePlate">Placa del vehículo</Label>
                      <Input
                        id="vehiclePlate"
                        placeholder="Ej: ABC-123"
                        value={formData.vehiclePlate}
                        onChange={(e) => setFormData({ ...formData, vehiclePlate: e.target.value })}
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="space-y-3">
              <h3 className="font-semibold">Comisiones</h3>
              <div>
                <Label htmlFor="commissionType">Tipo de Comisión</Label>
                <Select
                  value={formData.commissionType}
                  onValueChange={(value) => setFormData({ ...formData, commissionType: value as 'fixed' | 'percentage' | 'combination' })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona tipo de comisión" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fixed">Fija 💰</SelectItem>
                    <SelectItem value="percentage">Porcentaje 📊</SelectItem>
                    <SelectItem value="combination">Combinada 💰📊</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.commissionType === 'fixed' && (
                <div>
                  <Label htmlFor="commissionFixedAmount">Monto Fijo (BS)</Label>
                  <Input
                    id="commissionFixedAmount"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.commissionFixedAmount || ''}
                    onChange={(e) => setFormData({ ...formData, commissionFixedAmount: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              )}

              {(formData.commissionType === 'percentage' || formData.commissionType === 'combination') && (
                <div>
                  <Label htmlFor="commissionPercentage">Porcentaje (%)</Label>
                  <Input
                    id="commissionPercentage"
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    placeholder="0"
                    value={formData.commissionPercentage || ''}
                    onChange={(e) => setFormData({ ...formData, commissionPercentage: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              )}

              {formData.commissionType === 'combination' && (
                <div>
                  <Label htmlFor="commissionFixedAmount">Monto Fijo Adicional (BS)</Label>
                  <Input
                    id="commissionFixedAmount"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.commissionFixedAmount || ''}
                    onChange={(e) => setFormData({ ...formData, commissionFixedAmount: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              )}

              <div>
                <Label htmlFor="paymentMethod">Método de Pago</Label>
                <Select
                  value={formData.paymentMethod}
                  onValueChange={(value) => setFormData({ ...formData, paymentMethod: value as 'cash' | 'transfer' | 'external_platform' })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Método de pago" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">💰 Efectivo</SelectItem>
                    <SelectItem value="transfer">🏦 Transferencia</SelectItem>
                    <SelectItem value="external_platform">🌐 Plataforma externa</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.paymentMethod === 'transfer' && (
                <div className="space-y-2">
                  <h4 className="font-medium">Datos Bancarios</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="bankName">Nombre del Banco</Label>
                      <Input
                        id="bankName"
                        placeholder="Banco Mercantil, PagaTodo, etc."
                        value={formData.bankAccountInfo?.bankName || ''}
                        onChange={(e) => setFormData({
                          ...formData,
                          bankAccountInfo: {
                            ...formData.bankAccountInfo,
                            bankName: e.target.value
                          }
                        })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="accountNumber">Número de Cuenta</Label>
                      <Input
                        id="accountNumber"
                        placeholder="Número de cuenta bancaria"
                        value={formData.bankAccountInfo?.accountNumber || ''}
                        onChange={(e) => setFormData({
                          ...formData,
                          bankAccountInfo: {
                            ...formData.bankAccountInfo,
                            accountNumber: e.target.value
                          }
                        })}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold">Estado</h3>
              <div>
                <Label htmlFor="status">Estado</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value as 'active' | 'inactive' | 'suspended' })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">🟢 Activo</SelectItem>
                    <SelectItem value="inactive">⏳ Inactivo</SelectItem>
                    <SelectItem value="suspended">🔴 Suspendido</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="notes">Notas Adicionales</Label>
                <Textarea
                  id="notes"
                  placeholder="Opcional: notas adicionales sobre el proveedor"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowCreateModal(false)}>
                Cancelar
              </Button>
              <Button type="submit">
                {editingProvider ? 'Actualizar' : 'Crear'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={showDeleteDialog} onOpenChange={(open) => {
        if (!open) setProviderToDelete(null);
        setShowDeleteDialog(open);
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-destructive">Eliminar Proveedor</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              ¿Estás seguro que deseas eliminar este proveedor?
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Sí, Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
