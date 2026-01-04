"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SubmitButton } from '@/components/ui/submit-button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Separator } from '@/components/ui/separator';
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem, CommandDialog } from '@/components/ui/command';
import { Truck, Phone, MapPin, Package, Plus, CheckCircle, XCircle, Star, Clock, DollarSign, User, ArrowUpDown, Check, Settings as SettingsIcon, Navigation, Save, MapPinned, Pencil, Trash2, ShoppingCart, X } from 'lucide-react';
import { FaWhatsapp, FaTruckMoving } from "react-icons/fa";
import { useDeliveryAssignments } from '@/hooks/useDeliveryAssignments';
import { useDeliveryProviders } from '@/hooks/useDeliveryProviders';
import { useDeliveryZones } from '@/hooks/useDeliveryZones';
import { useDeliveryFeeRules } from '@/hooks/useDeliveryFeeRules';
import { useSettings } from '@/contexts/settings-context';
import { useToast } from '@/hooks/use-toast';
import DeliveryMap from '@/components/deliveries/delivery-map';
import DepartureMap from '@/components/deliveries/departure-map';
import ZoneMap from '@/components/deliveries/zone-map';
import DeliveryMapPreview from '@/components/deliveries/delivery-map-preview';
import type { DeliveryAssignment, DeliveryStatus, DeliveryProvider, DeliveryZone, DeliveryFeeRule } from '@/lib/types';

interface DepartureLocation {
  latitude: number;
  longitude: number;
  address: string;
}

interface DeliveryFormData {
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  notes: string;
  destinationLatitude: number;
  destinationLongitude: number;
}

