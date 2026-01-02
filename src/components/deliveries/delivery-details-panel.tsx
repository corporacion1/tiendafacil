import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import type { DeliveryAssignment } from '@/lib/types';
import { formatGoogleMapsUrl, formatWhatsAppLink, formatCurrency, formatDuration } from '@/lib/delivery-utils';
import { 
  MapPin, 
  Navigation, 
  Phone, 
  User, 
  Package,
  Truck, 
  Clock, 
  CheckCircle, 
  XCircle,
  MessageCircle,
  ExternalLink
} from 'lucide-react';

interface DeliveryDetailsPanelProps {
  assignment: DeliveryAssignment | null;
  onUpdateStatus?: (id: string, status: string) => void;
  onMarkComplete?: (data: { customerRating: number; customerFeedback: string }) => void;
  onCancel?: (id: string, reason: string) => void;
}

export const DeliveryDetailsPanel = ({ assignment, onUpdateStatus, onMarkComplete, onCancel }: DeliveryDetailsPanelProps) => {
  if (!assignment) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12 text-muted-foreground">
          <Truck className="w-12 h-12 mb-4 opacity-50" />
          <p>Selecciona una asignación para ver detalles</p>
        </CardContent>
      </Card>
    );
  }

  const getStatusBadge = () => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      picked_up: 'bg-blue-100 text-blue-800',
      in_transit: 'bg-purple-100 text-purple-800',
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return (
      <Badge className={colors[assignment.deliveryStatus]}>
        {assignment.deliveryStatus.toUpperCase().replace('_', ' ')}
      </Badge>
    );
  };

  const mapsUrl = assignment.destinationLatitude && assignment.destinationLongitude
    ? formatGoogleMapsUrl(assignment.destinationLatitude, assignment.destinationLongitude)
    : null;

  const directionsUrl = assignment.storeLatitude && assignment.storeLongitude &&
    assignment.destinationLatitude && assignment.destinationLongitude
    ? `https://www.google.com/maps/dir/?api=1&origin=${assignment.storeLatitude},${assignment.storeLongitude}&destination=${assignment.destinationLatitude},${assignment.destinationLongitude}`
    : null;

  const whatsappLink = assignment.orderCustomerPhone
    ? formatWhatsAppLink(assignment.orderCustomerPhone)
    : null;

  const handleStatusClick = (newStatus: string) => {
    onUpdateStatus?.(assignment.id, newStatus);
  };

  const handleMarkComplete = () => {
    onMarkComplete?.({
      customerRating: 5,
      customerFeedback: ''
    });
  };

  const handleCancel = () => {
    onCancel?.(assignment.id, 'Cancelado por usuario');
  };

  return (
    <Card className="h-full overflow-y-auto">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">Detalle de Reparto</CardTitle>
            <p className="text-sm text-muted-foreground">
              #{assignment.orderId} {getStatusBadge()}
            </p>
          </div>
          {assignment.deliveryStatus === 'delivered' ? (
            <CheckCircle className="w-6 h-6 text-green-600" />
          ) : assignment.deliveryStatus === 'cancelled' ? (
            <XCircle className="w-6 h-6 text-red-600" />
          ) : (
            <Truck className="w-6 h-6 text-primary" />
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Detalles del Pedido */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground">
            Detalles del Pedido
          </h3>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="font-medium">{assignment.orderCustomerName}</p>
                {assignment.orderCustomerPhone && (
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <Phone className="w-3 h-3" />
                    {assignment.orderCustomerPhone}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">
                  Total: <span className="font-medium text-foreground ml-2">
                    {formatCurrency(assignment.orderTotal)}
                  </span>
                </p>
                {assignment.deliveryFee > 0 && (
                  <p className="text-sm text-muted-foreground">
                    Delivery: <span className="font-medium text-foreground ml-2">
                      +{formatCurrency(assignment.deliveryFee)}
                    </span>
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        <Separator />

        {/* Ubicación */}
        {(assignment.orderCustomerAddress || mapsUrl || directionsUrl) && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground">
              Ubicación de Entrega
            </h3>
            {assignment.orderCustomerAddress && (
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-muted-foreground mt-1" />
                <p className="text-sm">{assignment.orderCustomerAddress}</p>
              </div>
            )}
            <div className="flex gap-2">
              {mapsUrl && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1"
                  onClick={() => window.open(mapsUrl, '_blank')}
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Ver mapa
                </Button>
              )}
              {directionsUrl && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1"
                  onClick={() => window.open(directionsUrl, '_blank')}
                >
                  <Navigation className="w-4 h-4 mr-2" />
                  Ruta
                </Button>
              )}
            </div>
          </div>
        )}

        <Separator />

        {/* Tiempo y Distancia */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground">
            Tiempo y Distancia
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground">Tiempo estimado</p>
              <p className="text-lg font-semibold">
                {assignment.estimatedDurationMinutes 
                  ? formatDuration(assignment.estimatedDurationMinutes)
                  : 'N/A'
                }
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Distancia</p>
              <p className="text-lg font-semibold">
                {assignment.distanceKm ? `${assignment.distanceKm.toFixed(1)} km` : 'N/A'}
              </p>
            </div>
          </div>
        </div>

        <Separator />

        {/* Contacto */}
        {whatsappLink && (
          <Button 
            className="w-full bg-green-600 hover:bg-green-700"
            onClick={() => window.open(whatsappLink, '_blank')}
          >
            <MessageCircle className="w-4 h-4 mr-2" />
            Contactar por WhatsApp
          </Button>
        )}

        {/* Acciones según estado */}
        {assignment.deliveryStatus === 'pending' && (
          <Button 
            className="w-full"
            variant="default"
            onClick={() => onUpdateStatus?.(assignment.id, 'picked_up')}
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            Marcar como Recogido
          </Button>
        )}

        {assignment.deliveryStatus === 'picked_up' && (
          <Button 
            className="w-full"
            variant="default"
            onClick={() => onUpdateStatus?.(assignment.id, 'in_transit')}
          >
            <Truck className="w-4 h-4 mr-2" />
            Enviar en ruta
          </Button>
        )}

        {assignment.deliveryStatus === 'in_transit' && (
          <Button 
            className="w-full"
            variant="default"
            onClick={handleMarkComplete}
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            Marcar como entregado
          </Button>
        )}
      </CardContent>
    </Card>
  );
};
