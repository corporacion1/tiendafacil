import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { DeliveryProvider } from '@/lib/types';
import { Phone, MapPin, User } from 'lucide-react';

interface ProviderCardProps {
  provider: DeliveryProvider;
  onSelect?: (provider: DeliveryProvider) => void;
  onEdit?: (provider: DeliveryProvider) => void;
  onDelete?: (id: string) => void;
}

export const ProviderCard = ({ provider, onSelect, onEdit, onDelete }: ProviderCardProps) => {
  const getVehicleIcon = (type?: string) => {
    switch (type) {
      case 'moto': return '🏍️';
      case 'bicycle': return '🚴';
      case 'car': return '🚗';
      case 'walking': return '🚶';
      default: return '📦';
    }
  };

  const getProviderTypeLabel = (type: string) => {
    return type === 'internal' ? 'Interno' : 'Externo';
  };

  const getCommissionLabel = (provider: DeliveryProvider) => {
    if (provider.commissionType === 'fixed') {
      return `$${provider.commissionFixedAmount.toFixed(2)}`;
    } else if (provider.commissionType === 'percentage') {
      return `${provider.commissionPercentage}%`;
    } else {
      return `$${provider.commissionFixedAmount.toFixed(2)} + ${provider.commissionPercentage}%`;
    }
  };

  return (
    <Card className={`hover:shadow-md transition-shadow ${onSelect ? 'cursor-pointer' : ''}`}
          onClick={() => onSelect?.(provider)}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
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
            <div>
              <CardTitle className="text-lg">{provider.name}</CardTitle>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Badge variant={provider.status === 'active' ? 'default' : 'secondary'}>
                  {provider.status === 'active' ? 'Activo' : 'Inactivo'}
                </Badge>
                <span>{getVehicleIcon(provider.vehicleType)}</span>
              </div>
            </div>
          </div>
          {provider.providerType === 'external' && (
            <Badge variant="outline">Externo</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Phone className="w-4 h-4" />
            <span>{provider.phone}</span>
          </div>
          {provider.vehiclePlate && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <span>📋 {provider.vehiclePlate}</span>
            </div>
          )}
          {provider.address && (
            <div className="flex items-start gap-2 text-muted-foreground">
              <MapPin className="w-4 h-4 mt-0.5" />
              <span className="line-clamp-1">{provider.address}</span>
            </div>
          )}
          <div className="pt-2 border-t">
            <div className="flex justify-between text-muted-foreground">
              <span>Comisión:</span>
              <span className="font-medium text-foreground">{getCommissionLabel(provider)}</span>
            </div>
            {provider.externalServiceName && (
              <div className="flex justify-between text-muted-foreground">
                <span>Servicio:</span>
                <span className="font-medium text-foreground">{provider.externalServiceName}</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
