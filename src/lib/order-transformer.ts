/**
 * Order Transformer - SIMPLIFICADO
 * Solo hace mapeo directo de snake_case a camelCase sin validaciones complejas
 */

import { Order } from './types';

type OrderItem = any;

/**
 * Raw database format of an order (snake_case)
 */
export interface DatabaseOrder {
  id?: string;
  order_id: string;
  store_id: string;
  customer_name: string;
  customer_phone: string;
  customer_email?: string | null;
  customer_address?: string | null;
  items: any;
  total: number;
  status: string;
  notes?: string | null;
  processed_by?: string | null;
  sale_id?: string | null;
  delivery_method?: string | null;
  delivery_status?: string | null;
  delivery_provider_id?: string | null;
  delivery_fee?: number | null;
  delivery_date?: string | null;
  delivery_time?: string | null;
  delivery_notes?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  created_at: string;
  updated_at: string;
  user_id?: string | null;
}

/**
 * OrderTransformer - SIMPLIFICADO
 * Solo transforma nombres de campos, sin validaciones que puedan cambiar valores
 */
export class OrderTransformer {
  /**
   * Transform database order (snake_case) to frontend order (camelCase)
   * MAPEO DIRECTO sin cambios de valores
   */
  static fromDatabase(dbOrder: DatabaseOrder): Order {
    if (!dbOrder) {
      throw new Error('Cannot transform null or undefined order');
    }

    // Parse items si es string JSON
    let items: OrderItem[] = [];
    try {
      if (typeof dbOrder.items === 'string') {
        items = JSON.parse(dbOrder.items);
      } else if (Array.isArray(dbOrder.items)) {
        items = dbOrder.items;
      }
    } catch (error) {
      console.error('Error parsing items:', error);
      items = [];
    }

    // Transformación DIRECTA - solo cambio de nombres de campos
    const order: Order = {
      orderId: dbOrder.order_id,
      storeId: dbOrder.store_id,
      customerName: dbOrder.customer_name,
      customerPhone: dbOrder.customer_phone,
      customerEmail: dbOrder.customer_email || undefined,
      customerAddress: dbOrder.customer_address || undefined,
      items: items,
      total: Number(dbOrder.total) || 0,
      // USAR VALOR DIRECTO DE LA BASE DE DATOS
      status: dbOrder.status as any,
      notes: dbOrder.notes || undefined,
      processedBy: dbOrder.processed_by || undefined,
      saleId: dbOrder.sale_id || undefined,
      // USAR VALOR DIRECTO DE LA BASE DE DATOS
      deliveryMethod: dbOrder.delivery_method as any,
      deliveryStatus: dbOrder.delivery_status as any || undefined,
      deliveryProviderID: dbOrder.delivery_provider_id || undefined,
      deliveryFee: dbOrder.delivery_fee ? Number(dbOrder.delivery_fee) : undefined,
      deliveryDate: dbOrder.delivery_date || undefined,
      deliveryTime: dbOrder.delivery_time || undefined,
      deliveryNotes: dbOrder.delivery_notes || undefined,
      latitude: dbOrder.latitude ? Number(dbOrder.latitude) : undefined,
      longitude: dbOrder.longitude ? Number(dbOrder.longitude) : undefined,
      createdAt: dbOrder.created_at,
      updatedAt: dbOrder.updated_at,
    };

    return order;
  }

  /**
   * Transform frontend order (camelCase) to database order (snake_case)
   */
  static toDatabase(order: Order): DatabaseOrder {
    if (!order) {
      throw new Error('Cannot transform null or undefined order');
    }

    if (!order.orderId || !order.storeId || !order.customerName || !order.customerPhone) {
      throw new Error('Missing required order fields: orderId, storeId, customerName, customerPhone');
    }

    const items = Array.isArray(order.items) ? order.items : [];
    
    const dbOrder: DatabaseOrder = {
      order_id: order.orderId,
      store_id: order.storeId,
      customer_name: order.customerName,
      customer_phone: order.customerPhone,
      customer_email: order.customerEmail || null,
      customer_address: order.customerAddress || null,
      items: items,
      total: order.total,
      status: order.status || 'pending',
      notes: order.notes || null,
      processed_by: order.processedBy || null,
      sale_id: order.saleId || null,
      delivery_method: order.deliveryMethod || null,
      delivery_status: (order.deliveryStatus || null) as string | null,
      delivery_provider_id: order.deliveryProviderID || null,
      delivery_fee: order.deliveryFee || null,
      delivery_date: order.deliveryDate || null,
      delivery_time: order.deliveryTime || null,
      delivery_notes: order.deliveryNotes || null,
      latitude: order.latitude || null,
      longitude: order.longitude || null,
      created_at: order.createdAt,
      updated_at: order.updatedAt,
    };

    return dbOrder;
  }

  /**
   * Transform an array of database orders to frontend format
   */
  static fromDatabaseArray(dbOrders: DatabaseOrder[]): Order[] {
    if (!Array.isArray(dbOrders)) {
      return [];
    }
    return dbOrders.map(dbOrder => this.fromDatabase(dbOrder));
  }

  /**
   * Transform an array of frontend orders to database format
   */
  static toDatabaseArray(orders: Order[]): DatabaseOrder[] {
    if (!Array.isArray(orders)) {
      return [];
    }
    return orders.map(order => this.toDatabase(order));
  }
}