export default function DdeliveriesPage() {
  const { activeStoreId, userProfile, activeSymbol, activeRate } = useSettings();
  const { toast } = useToast();

  const canConfigureDeparture = userProfile?.role === 'su' || userProfile?.role === 'admin';

  const [departureLocation, setDepartureLocation] = useState<DepartureLocation>({
    latitude: 0,
    longitude: 0,
    address: ''
  });
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [configFormData, setConfigFormData] = useState<DepartureLocation>({
    latitude: 0,
    longitude: 0,
    address: ''
  });

  const [formData, setFormData] = useState<DeliveryFormData>({
    customerName: '',
    customerPhone: '',
    deliveryAddress: '',
    notes: '',
    destinationLatitude: 0,
    destinationLongitude: 0
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Estados
  const [viewMode, setViewMode] = useState<'pending' | 'active'>('pending');
  const [selectedAssignment, setSelectedAssignment] = useState<DeliveryAssignment | null>(null);
  const [selectedProviderId, setSelectedProviderId] = useState<string>('');
  const [selectedZoneId, setSelectedZoneId] = useState<string>('');
  const [calculatedDistance, setCalculatedDistance] = useState<number>(0);
  const [deliveryFee, setDeliveryFee] = useState<number>(0);

  // Modales
  const [showQuickAddProviderModal, setShowQuickAddProviderModal] = useState(false);
  const [showQuickAddZoneModal, setShowQuickAddZoneModal] = useState(false);
  const [showEditZoneModal, setShowEditZoneModal] = useState(false);
  const [editingZone, setEditingZone] = useState<DeliveryZone | null>(null);
  const [showDeleteZoneConfirm, setShowDeleteZoneConfirm] = useState(false);
  const [zoneToDelete, setZoneToDelete] = useState<DeliveryZone | null>(null);
  const [showQuickAddFeeRuleModal, setShowQuickAddFeeRuleModal] = useState(false);
  const [showMapModal, setShowMapModal] = useState(false);
  const [mapDestination, setMapDestination] = useState<{ lat: number; lng: number } | null>(null);
  const [showDepartureMapModal, setShowDepartureMapModal] = useState(false);
  const [showZoneMapModal, setShowZoneMapModal] = useState(false);

  // Estados de formularios
  const [isSubmittingZone, setIsSubmittingZone] = useState(false);
  const [isZoneSuccess, setIsZoneSuccess] = useState(false);
  const [isUpdatingZone, setIsUpdatingZone] = useState(false);
  const [isUpdateZoneSuccess, setIsUpdateZoneSuccess] = useState(false);
  const [isSubmittingProvider, setIsSubmittingProvider] = useState(false);
  const [isProviderSuccess, setIsProviderSuccess] = useState(false);
  const [isDeletingZone, setIsDeletingZone] = useState(false);
  const [isSubmittingConfig, setIsSubmittingConfig] = useState(false);

  // Modales de gestión (zones y fee rules)
  const [showManageZonesModal, setShowManageZonesModal] = useState(false);
  const [showManageFeeRulesModal, setShowManageFeeRulesModal] = useState(false);
  
  // Hooks
  const { 
    fetchPendingOrders, 
    fetchActiveAssignments,
    createAssignment,
    updateAssignmentStatus,
    completeDelivery,
    cancelDelivery 
  } = useDeliveryAssignments(activeStoreId || '');
  const { providers, createProvider } = useDeliveryProviders(activeStoreId || '');
  const { zones, createZone, updateZone, deleteZone } = useDeliveryZones(activeStoreId || '');
  const { rules, createRule } = useDeliveryFeeRules(activeStoreId || '');

  // Datos del formulario para agregar repartidor rápido
  const [quickProviderFormData, setQuickProviderFormData] = useState({
    name: '',
    phone: '',
    providerType: 'internal' as 'internal' | 'external',
    vehicleType: 'moto' as 'moto' | 'bicycle' | 'car' | 'walking',
    vehiclePlate: '',
    commissionType: 'fixed' as 'fixed' | 'percentage' | 'combination',
    commissionFixedAmount: 0,
    commissionPercentage: 0,
    status: 'active' as 'active' | 'inactive' | 'suspended',
  });

  const [quickZoneFormData, setQuickZoneFormData] = useState({
    name: '',
    description: '',
    centerLatitude: 0,
    centerLongitude: 0,
    radiusKm: 0,
    baseFee: 0,
    perKmFee: 0,
    perKmFeeOutsideZone: 0,
    estimatedMinutesPerKm: 5,
    priority: 1,
    status: 'active' as 'active' | 'inactive',
  });

  const [editZoneFormData, setEditZoneFormData] = useState({
    name: '',
    description: '',
    centerLatitude: 0,
    centerLongitude: 0,
    radiusKm: 0,
    baseFee: 0,
    perKmFee: 0,
    perKmFeeOutsideZone: 0,
    estimatedMinutesPerKm: 5,
    priority: 1,
    status: 'active' as 'active' | 'inactive',
  });

  const [showEditZoneMapModal, setShowEditZoneMapModal] = useState(false);

  const [pendingOrders, setPendingOrders] = useState<any[]>([]);
  const [activeAssignments, setActiveAssignments] = useState<DeliveryAssignment[]>([]);

  // -- Estado para modal de detalle de pedido con mapa --
  const [selectedOrderForDetail, setSelectedOrderForDetail] = useState<any | null>(null);
  const [isOrderDetailModalOpen, setIsOrderDetailModalOpen] = useState(false);

  // -- Estado para cancelar pedido --
  const [orderToCancel, setOrderToCancel] = useState<any | null>(null);
  const [isCancelOrderDialogOpen, setIsCancelOrderDialogOpen] = useState(false);

  // Cargar ubicación de partida desde localStorage
  useEffect(() => {
    loadDepartureLocation();
  }, []);

  // Cargar datos de la zona cuando se abre el modal de edición
  useEffect(() => {
    if (editingZone) {
      setEditZoneFormData({
        name: editingZone.name || '',
        description: editingZone.description || '',
        centerLatitude: editingZone.centerLatitude || 0,
        centerLongitude: editingZone.centerLongitude || 0,
        radiusKm: editingZone.radiusKm || 0,
        baseFee: editingZone.baseFee || 0,
        perKmFee: editingZone.perKmFee || 0,
        perKmFeeOutsideZone: editingZone.perKmFeeOutsideZone || 0,
        estimatedMinutesPerKm: editingZone.estimatedMinutesPerKm || 5,
        priority: editingZone.priority || 1,
        status: editingZone.status || 'active',
      });
    }
  }, [editingZone]);

  const loadDepartureLocation = () => {
    try {
      const saved = localStorage.getItem('TIENDA_FACIL_DEPARTURE_LOCATION');
      if (saved) {
        const location = JSON.parse(saved) as DepartureLocation;
        setDepartureLocation(location);
        setConfigFormData(location);
      }
    } catch (error) {
      console.error('Error loading departure location:', error);
    }
  };

  const loadData = async () => {
    try {
      const [pendingData, activeData] = await Promise.all([
        fetchPendingOrders(),
        fetchActiveAssignments()
      ]);
      setPendingOrders(pendingData);
      setActiveAssignments(activeData);
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

    // NO actualizar departureLocation o configFormData al cargar un pedido
    // Solo usarlos para calcular distancias, no modificarlos

    if (assignment.orderCustomerName) {
      setFormData({
        customerName: assignment.orderCustomerName,
        customerPhone: assignment.orderCustomerPhone || '',
        deliveryAddress: assignment.orderCustomerAddress || '',
        notes: assignment.deliveryNotes || '',
        destinationLatitude: assignment.destinationLatitude || 0,
        destinationLongitude: assignment.destinationLongitude || 0
      });

      if (assignment.destinationLatitude && assignment.destinationLongitude) {
        setMapDestination({
          lat: assignment.destinationLatitude,
          lng: assignment.destinationLongitude
        });
      }

      // Calcular distancia si no está pre-calculada
      if (assignment.destinationLatitude && assignment.destinationLongitude &&
          departureLocation.latitude && departureLocation.longitude &&
          !assignment.distanceKm) {
        const distance = calculateDistance(
          departureLocation.latitude,
          departureLocation.longitude,
          assignment.destinationLatitude,
          assignment.destinationLongitude
        );
        setCalculatedDistance(distance);

        // Calcular tarifa si no está pre-calculada
        const selectedZone = zones.find(z => z.id === assignment.deliveryZoneId);
        if (selectedZone && assignment.deliveryZoneId) {
          setSelectedZoneId(assignment.deliveryZoneId);
          const fee = distance * selectedZone.perKmFee;
          setDeliveryFee(fee);
        }
      } else if (assignment.distanceKm) {
        // Usar distancia pre-calculada
        setCalculatedDistance(assignment.distanceKm);
        if (assignment.deliveryZoneId) {
          setSelectedZoneId(assignment.deliveryZoneId as string);
        }
        if (assignment.deliveryFee) {
          setDeliveryFee(assignment.deliveryFee);
        }
      }
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      await updateAssignmentStatus(id, newStatus as DeliveryStatus);
      await loadData();
    } catch (error) {
      console.error('Error updating delivery status:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo actualizar el estado del reparto'
      });
    }
  };

  const handleMarkComplete = async () => {
    if (!selectedAssignment) return;
    try {
      await completeDelivery(selectedAssignment.id, {
        customerRating: 5,
        customerFeedback: ''
      });
      toast({
        title: 'Reparto completado',
        description: 'El reparto se marcó como entregado'
      });
      await loadData();
      setSelectedAssignment(null);
    } catch (error) {
      console.error('Error completing delivery:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo completar el reparto'
      });
    }
  };

  const handleCancel = async (id: string, reason: string) => {
    try {
      await cancelDelivery(id, reason);
      toast({
        title: 'Reparto cancelado',
        description: 'El reparto se canceló exitosamente'
      });
      await loadData();
    } catch (error) {
      console.error('Error cancelling delivery:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo cancelar el reparto'
      });
    }
  };

  const handleConfirmCancelOrder = async () => {
    if (!orderToCancel) return;
    try {
      await cancelDelivery(orderToCancel.orderId || orderToCancel.id, 'Cancelado por el operador');
      toast({
        title: 'Pedido cancelado',
        description: 'El pedido ha sido cancelado exitosamente'
      });
      await loadData();
    } catch (error) {
      console.error('Error cancelling order:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo cancelar el pedido'
      });
    } finally {
      setIsCancelOrderDialogOpen(false);
      setOrderToCancel(null);
    }
  };

  const handleQuickAddProvider = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingProvider(true);
    setIsProviderSuccess(false);

    try {
      await createProvider({
        ...quickProviderFormData,
        // Convertir a moneda principal antes de guardar
        commissionFixedAmount: quickProviderFormData.commissionFixedAmount / activeRate,
      });

      // Mostrar estado de éxito
      setIsProviderSuccess(true);
      setTimeout(() => {
        setIsProviderSuccess(false);
        setShowQuickAddProviderModal(false);
        setQuickProviderFormData({
          name: '',
          phone: '',
          providerType: 'internal',
          vehicleType: 'moto',
          vehiclePlate: '',
          commissionType: 'fixed',
          commissionFixedAmount: 0,
          commissionPercentage: 0,
          status: 'active',
        });
        setIsSubmittingProvider(false);
      }, 1500);

      toast({
        title: 'Repartidor agregado',
        description: `El repartidor ${quickProviderFormData.name} se creó exitosamente`
      });
    } catch (error) {
      console.error('Error adding provider:', error);
      setIsSubmittingProvider(false);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error instanceof Error ? error.message : 'No se pudo agregar el repartidor'
      });
    }
  };

  const activeProviders = providers.filter(p => p.status === 'active');

  const getProviderStats = (providerId: string) => {
    const providerAssignments = activeAssignments.filter(a => a.deliveryProviderId === providerId);
    const completed = providerAssignments.filter(a => a.deliveryStatus === 'delivered');
    const pending = providerAssignments.filter(a => ['pending', 'picked_up', 'in_transit'].includes(a.deliveryStatus));
    const totalEarnings = completed.reduce((sum, a) => sum + (a.providerCommissionAmount || 0), 0);
    
    return {
      total: providerAssignments.length,
      completed: completed.length,
      pending: pending.length,
      earnings: totalEarnings,
    };
  };

  const selectedProvider = providers.find(p => p.id === selectedProviderId);
  const providerStats = selectedProviderId ? getProviderStats(selectedProviderId) : null;

  const handleAddProvider = (provider: DeliveryProvider) => {
    setSelectedProviderId(provider.id);
  };

  // Calcular distancia entre dos coordenadas (fórmula de Haversine)
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Radio de la Tierra en km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Calcular zona automáticamente basándose en la distancia
  useEffect(() => {
    if (!departureLocation.latitude || !departureLocation.longitude) return;
    if (!formData.destinationLatitude || !formData.destinationLongitude) return;

    // Calcular distancia real del viaje (partida -> destino)
    const tripDistance = calculateDistance(
      departureLocation.latitude,
      departureLocation.longitude,
      formData.destinationLatitude,
      formData.destinationLongitude
    );
    setCalculatedDistance(tripDistance);

    // Seleccionar zona según: zona.rango >= distancia.entrega
    // Se selecciona la zona con el menor radio que sea >= distancia
    const activeZones = zones.filter(z => z.status === 'active');

    // Filtrar zonas donde radiusKm >= distancia y ordenar por radio menor
    const eligibleZones = activeZones
      .filter(zone => zone.radiusKm >= tripDistance)
      .sort((a, b) => a.radiusKm - b.radiusKm);

    if (eligibleZones.length > 0) {
      // Seleccionar la zona con el menor radio que cubra la distancia
      const bestZone = eligibleZones[0];
      if (bestZone.id !== selectedZoneId) {
        setSelectedZoneId(bestZone.id);
      }
    } else if (activeZones.length > 0 && !selectedZoneId) {
      // Si ninguna zona cubre la distancia, seleccionar la zona con mayor radio
      const maxRadiusZone = activeZones.reduce((prev, current) =>
        (prev.radiusKm > current.radiusKm) ? prev : current
      );
      setSelectedZoneId(maxRadiusZone.id);
    }

    // IMPORTANTE: NO modificar departureLocation ni configFormData aquí
    // La ubicación de partida debe mantenerse de localStorage
  }, [departureLocation, zones, formData.destinationLatitude, formData.destinationLongitude]);

  // Calcular tarifa de delivery cuando cambia la zona o la distancia
  useEffect(() => {
    if (!selectedZoneId || !calculatedDistance) return;

    const selectedZone = zones.find(z => z.id === selectedZoneId);
    if (selectedZone && calculatedDistance > 0) {
      const calculatedFee = calculatedDistance * selectedZone.perKmFee;
      setDeliveryFee(calculatedFee);
    }
  }, [selectedZoneId, calculatedDistance, zones]);

  // Actualizar zona cuando se selecciona una asignación (solo si no se ha establecido desde handleSelectAssignment)
  useEffect(() => {
    if (selectedAssignment?.deliveryZoneId && selectedZoneId === '') {
      setSelectedZoneId(selectedAssignment.deliveryZoneId || '');
    }
  }, [selectedAssignment, selectedZoneId]);

  // Función para agregar nueva zona
  const handleQuickAddZone = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingZone(true);
    setIsZoneSuccess(false);

    try {
      await createZone({
        ...quickZoneFormData,
        // Convertir a moneda principal antes de guardar
        baseFee: quickZoneFormData.baseFee / activeRate,
        perKmFee: quickZoneFormData.perKmFee / activeRate,
        perKmFeeOutsideZone: quickZoneFormData.perKmFeeOutsideZone / activeRate,
        storeId: activeStoreId || ''
      });

      // Mostrar estado de éxito
      setIsZoneSuccess(true);
      setTimeout(() => {
        setIsZoneSuccess(false);
        setShowQuickAddZoneModal(false);
        setQuickZoneFormData({
          name: '',
          description: '',
          centerLatitude: 0,
          centerLongitude: 0,
          radiusKm: 0,
          baseFee: 0,
          perKmFee: 0,
          perKmFeeOutsideZone: 0,
          estimatedMinutesPerKm: 5,
          priority: 1,
          status: 'active',
        });
        setIsSubmittingZone(false);
      }, 1500);

      toast({
        title: 'Zona agregada',
        description: `La zona ${quickZoneFormData.name} se creó exitosamente`
      });
    } catch (error) {
      console.error('Error adding zone:', error);
      setIsSubmittingZone(false);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error instanceof Error ? error.message : 'No se pudo agregar la zona'
      });
    }
  };

  const handleEditZone = (zone: DeliveryZone, e: React.MouseEvent) => {
    console.log('handleEditZone called with zone:', zone);
    e.preventDefault();
    e.stopPropagation();
    setEditingZone(zone);
    setShowEditZoneModal(true);
  };

  const handleDeleteZone = (zone: DeliveryZone, e: React.MouseEvent) => {
    console.log('handleDeleteZone called with zone:', zone);
    e.preventDefault();
    e.stopPropagation();
    setZoneToDelete(zone);
    setShowDeleteZoneConfirm(true);
  };

  const confirmDeleteZone = async () => {
    if (!zoneToDelete) return;
    setIsDeletingZone(true);

    try {
      await deleteZone(zoneToDelete.id);
      toast({
        title: 'Zona eliminada',
        description: `La zona ${zoneToDelete.name} se eliminó exitosamente`
      });
      setShowDeleteZoneConfirm(false);
      setZoneToDelete(null);
      setIsDeletingZone(false);
    } catch (error) {
      console.error('Error deleting zone:', error);
      setIsDeletingZone(false);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo eliminar la zona'
      });
    }
  };

  const handleUpdateZone = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingZone) return;

    setIsUpdatingZone(true);
    setIsUpdateZoneSuccess(false);

    try {
      await updateZone(editingZone.id, {
        ...editZoneFormData,
        storeId: activeStoreId || '',
        baseFee: editZoneFormData.baseFee / activeRate,
        perKmFee: editZoneFormData.perKmFee / activeRate,
        perKmFeeOutsideZone: editZoneFormData.perKmFeeOutsideZone / activeRate,
      });

      // Mostrar estado de éxito
      setIsUpdateZoneSuccess(true);
      setTimeout(() => {
        setIsUpdateZoneSuccess(false);
        setShowEditZoneModal(false);
        setEditingZone(null);
        setIsUpdatingZone(false);
      }, 1500);

      toast({
        title: 'Zona actualizada',
        description: `La zona ${editZoneFormData.name} se actualizó exitosamente`
      });
    } catch (error) {
      console.error('Error updating zone:', error);
      setIsUpdatingZone(false);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error instanceof Error ? error.message : 'No se pudo actualizar la zona'
      });
    }
  };

  // Configuración de ubicación de partida
  const handleSaveConfig = async () => {
    if (!configFormData.latitude || !configFormData.longitude) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Debes ingresar latitud y longitud'
      });
      return;
    }

    try {
      setIsSubmittingConfig(true);
      localStorage.setItem('TIENDA_FACIL_DEPARTURE_LOCATION', JSON.stringify(configFormData));
      setDepartureLocation(configFormData);
      setIsConfigModalOpen(false);
      toast({
        title: 'Configuración guardada',
        description: 'Ubicación de partida actualizada'
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo guardar la configuración'
      });
    } finally {
      setIsSubmittingConfig(false);
    }
  };

  const handleGetMyLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setConfigFormData({
            ...configFormData,
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
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

  // Crear o actualizar asignación de delivery
  const handleSubmitDelivery = async () => {
    if (!formData.customerName || !formData.deliveryAddress) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Debes ingresar nombre del cliente y dirección de entrega'
      });
      return;
    }

    if (!departureLocation.latitude || !departureLocation.longitude) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No hay ubicación de partida configurada'
      });
      return;
    }

    if (!selectedProviderId) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Debes seleccionar un repartidor'
      });
      return;
    }

    setIsSubmitting(true);

    try {
      if (selectedAssignment) {
        // Actualizar asignación existente
        const response = await fetch(`/api/delivery-assignments/${selectedAssignment.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderCustomerName: formData.customerName,
            orderCustomerPhone: formData.customerPhone,
            orderCustomerAddress: formData.deliveryAddress,
            deliveryNotes: formData.notes,
            storeLatitude: departureLocation.latitude,
            storeLongitude: departureLocation.longitude,
            deliveryProviderId: selectedProviderId,
            deliveryZoneId: selectedZoneId || null,
            distanceKm: calculatedDistance
          })
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Error al actualizar asignación');
        }

        toast({
          title: 'Asignación actualizada',
          description: `La asignación ${selectedAssignment.id} se actualizó exitosamente`
        });
      } else {
        // Usar la tarifa editable del estado

        // Crear nueva asignación
        const response = await fetch('/api/delivery-assignments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderId: `ORD-${Date.now()}`,
            storeId: activeStoreId,
            deliveryProviderId: selectedProviderId,
            customerName: formData.customerName,
            customerPhone: formData.customerPhone,
            customerAddress: formData.deliveryAddress,
            orderTotal: 0,
            orderItems: [],
            destinationLat: formData.destinationLatitude || 0,
            destinationLon: formData.destinationLongitude || 0,
            storeLat: departureLocation.latitude,
            storeLon: departureLocation.longitude,
            deliveryFee: deliveryFee,
            deliveryZoneId: selectedZoneId || null,
            distanceKm: calculatedDistance,
            deliveryNotes: formData.notes,
            assignedBy: userProfile?.displayName || userProfile?.email || 'Usuario'
          })
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Error al crear asignación');
        }

        const data = await response.json();
        setSelectedAssignment(data);

        toast({
          title: 'Asignación creada',
          description: `La asignación ${data.id} se creó exitosamente`
        });

        setFormData({
          customerName: '',
          customerPhone: '',
          deliveryAddress: '',
          notes: '',
          destinationLatitude: 0,
          destinationLongitude: 0
        });
        setMapDestination(null);
        setCalculatedDistance(0);
        setDeliveryFee(0);
      }

      await loadData();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'No se pudo procesar la solicitud'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Encabezado */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Administración de Entregas</h1>
          <p className="text-muted-foreground">
            Gestiona pedidos con delivery y asigna repartidores
          </p>
        </div>
      </div>

      {/* Layout 60-40% */}
      <div className="grid lg:grid-cols-5 gap-6 w-full">
        {/* Tarjeta 1: Pedidos/Asignaciones (60% = col-span-3) */}
        <div className="lg:col-span-3 space-y-4">
          <Card className="w-full">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Pedidos de Delivery</CardTitle>
                <div className="flex gap-2">
                  <Button 
                    variant={viewMode === 'pending' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('pending')}
                  >
                    Pendientes
                  </Button>
                  <Button
                    variant={viewMode === 'active' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('active')}
                  >
                    Activos
                  </Button>
                </div>
              </div>
            </CardHeader>
            <Separator />
            <CardContent className="space-y-3 max-h-[calc(100vh-200px)] overflow-y-auto">
              {viewMode === 'pending' ? (
                pendingOrders.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                    <Package className="w-16 h-16 mb-4 opacity-50" />
                    <p>No hay pedidos pendientes</p>
                    <p className="text-sm">Los pedidos nuevos aparecerán aquí</p>
                  </div>
                ) : (
                  pendingOrders.map((order: any) => (
                    <div 
                      key={order.orderId}
                      className="p-4 border rounded-lg hover:bg-accent/50 transition-colors cursor-pointer"
                      onClick={() => {
                        setSelectedOrderForDetail(order);
                        setIsOrderDetailModalOpen(true);
                      }}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-semibold">#{order.orderId}</span>
                            <Badge>pendiente</Badge>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <User className="w-4 h-4" />
                            <span>{order.customerName}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Phone className="w-4 h-4" />
                            <span>{order.customerPhone || 'N/A'}</span>
                          </div>
                          {order.customerAddress && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <MapPin className="w-4 h-4" />
                              <span className="line-clamp-1">{order.customerAddress}</span>
                            </div>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-semibold">{activeSymbol}{(order.total * activeRate).toFixed(2)}</p>
                          {order.deliveryFee > 0 && (
                            <p className="text-sm text-muted-foreground">
                              +{activeSymbol}{(order.deliveryFee * activeRate).toFixed(2)} delivery
                            </p>
                          )}
                        </div>
                      </div>
                      <Separator className="my-3" />
                      <div className="flex flex-wrap gap-2 justify-end">
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-destructive text-destructive hover:bg-destructive hover:text-white w-full sm:w-auto"
                          onClick={(e) => {
                            e.stopPropagation();
                            setOrderToCancel(order);
                            setIsCancelOrderDialogOpen(true);
                          }}
                        >
                          <X className="h-4 w-4 sm:mr-2" />
                          <span className="hidden sm:inline">Cancelar</span>
                        </Button>
                        {order.customerPhone && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-[#25D366] text-[#25D366] hover:bg-red-500 hover:text-white w-full sm:w-auto"
                            onClick={(e) => {
                              e.stopPropagation();
                              window.open(
                                `https://wa.me/${order.customerPhone.replace(/\D/g, '')}`,
                                "_blank",
                                "noopener,noreferrer",
                              );
                            }}
                          >
                            <FaWhatsapp className="h-4 w-4 sm:mr-2" />
                            <span className="hidden sm:inline">WhatsApp</span>
                          </Button>
                        )}
                        <Button
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectAssignment({
                              id: order.orderId,
                              orderId: order.orderId,
                              storeId: order.storeId || activeStoreId || '',
                              deliveryProviderId: '',
                              orderCustomerName: order.customerName,
                              orderCustomerPhone: order.customerPhone,
                              orderCustomerAddress: order.customerAddress,
                              orderTotal: order.total,
                              orderItems: order.items || [],
                              deliveryFee: order.deliveryFee || 0,
                              destinationLatitude: order.latitude || 0,
                              destinationLongitude: order.longitude || 0,
                              deliveryStatus: 'pending' as DeliveryStatus,
                              deliveryNotes: order.deliveryNotes || order.notes || '',
                              whatsappNotificationSent: false,
                              assignedAt: new Date().toISOString(),
                              createdAt: new Date().toISOString(),
                              updatedAt: new Date().toISOString(),
                            } as DeliveryAssignment);
                          }}
                          className="w-full sm:w-auto"
                        >
                          <ShoppingCart className="h-4 w-4 sm:mr-2" />
                          <span className="hidden sm:inline">Cargar</span>
                        </Button>
                      </div>
                    </div>
                  ))
                )
              ) : (
                activeAssignments.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                    <Truck className="w-16 h-16 mb-4 opacity-50" />
                    <p>No hay asignaciones activas</p>
                    <p className="text-sm">Los repartidores asignados aparecerán aquí</p>
                  </div>
                ) : (
                  activeAssignments.map((assignment: DeliveryAssignment) => (
                    <div 
                      key={assignment.id}
                      className="p-4 border rounded-lg hover:bg-accent/50 transition-colors cursor-pointer"
                      onClick={() => handleSelectAssignment(assignment)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-semibold">#{assignment.orderId}</span>
                            <Badge variant={assignment.deliveryStatus === 'in_transit' ? 'default' : 'secondary'}>
                              {assignment.deliveryStatus === 'pending' && 'pendiente'}
                              {assignment.deliveryStatus === 'picked_up' && 'recogido'}
                              {assignment.deliveryStatus === 'in_transit' && 'en ruta'}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <User className="w-4 h-4" />
                            <span>{assignment.orderCustomerName}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Phone className="w-4 h-4" />
                            <span>{assignment.orderCustomerPhone || 'N/A'}</span>
                          </div>
                          {assignment.orderCustomerAddress && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <MapPin className="w-4 h-4" />
                              <span className="line-clamp-1">{assignment.orderCustomerAddress}</span>
                            </div>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-semibold">{activeSymbol}{(assignment.orderTotal * activeRate).toFixed(2)}</p>
                          {assignment.deliveryFee > 0 && (
                            <p className="text-sm text-muted-foreground">
                              +{activeSymbol}{(assignment.deliveryFee * activeRate).toFixed(2)} delivery
                            </p>
                          )}
                        </div>
                      </div>
                      <Separator className="my-3" />
                      <div className="flex flex-wrap gap-2 justify-end">
                        <Button
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectAssignment(assignment);
                          }}
                          className="w-full sm:w-auto"
                        >
                          <ShoppingCart className="h-4 w-4 sm:mr-2" />
                          <span className="hidden sm:inline">Cargar</span>
                        </Button>
                        {assignment.orderCustomerPhone && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-[#25D366] text-[#25D366] hover:bg-red-500 hover:text-white w-full sm:w-auto"
                            onClick={(e) => {
                              e.stopPropagation();
                              window.open(
                                `https://wa.me/${assignment.orderCustomerPhone?.replace(/\D/g, '')}`,
                                "_blank",
                                "noopener,noreferrer",
                              );
                            }}
                          >
                            <FaWhatsapp className="h-4 w-4 sm:mr-2" />
                            <span className="hidden sm:inline">WhatsApp</span>
                          </Button>
                        )}
                        {(assignment.deliveryStatus === 'pending' || 
                          assignment.deliveryStatus === 'picked_up' || 
                          assignment.deliveryStatus === 'in_transit') && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-destructive text-destructive hover:bg-destructive hover:text-white w-full sm:w-auto"
                            onClick={(e) => {
                              e.stopPropagation();
                              setOrderToCancel(assignment);
                              setIsCancelOrderDialogOpen(true);
                            }}
                          >
                            <X className="h-4 w-4 sm:mr-2" />
                            <span className="hidden sm:inline">Cancelar</span>
                          </Button>
                        )}
                      </div>
                    </div>
                  ))
                )
              )}
            </CardContent>
          </Card>
        </div>

        {/* Tarjeta 2: Control de Reparto (40% = col-span-2) */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="w-full sticky top-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Control de Reparto</CardTitle>
                {canConfigureDeparture && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsConfigModalOpen(true)}
                  >
                    <SettingsIcon className="h-4 w-4" />
                  </Button>
                )}
              </div>
              {/* Badge con ubicación de partida */}
              {departureLocation.latitude && departureLocation.longitude && (
                <Badge variant="secondary" className="flex items-center gap-1 mt-2">
                  <Navigation className="h-3 w-3" />
                  Partida: {departureLocation.latitude.toFixed(4)}, {departureLocation.longitude.toFixed(4)}
                </Badge>
              )}
            </CardHeader>
            <Separator />
            <CardContent className="space-y-4 pt-4">
              {/* Formulario de delivery */}
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="customerName">Nombre del Cliente *</Label>
                    <Input
                      id="customerName"
                      placeholder="Nombre completo"
                      value={formData.customerName}
                      onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="customerPhone">Teléfono</Label>
                    <Input
                      id="customerPhone"
                      placeholder="+58 412 3456789"
                      value={formData.customerPhone}
                      onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="deliveryAddress">Dirección de Entrega *</Label>
                  <Input
                    id="deliveryAddress"
                    placeholder="Dirección completa de entrega"
                    value={formData.deliveryAddress}
                    onChange={(e) => setFormData({ ...formData, deliveryAddress: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notas</Label>
                  <Input
                    id="notes"
                    placeholder="Notas adicionales para la entrega"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="destinationLat">Ubicación de Entrega</Label>
                  <div className="flex gap-2">
                    <Input
                      id="destinationLat"
                      type="number"
                      step="0.000001"
                      placeholder="Latitud: 10.4806"
                      value={formData.destinationLatitude || ''}
                      onChange={(e) => setFormData({ ...formData, destinationLatitude: parseFloat(e.target.value) || 0 })}
                    />
                    <Input
                      id="destinationLon"
                      type="number"
                      step="0.000001"
                      placeholder="Longitud: -66.8983"
                      value={formData.destinationLongitude || ''}
                      onChange={(e) => setFormData({ ...formData, destinationLongitude: parseFloat(e.target.value) || 0 })}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowMapModal(true)}
                      className="shrink-0"
                    >
                      <MapPinned className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {calculatedDistance > 0 && (
                  <div className="space-y-2">
                    <div className="text-sm text-muted-foreground">
                      Distancia calculada: {calculatedDistance.toFixed(2)} km
                    </div>
                    <div className="flex items-center gap-2">
                      <Label htmlFor="deliveryFee" className="text-sm">Tarifa de Delivery:</Label>
                      <div className="relative flex-1 max-w-48">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                          {activeSymbol}
                        </span>
                        <Input
                          id="deliveryFee"
                          type="number"
                          step="0.01"
                          value={(deliveryFee * activeRate).toFixed(2)}
                          onChange={(e) => setDeliveryFee((parseFloat(e.target.value) || 0) / activeRate)}
                          className="pl-8 w-full h-9"
                        />
                      </div>
                      <span className="text-sm text-muted-foreground text-xs">
                        ({selectedZoneId ? `${((zones.find(z => z.id === selectedZoneId)?.perKmFee || 0) * activeRate).toFixed(2)} ${activeSymbol}/km)` : '0'}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <Separator />

              {/* Select de zonas con botón al lado */}
              <div>
                <Label htmlFor="zone-select" className="mb-2 block">Seleccionar Zona</Label>
                <div className="flex gap-2">
                  <Select
                    value={selectedZoneId}
                    onValueChange={setSelectedZoneId}
                  >
                    <SelectTrigger id="zone-select" className="w-full h-10">
                      {selectedZoneId ? (
                        <div className="flex items-center justify-between">
                          <span>{zones.find(z => z.id === selectedZoneId)?.name || 'Zona seleccionada'}</span>
                          <ArrowUpDown className="ml-1 sm:ml-2 h-3 w-3 shrink-0 opacity-50" />
                        </div>
                      ) : (
                        <span>Selecciona una zona...</span>
                      )}
                    </SelectTrigger>
                    <SelectContent>
                      {zones.filter(z => z.status === 'active').length === 0 ? (
                        <div className="p-2 text-sm text-muted-foreground text-center">
                          No hay zonas activas
                        </div>
                      ) : (
                        zones.filter(z => z.status === 'active').map((zone) => (
                          <SelectItem
                            key={zone.id}
                            value={zone.id}
                            className="flex items-center justify-between py-2 pr-2 pl-8 group"
                            style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}
                          >
                            <span className="font-medium text-sm truncate" style={{ flex: 1, marginRight: '12px' }}>{zone.name}</span>
                            <div style={{ display: 'flex', gap: '4px', flexShrink: 0, alignItems: 'center' }}>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 hover:bg-accent hover:text-white text-black/70"
                                onMouseDown={(e) => {
                                  console.log('Click en editar zona:', zone);
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handleEditZone(zone, e);
                                }}
                                title="Editar zona"
                              >
                                <Pencil className="h-3 w-3" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 hover:bg-destructive hover:text-white text-black/70"
                                onMouseDown={(e) => {
                                  console.log('Click en eliminar zona:', zone);
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handleDeleteZone(zone, e);
                                }}
                                title="Eliminar zona"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <Button
                    onClick={() => setShowQuickAddZoneModal(true)}
                    variant="outline"
                    size="icon"
                    className="h-10 w-10 shrink-0"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <Separator />

              {/* Select de repartidores con botón al lado */}
              <div>
                <Label htmlFor="provider-select" className="mb-2 block">Seleccionar Repartidor</Label>
                <div className="flex gap-2">
                  <Select
                    value={selectedProviderId}
                    onValueChange={setSelectedProviderId}
                  >
                    <SelectTrigger id="provider-select" className="w-full h-10">
                      {selectedProvider ? (
                        <div className="flex items-center justify-between">
                          <span>{selectedProvider.name}</span>
                          <ArrowUpDown className="ml-1 sm:ml-2 h-3 w-3 shrink-0 opacity-50" />
                        </div>
                      ) : (
                        <span>Selecciona un repartidor...</span>
                      )}
                    </SelectTrigger>
                    <SelectContent>
                      {activeProviders.length === 0 ? (
                        <div className="p-2 text-sm text-muted-foreground text-center">
                          No hay repartidores activos
                        </div>
                      ) : (
                        activeProviders.map((provider) => (
                          <SelectItem
                            key={provider.id}
                            value={provider.id}
                            className="flex items-center justify-between group"
                          >
                            <div className="flex flex-col min-w-0">
                              <span className="truncate">{provider.name}</span>
                              <span className="text-xs text-muted-foreground">{provider.phone}</span>
                            </div>
                            <Check className="h-4 w-4 opacity-50 ml-auto" />
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <Button
                    onClick={() => setShowQuickAddProviderModal(true)}
                    variant="outline"
                    size="icon"
                    className="h-10 w-10 shrink-0"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Botón para procesar/guardar */}
              <Button
                className="w-full"
                onClick={handleSubmitDelivery}
                disabled={isSubmitting}
              >
                <Save className="mr-2 h-4 w-4" />
                {isSubmitting ? 'Procesando...' : selectedAssignment ? 'Actualizar Asignación' : 'Crear Asignación'}
              </Button>

              {/* Estadísticas del repartidor seleccionado */}
              {selectedProvider && providerStats && (
                <>
                  <Separator />
                  <div className="space-y-4 pt-4">
                    <h4 className="font-semibold text-sm mb-3">Información del Repartidor</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium">{selectedProvider.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-muted-foreground" />
                        <span>{selectedProvider.phone}</span>
                      </div>
                      <div className="flex items-center gap-2 col-span-2">
                        <Truck className="w-4 h-4 text-muted-foreground" />
                        <span>
                          {selectedProvider.vehicleType === 'moto' && '🏍️ Moto'}
                          {selectedProvider.vehicleType === 'bicycle' && '🚴 Bicicleta'}
                          {selectedProvider.vehicleType === 'car' && '🚗 Auto'}
                          {selectedProvider.vehicleType === 'walking' && '🚶 Caminando'}
                          {selectedProvider.vehiclePlate && ` (${selectedProvider.vehiclePlate})`}
                        </span>
                      </div>
                    </div>
                  </div>

                  <h4 className="font-semibold text-sm mb-3">Estadísticas del Día</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 border rounded-lg bg-accent/10">
                      <div className="text-xs text-muted-foreground mb-1">Total Entregas</div>
                      <div className="text-2xl font-bold">{providerStats.total}</div>
                    </div>
                    <div className="p-3 border rounded-lg bg-green-500/10">
                      <div className="text-xs text-muted-foreground mb-1">Completadas</div>
                      <div className="text-2xl font-bold text-green-600">{providerStats.completed}</div>
                    </div>
                    <div className="p-3 border rounded-lg bg-yellow-500/10">
                      <div className="text-xs text-muted-foreground mb-1">Pendientes</div>
                      <div className="text-2xl font-bold text-yellow-600">{providerStats.pending}</div>
                    </div>
                    <div className="p-3 border rounded-lg bg-blue-500/10">
                      <div className="text-xs text-muted-foreground mb-1">Ganancia</div>
                      <div className="text-2xl font-bold text-blue-600">{activeSymbol}{(providerStats.earnings * activeRate).toFixed(2)}</div>
                    </div>
                  </div>
                </>
              )}

              {/* Detalles de asignación seleccionada */}
              {selectedAssignment && (
                <>
                  <Separator />
                  <div className="space-y-3 pt-4">
                    <h4 className="font-semibold text-sm">Detalles del Reparto</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between p-3 bg-accent/50 rounded-lg">
                        <span className="text-muted-foreground">Pedido #{selectedAssignment.orderId}</span>
                        <Badge>
                          {selectedAssignment.deliveryStatus === 'pending' && 'Pendiente'}
                          {selectedAssignment.deliveryStatus === 'picked_up' && 'Recogido'}
                          {selectedAssignment.deliveryStatus === 'in_transit' && 'En ruta'}
                          {selectedAssignment.deliveryStatus === 'delivered' && 'Entregado'}
                          {selectedAssignment.deliveryStatus === 'cancelled' && 'Cancelado'}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-muted-foreground" />
                          <span>{selectedAssignment.orderCustomerName}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-muted-foreground" />
                          <span>{selectedAssignment.orderCustomerPhone || 'N/A'}</span>
                        </div>
                      </div>
                      {selectedAssignment.orderCustomerAddress && (
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-muted-foreground" />
                          <span className="text-xs">{selectedAssignment.orderCustomerAddress}</span>
                        </div>
                      )}
                      <div className="flex items-center justify-between p-3 bg-accent/50 rounded-lg">
                        <span className="text-sm text-muted-foreground">Total del pedido</span>
                        <span className="font-semibold">{activeSymbol}{(selectedAssignment.orderTotal * activeRate).toFixed(2)}</span>
                      </div>
                      {selectedAssignment.deliveryFee > 0 && (
                        <div className="flex items-center justify-between p-3 bg-accent/50 rounded-lg">
                          <span className="text-sm text-muted-foreground">Tarifa de delivery</span>
                          <span className="font-semibold">{activeSymbol}{(selectedAssignment.deliveryFee * activeRate).toFixed(2)}</span>
                        </div>
                      )}
                    </div>

                    {/* Acciones según estado */}
                    <div className="space-y-2 pt-2">
                      {selectedAssignment.deliveryStatus === 'pending' && (
                        <Button 
                          className="w-full"
                          onClick={() => handleUpdateStatus(selectedAssignment.id, 'picked_up')}
                        >
                          <CheckCircle className="mr-2 h-4" />
                          Marcar como Recogido
                        </Button>
                      )}
                      {selectedAssignment.deliveryStatus === 'picked_up' && (
                        <Button 
                          className="w-full"
                          onClick={() => handleUpdateStatus(selectedAssignment.id, 'in_transit')}
                        >
                          <Truck className="mr-2 h-4" />
                          Enviar en Ruta
                        </Button>
                      )}
                      {selectedAssignment.deliveryStatus === 'in_transit' && (
                        <Button 
                          className="w-full"
                          onClick={handleMarkComplete}
                        >
                          <CheckCircle className="mr-2 h-4" />
                          Marcar como Entregado
                        </Button>
                      )}
                      {(selectedAssignment.deliveryStatus === 'pending' || 
                        selectedAssignment.deliveryStatus === 'picked_up' || 
                        selectedAssignment.deliveryStatus === 'in_transit') && (
                        <Button 
                          className="w-full"
                          variant="destructive"
                          onClick={() => handleCancel(selectedAssignment.id, 'Cancelado por el operador')}
                        >
                          <XCircle className="mr-2 h-4" />
                          Cancelar Reparto
                        </Button>
                      )}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modales rápidos */}
      <Dialog open={showQuickAddProviderModal} onOpenChange={(open) => {
        if (!open) {
          setQuickProviderFormData({
            name: '',
            phone: '',
            providerType: 'internal',
            vehicleType: 'moto',
            vehiclePlate: '',
            commissionType: 'fixed',
            commissionFixedAmount: 0,
            commissionPercentage: 0,
            status: 'active',
          });
        }
        setShowQuickAddProviderModal(open);
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Agregar Nuevo Repartidor</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleQuickAddProvider} className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label htmlFor="name">Nombre *</Label>
                <Input
                  id="name"
                  required
                  placeholder="Nombre del repartidor"
                  value={quickProviderFormData.name}
                  onChange={(e) => setQuickProviderFormData({ ...quickProviderFormData, name: e.target.value })}
                />
              </div>
              <div className="col-span-2">
                <Label htmlFor="phone">Teléfono *</Label>
                <Input
                  id="phone"
                  required
                  placeholder="+58 412 34567"
                  value={quickProviderFormData.phone}
                  onChange={(e) => setQuickProviderFormData({ ...quickProviderFormData, phone: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="providerType">Tipo de Proveedor *</Label>
                <Select
                  value={quickProviderFormData.providerType}
                  onValueChange={(value) => setQuickProviderFormData({ ...quickProviderFormData, providerType: value as 'internal' | 'external' })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="internal">Interno (Propio)</SelectItem>
                    <SelectItem value="external">Externo (Uber, Rappi, etc.)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="vehicleType">Tipo de Vehículo *</Label>
                <Select
                  value={quickProviderFormData.vehicleType}
                  onValueChange={(value) => setQuickProviderFormData({ ...quickProviderFormData, vehicleType: value as 'moto' | 'bicycle' | 'car' | 'walking' })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="moto">🏍️ Moto</SelectItem>
                    <SelectItem value="bicycle">🚴 Bicicleta</SelectItem>
                    <SelectItem value="car">🚗 Auto</SelectItem>
                    <SelectItem value="walking">🚶 Caminando</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="vehiclePlate">Placa del Vehículo</Label>
                <Input
                  id="vehiclePlate"
                  placeholder="Ej: ABC-123"
                  value={quickProviderFormData.vehiclePlate}
                  onChange={(e) => setQuickProviderFormData({ ...quickProviderFormData, vehiclePlate: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="commissionType">Tipo de Comisión *</Label>
                <Select
                  value={quickProviderFormData.commissionType}
                  onValueChange={(value) => setQuickProviderFormData({ ...quickProviderFormData, commissionType: value as 'fixed' | 'percentage' | 'combination' })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fixed">💰 Fija</SelectItem>
                    <SelectItem value="percentage">📊 Porcentaje</SelectItem>
                    <SelectItem value="combination">💰📊 Combinada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="commissionFixedAmount">Monto Fijo ({activeSymbol})</Label>
                <Input
                  id="commissionFixedAmount"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={quickProviderFormData.commissionFixedAmount}
                  onChange={(e) => setQuickProviderFormData({ ...quickProviderFormData, commissionFixedAmount: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div>
                <Label htmlFor="commissionPercentage">Porcentaje (%)</Label>
                <Input
                  id="commissionPercentage"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  placeholder="0"
                  value={quickProviderFormData.commissionPercentage}
                  onChange={(e) => setQuickProviderFormData({ ...quickProviderFormData, commissionPercentage: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancelar</Button>
              </DialogClose>
              <SubmitButton
                type="submit"
                isSubmitting={isSubmittingProvider}
                isSuccess={isProviderSuccess}
                submittingText="Guardando..."
                successText="¡Guardado!"
              >
                Guardar Repartidor
              </SubmitButton>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal para agregar nueva zona */}
      <Dialog open={showQuickAddZoneModal} onOpenChange={(open) => {
        if (!open) {
          setQuickZoneFormData({
            name: '',
            description: '',
            centerLatitude: 0,
            centerLongitude: 0,
            radiusKm: 0,
            baseFee: 0,
            perKmFee: 0,
            perKmFeeOutsideZone: 0,
            estimatedMinutesPerKm: 5,
            priority: 1,
            status: 'active',
          });
        }
        setShowQuickAddZoneModal(open);
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Agregar Nueva Zona</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleQuickAddZone} className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label htmlFor="zoneName">Nombre de la Zona *</Label>
                <Input
                  id="zoneName"
                  required
                  placeholder="Ej: Zona Centro"
                  value={quickZoneFormData.name}
                  onChange={(e) => setQuickZoneFormData({ ...quickZoneFormData, name: e.target.value })}
                />
              </div>
              <div className="col-span-2">
                <Label htmlFor="zoneDescription">Descripción</Label>
                <Input
                  id="zoneDescription"
                  placeholder="Descripción de la zona"
                  value={quickZoneFormData.description}
                  onChange={(e) => setQuickZoneFormData({ ...quickZoneFormData, description: e.target.value })}
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
                    value={quickZoneFormData.centerLatitude || ''}
                    onChange={(e) => setQuickZoneFormData({ ...quickZoneFormData, centerLatitude: parseFloat(e.target.value) || 0 })}
                  />
                  <Input
                    id="centerLongitude"
                    type="number"
                    step="any"
                    required
                    placeholder="Longitud: -66.9036"
                    value={quickZoneFormData.centerLongitude || ''}
                    onChange={(e) => setQuickZoneFormData({ ...quickZoneFormData, centerLongitude: parseFloat(e.target.value) || 0 })}
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
                    onClick={() => {
                      if (navigator.geolocation) {
                        navigator.geolocation.getCurrentPosition(
                          (position) => {
                            setQuickZoneFormData({
                              ...quickZoneFormData,
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
                    }}
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
                  placeholder="Ej: 5"
                  value={quickZoneFormData.radiusKm || ''}
                  onChange={(e) => setQuickZoneFormData({ ...quickZoneFormData, radiusKm: parseFloat(e.target.value) || 0 })}
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
                  placeholder={`Ej: ${(10 * activeRate).toFixed(2)}`}
                  value={quickZoneFormData.baseFee || ''}
                  onChange={(e) => setQuickZoneFormData({ ...quickZoneFormData, baseFee: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div>
                <Label htmlFor="perKmFee">Tarifa por KM ({activeSymbol})</Label>
                <Input
                  id="perKmFee"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder={`Ej: ${(2 * activeRate).toFixed(2)}`}
                  value={quickZoneFormData.perKmFee || ''}
                  onChange={(e) => setQuickZoneFormData({ ...quickZoneFormData, perKmFee: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div>
                <Label htmlFor="perKmFeeOutsideZone">Tarifa por KM Fuera ({activeSymbol})</Label>
                <Input
                  id="perKmFeeOutsideZone"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder={`Ej: ${(3 * activeRate).toFixed(2)}`}
                  value={quickZoneFormData.perKmFeeOutsideZone || ''}
                  onChange={(e) => setQuickZoneFormData({ ...quickZoneFormData, perKmFeeOutsideZone: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div className="col-span-2">
                <Label htmlFor="estimatedMinutesPerKm">Minutos Estimados por KM</Label>
                <Input
                  id="estimatedMinutesPerKm"
                  type="number"
                  step="1"
                  min="1"
                  placeholder="Ej: 5"
                  value={quickZoneFormData.estimatedMinutesPerKm || ''}
                  onChange={(e) => setQuickZoneFormData({ ...quickZoneFormData, estimatedMinutesPerKm: parseInt(e.target.value) || 5 })}
                />
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancelar</Button>
              </DialogClose>
              <SubmitButton
                type="submit"
                isSubmitting={isSubmittingZone}
                isSuccess={isZoneSuccess}
                submittingText="Guardando..."
                successText="¡Guardado!"
              >
                Guardar Zona
              </SubmitButton>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal para editar zona */}
      <Dialog open={showEditZoneModal} onOpenChange={(open) => {
        if (!open) {
          setEditingZone(null);
        }
        setShowEditZoneModal(open);
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Zona</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdateZone} className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label htmlFor="editZoneName">Nombre de la Zona *</Label>
                <Input
                  id="editZoneName"
                  required
                  placeholder="Ej: Zona Centro"
                  value={editZoneFormData.name}
                  onChange={(e) => setEditZoneFormData({ ...editZoneFormData, name: e.target.value })}
                />
              </div>
              <div className="col-span-2">
                <Label htmlFor="editZoneDescription">Descripción</Label>
                <Input
                  id="editZoneDescription"
                  placeholder="Descripción de la zona"
                  value={editZoneFormData.description}
                  onChange={(e) => setEditZoneFormData({ ...editZoneFormData, description: e.target.value })}
                />
              </div>
              <div className="col-span-2">
                <Label>Ubicación del Centro de la Zona *</Label>
                <div className="grid grid-cols-[1fr_1fr_auto_auto] gap-2">
                  <Input
                    id="editCenterLatitude"
                    type="number"
                    step="any"
                    required
                    placeholder="Latitud: 10.4806"
                    value={editZoneFormData.centerLatitude || ''}
                    onChange={(e) => setEditZoneFormData({ ...editZoneFormData, centerLatitude: parseFloat(e.target.value) || 0 })}
                  />
                  <Input
                    id="editCenterLongitude"
                    type="number"
                    step="any"
                    required
                    placeholder="Longitud: -66.9036"
                    value={editZoneFormData.centerLongitude || ''}
                    onChange={(e) => setEditZoneFormData({ ...editZoneFormData, centerLongitude: parseFloat(e.target.value) || 0 })}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowEditZoneMapModal(true)}
                    className="shrink-0"
                    title="Seleccionar en mapa"
                  >
                    <MapPinned className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      if (navigator.geolocation) {
                        navigator.geolocation.getCurrentPosition(
                          (position) => {
                            setEditZoneFormData({
                              ...editZoneFormData,
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
                    }}
                    className="shrink-0"
                    title="Usar mi ubicación"
                  >
                    <Navigation className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div>
                <Label htmlFor="editRadiusKm">Radio (km) *</Label>
                <Input
                  id="editRadiusKm"
                  type="number"
                  step="0.1"
                  min="0"
                  required
                  placeholder="Ej: 5"
                  value={editZoneFormData.radiusKm || ''}
                  onChange={(e) => setEditZoneFormData({ ...editZoneFormData, radiusKm: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div>
                <Label htmlFor="editBaseFee">Tarifa Base ({activeSymbol}) *</Label>
                <Input
                  id="editBaseFee"
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  placeholder={`Ej: ${(10 * activeRate).toFixed(2)}`}
                  value={editZoneFormData.baseFee || ''}
                  onChange={(e) => setEditZoneFormData({ ...editZoneFormData, baseFee: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div>
                <Label htmlFor="editPerKmFee">Tarifa por KM ({activeSymbol})</Label>
                <Input
                  id="editPerKmFee"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder={`Ej: ${(2 * activeRate).toFixed(2)}`}
                  value={editZoneFormData.perKmFee || ''}
                  onChange={(e) => setEditZoneFormData({ ...editZoneFormData, perKmFee: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div>
                <Label htmlFor="editPerKmFeeOutsideZone">Tarifa por KM Fuera ({activeSymbol})</Label>
                <Input
                  id="editPerKmFeeOutsideZone"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder={`Ej: ${(3 * activeRate).toFixed(2)}`}
                  value={editZoneFormData.perKmFeeOutsideZone || ''}
                  onChange={(e) => setEditZoneFormData({ ...editZoneFormData, perKmFeeOutsideZone: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div>
                <Label htmlFor="editEstimatedMinutesPerKm">Minutos Estimados por KM</Label>
                <Input
                  id="editEstimatedMinutesPerKm"
                  type="number"
                  step="1"
                  min="1"
                  placeholder="Ej: 5"
                  value={editZoneFormData.estimatedMinutesPerKm || ''}
                  onChange={(e) => setEditZoneFormData({ ...editZoneFormData, estimatedMinutesPerKm: parseInt(e.target.value) || 5 })}
                />
              </div>
              <div>
                <Label htmlFor="editPriority">Prioridad</Label>
                <Input
                  id="editPriority"
                  type="number"
                  step="1"
                  min="1"
                  placeholder="Ej: 1"
                  value={editZoneFormData.priority || ''}
                  onChange={(e) => setEditZoneFormData({ ...editZoneFormData, priority: parseInt(e.target.value) || 1 })}
                />
              </div>
              <div>
                <Label htmlFor="editStatus">Estado</Label>
                <Select
                  value={editZoneFormData.status}
                  onValueChange={(value) => setEditZoneFormData({ ...editZoneFormData, status: value as 'active' | 'inactive' })}
                >
                  <SelectTrigger id="editStatus">
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
              <SubmitButton
                type="submit"
                isSubmitting={isUpdatingZone}
                isSuccess={isUpdateZoneSuccess}
                submittingText="Actualizando..."
                successText="¡Actualizado!"
              >
                Actualizar Zona
              </SubmitButton>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal de mapa para seleccionar centro de la zona en edición */}
      <Dialog open={showEditZoneMapModal} onOpenChange={setShowEditZoneMapModal}>
        <DialogContent className="max-w-4xl min-h-[600px] flex flex-col">
          <DialogHeader>
            <DialogTitle>Seleccionar Centro de la Zona en el Mapa</DialogTitle>
          </DialogHeader>
          <ZoneMap
            currentLat={editZoneFormData.centerLatitude}
            currentLon={editZoneFormData.centerLongitude}
            onSave={(lat: number, lon: number) => {
              setEditZoneFormData({ ...editZoneFormData, centerLatitude: lat, centerLongitude: lon });
              setShowEditZoneMapModal(false);
            }}
            onCancel={() => setShowEditZoneMapModal(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Modal de mapa para seleccionar centro de la zona */}
      <Dialog open={showZoneMapModal} onOpenChange={setShowZoneMapModal}>
        <DialogContent className="max-w-4xl min-h-[600px] flex flex-col">
          <DialogHeader>
            <DialogTitle>Seleccionar Centro de la Zona en el Mapa</DialogTitle>
          </DialogHeader>
          <ZoneMap
            currentLat={quickZoneFormData.centerLatitude}
            currentLon={quickZoneFormData.centerLongitude}
            onSave={(lat: number, lon: number) => {
              setQuickZoneFormData({ ...quickZoneFormData, centerLatitude: lat, centerLongitude: lon });
              setShowZoneMapModal(false);
            }}
            onCancel={() => setShowZoneMapModal(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Modal de mapa para seleccionar ubicación de destino */}
      <Dialog key="delivery-map-dialog" open={showMapModal} onOpenChange={setShowMapModal}>
        <DialogContent className="max-w-4xl min-h-[600px] flex flex-col">
          <DialogHeader>
            <DialogTitle>Seleccionar Ubicación de Destino en el Mapa</DialogTitle>
          </DialogHeader>
          <DeliveryMap
            departureLat={departureLocation.latitude}
            departureLon={departureLocation.longitude}
            destinationLat={formData.destinationLatitude || 0}
            destinationLon={formData.destinationLongitude || 0}
            onSave={(lat, lon) => {
              setFormData({ ...formData, destinationLatitude: lat, destinationLongitude: lon });
              setMapDestination({ lat, lng: lon });
              setShowMapModal(false);
            }}
            onCancel={() => setShowMapModal(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Modal de mapa para seleccionar ubicación de partida */}
      {canConfigureDeparture && (
        <Dialog open={showDepartureMapModal} onOpenChange={setShowDepartureMapModal}>
          <DialogContent className="max-w-4xl min-h-[600px] flex flex-col">
            <DialogHeader>
              <DialogTitle>Seleccionar Ubicación de Partida en el Mapa</DialogTitle>
            </DialogHeader>
            <DepartureMap
              currentLat={configFormData.latitude}
              currentLon={configFormData.longitude}
              onSave={(lat: number, lon: number) => {
                setConfigFormData({ ...configFormData, latitude: lat, longitude: lon });
                setShowDepartureMapModal(false);
              }}
              onCancel={() => setShowDepartureMapModal(false)}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Modal de configuración de ubicación de partida */}
      {canConfigureDeparture && (
        <Dialog open={isConfigModalOpen} onOpenChange={setIsConfigModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Configurar Ubicación de Partida</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="lat">Latitud *</Label>
                <Input
                  id="lat"
                  type="number"
                  step="0.000001"
                  placeholder="Ej: 10.4806"
                  value={configFormData.latitude || ''}
                  onChange={(e) => setConfigFormData({
                    ...configFormData,
                    latitude: parseFloat(e.target.value) || 0
                  })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="lon">Longitud *</Label>
                <Input
                  id="lon"
                  type="number"
                  step="0.000001"
                  placeholder="Ej: -66.8983"
                  value={configFormData.longitude || ''}
                  onChange={(e) => setConfigFormData({
                    ...configFormData,
                    longitude: parseFloat(e.target.value) || 0
                  })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Dirección</Label>
                <Input
                  id="address"
                  placeholder="Descripción de la ubicación"
                  value={configFormData.address || ''}
                  onChange={(e) => setConfigFormData({
                    ...configFormData,
                    address: e.target.value
                  })}
                />
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={handleGetMyLocation}
                className="w-full"
              >
                <Navigation className="mr-2 h-4 w-4" />
                Usar mi ubicación actual
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={() => setShowDepartureMapModal(true)}
                className="w-full"
              >
                <MapPinned className="mr-2 h-4 w-4" />
                Seleccionar ubicación en el mapa
              </Button>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsConfigModalOpen(false)} disabled={isSubmittingConfig}>
                Cancelar
              </Button>
              <Button onClick={handleSaveConfig} disabled={isSubmittingConfig}>
                {isSubmittingConfig ? (
                  <>
                    <div className="h-4 w-4 mr-2 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Guardando...
                  </>
                ) : (
                  'Guardar Configuración'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Modal de confirmación para eliminar zona */}
      <Dialog open={showDeleteZoneConfirm} onOpenChange={setShowDeleteZoneConfirm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>¿Eliminar Zona?</DialogTitle>
            <div className="flex items-center gap-2 py-4">
              <div className="h-12 w-12 bg-destructive/10 rounded-full flex items-center justify-center">
                <Trash2 className="h-6 w-6 text-destructive" />
              </div>
              <div className="flex-1">
                <p className="font-medium">¿Estás seguro?</p>
                <p className="text-sm text-muted-foreground">
                  {zoneToDelete && `Esta acción eliminará la zona "${zoneToDelete.name}" de forma permanente.`}
                </p>
              </div>
            </div>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancelar</Button>
            </DialogClose>
            <SubmitButton
              onClick={confirmDeleteZone}
              isSubmitting={isDeletingZone}
              submittingText="Eliminando..."
              successText="¡Eliminado!"
              className="bg-destructive hover:bg-destructive/90"
            >
              Eliminar
            </SubmitButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de detalle de pedido con mapa */}
      <Dialog open={isOrderDetailModalOpen} onOpenChange={setIsOrderDetailModalOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden p-0">
          <div className="p-3 pb-0">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Package className="h-4 w-4 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <DialogTitle className="mb-0 text-base">Pedido #{selectedOrderForDetail?.orderId}</DialogTitle>
                <p className="text-xs text-muted-foreground truncate">{selectedOrderForDetail?.customerName}</p>
              </div>
              <Badge className="bg-green-500 text-white text-xs shrink-0">Pendiente</Badge>
            </div>
          </div>

          {selectedOrderForDetail && (
            <div className="h-[55vh] min-h-[400px]">
              {/* Mapa grande - ocupa todo el espacio disponible */}
              <div className="h-full">
                {selectedOrderForDetail.latitude && selectedOrderForDetail.longitude ? (
                  <DeliveryMapPreview
                    destinationLat={selectedOrderForDetail.latitude}
                    destinationLon={selectedOrderForDetail.longitude}
                    className="h-full w-full"
                  />
                ) : (
                  <div className="h-full flex items-center justify-center bg-muted">
                    <div className="text-center text-muted-foreground">
                      <MapPin className="h-16 w-16 mx-auto mb-4 opacity-50" />
                      <p className="text-lg">Sin ubicación registrada</p>
                      <p className="text-sm">No hay coordenadas disponibles</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Footer compacto - info a la izquierda fija, botones a la derecha fijos */}
          <DialogFooter className="flex flex-wrap gap-2 justify-between items-center p-3 border-t bg-background w-full">
            <div className="flex flex-wrap gap-3 items-center min-w-0">
              <div className="flex items-center gap-1.5 shrink-0">
                <User className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs font-medium truncate max-w-[100px]">{selectedOrderForDetail?.customerName}</span>
              </div>
              {selectedOrderForDetail?.customerPhone && (
                <div className="flex items-center gap-1.5 shrink-0">
                  <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-xs truncate">{selectedOrderForDetail.customerPhone}</span>
                </div>
              )}
              <div className="flex items-center gap-1.5 shrink-0">
                <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs font-semibold">
                  {activeSymbol}{(selectedOrderForDetail?.total * activeRate).toFixed(2)}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 shrink-0">
              {selectedOrderForDetail?.latitude && selectedOrderForDetail?.longitude && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-3 text-xs"
                  onClick={() => window.open(
                    `https://www.google.com/maps/dir/?api=1&destination=${selectedOrderForDetail.latitude},${selectedOrderForDetail.longitude}`,
                    "_blank"
                  )}
                >
                  <Navigation className="h-3.5 w-3.5 mr-1" />
                  Navegar
                </Button>
              )}

              {selectedOrderForDetail?.customerPhone && (
                <Button
                  size="sm"
                  className="h-8 text-xs bg-[#25D366] text-white hover:bg-[#20bd5a]"
                  onClick={() => window.open(
                    `https://wa.me/${selectedOrderForDetail.customerPhone?.replace(/\D/g, '')}`,
                    "_blank",
                    "noopener,noreferrer",
                  )}
                >
                  <FaWhatsapp className="h-3 w-3 mr-1" />
                  WhatsApp
                </Button>
              )}

              <Button
                size="sm"
                className="h-8 text-xs"
                onClick={() => {
                  if (selectedOrderForDetail) {
                    handleSelectAssignment({
                      id: selectedOrderForDetail.orderId,
                      orderId: selectedOrderForDetail.orderId,
                      storeId: selectedOrderForDetail.storeId || activeStoreId || '',
                      deliveryProviderId: '',
                      orderCustomerName: selectedOrderForDetail.customerName,
                      orderCustomerPhone: selectedOrderForDetail.customerPhone,
                      orderCustomerAddress: selectedOrderForDetail.customerAddress,
                      orderTotal: selectedOrderForDetail.total,
                      orderItems: selectedOrderForDetail.items || [],
                      deliveryFee: selectedOrderForDetail.deliveryFee || 0,
                      destinationLatitude: selectedOrderForDetail.latitude || 0,
                      destinationLongitude: selectedOrderForDetail.longitude || 0,
                      deliveryStatus: 'pending' as DeliveryStatus,
                      deliveryNotes: selectedOrderForDetail.deliveryNotes || selectedOrderForDetail.notes || '',
                      whatsappNotificationSent: false,
                      assignedAt: new Date().toISOString(),
                      createdAt: new Date().toISOString(),
                      updatedAt: new Date().toISOString(),
                    } as DeliveryAssignment);
                  }
                  setIsOrderDetailModalOpen(false);
                }}
              >
                <ShoppingCart className="h-3 w-3 mr-1" />
                Cargar
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo de confirmación para cancelar pedido */}
      <AlertDialog open={isCancelOrderDialogOpen} onOpenChange={setIsCancelOrderDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive">¿Cancelar pedido?</AlertDialogTitle>
            <AlertDialogDescription>
              Estás a punto de cancelar el pedido <strong>{orderToCancel?.orderId || orderToCancel?.id}</strong>.<br /><br />
              Esta acción no se puede deshacer y el pedido será marcado como cancelado.<br /><br />
              ¿Estás seguro de que deseas continuar?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setOrderToCancel(null)}>No, mantener</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmCancelOrder}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Sí, cancelar pedido
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
