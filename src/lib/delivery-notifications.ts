import { formatWhatsAppLink } from './delivery-utils';

export interface DeliveryNotificationData {
  orderId: string;
  customerName: string;
  deliveryProviderName: string;
  deliveryProviderPhone?: string;
  estimatedTime?: string;
  customerPhone?: string;
  customerAddress?: string;
  total?: string;
  storePhone?: string;
}

export const DeliveryNotifications = {
  assigned: (data: DeliveryNotificationData): string => {
    return `📦 *Tu pedido ha sido asignado*

🔢 Pedido: ${data.orderId}
👤 Repartidor: ${data.deliveryProviderName}
⏱️ Tiempo estimado: ${data.estimatedTime || 'En breve'}

¡Gracias por tu compra!`;
  },

  inTransit: (data: DeliveryNotificationData): string => {
    return `🚴 *Tu pedido está en camino*

🔢 Pedido: ${data.orderId}
👤 Repartidor: ${data.deliveryProviderName}
📞 Contacto: ${data.deliveryProviderPhone || 'Disponible en el sistema'}

¡Pronto recibirás tu pedido!`;
  },

  delivered: (data: DeliveryNotificationData): string => {
    return `✅ *Pedido entregado*

🔢 Pedido: ${data.orderId}
👤 Repartidor: ${data.deliveryProviderName}

¡Gracias por tu compra! Esperamos verte pronto.`;
  },

  toProvider: (data: DeliveryNotificationData): string => {
    return `📦 *Nueva asignación de delivery*

🔢 Pedido: ${data.orderId}
👤 Cliente: ${data.customerName}
📍 Dirección: ${data.customerAddress}
📞 Teléfono: ${data.customerPhone}
💰 Total: ${data.total}
📞 Tienda: ${data.storePhone || 'N/A'}

Por favor confirma que recibes la asignación.`;
  }
};

export const getWhatsAppNotificationLink = (
  phone: string,
  notificationType: keyof typeof DeliveryNotifications,
  data: DeliveryNotificationData
): string => {
  const message = DeliveryNotifications[notificationType](data);
  return formatWhatsAppLink(phone, message);
};
