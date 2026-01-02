import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { DeliveryAssignment } from '@/lib/types';
import { 
  Truck, 
  Package, 
  Clock, 
  CheckCircle, 
  XCircle
} from 'lucide-react';

interface DeliveryCardProps {
  assignment: DeliveryAssignment;
  onSelect?: (assignment: DeliveryAssignment) => void;
  onUpdateStatus?: (id: string, status: string) => void;
}

export const DeliveryCard = ({ assignment, onSelect, onUpdateStatus }: DeliveryCardProps) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'picked_up': return 'bg-blue-100 text-blue-800';
      case 'in_transit': return 'bg-purple-100 text-purple-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'Pendiente';
      case 'picked_up': return 'Recogido';
      case 'in_transit': return 'En ruta';
      case 'delivered': return 'Entregado';
      case 'cancelled': return 'Cancelado';
      default: return status;
    }
  };

  const getNextStatus = (current: string) => {
    const statusOrder = ['pending', 'picked_up', 'in_transit', 'delivered'];
    const currentIndex = statusOrder.indexOf(current);
    if (currentIndex < statusOrder.length - 1 && currentIndex >= 0) {
      return statusOrder[currentIndex + 1];
    }
    return current;
  };

  const handleStatusClick = () => {
    const nextStatus = getNextStatus(assignment.deliveryStatus);
    if (nextStatus !== assignment.deliveryStatus) {
      onUpdateStatus?.(assignment.id, nextStatus);
    }
  };

  const formatTime = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => onSelect?.(assignment)}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Truck className="w-5 h-5 text-primary" />
            <div>
              <CardTitle className="text-base">#{assignment.orderId}</CardTitle>
              <p className="text-xs text-muted-foreground">
                {assignment.orderCustomerName}
              </p>
            </div>
          </div>
          <Badge className={getStatusColor(assignment.deliveryStatus)}>
            {getStatusLabel(assignment.deliveryStatus)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span>
                {formatTime(assignment.assignedAt)}
              </span>
            </div>
            {assignment.estimatedDurationMinutes && (
              <Badge variant="outline">
                {assignment.estimatedDurationMinutes} min
              </Badge>
            )}
          </div>
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Package className="w-4 h-4" />
              <span>${assignment.orderTotal.toFixed(2)}</span>
            </div>
            {assignment.deliveryFee > 0 && (
              <Badge variant="secondary">
                +${assignment.deliveryFee.toFixed(2)} delivery
              </Badge>
            )}
          </div>
          {assignment.deliveryStatus !== 'cancelled' && assignment.deliveryStatus !== 'delivered' && (
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full"
              onClick={(e) => {
                e.stopPropagation();
                handleStatusClick();
              }}
            >
              Avanzar estado
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
