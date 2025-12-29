import { NextResponse, NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { unstable_cache, revalidateTag } from 'next/cache';

// Inicializar cliente de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Helper para generar IDs
const generateId = (prefix: string) => {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// Estados de pedidos compatibles
const OrderStatus = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  PROCESSED: 'processed',
  CANCELLED: 'cancelled',
  EXPIRED: 'expired'
};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  const storeId = searchParams.get('storeId');
  const status = searchParams.get('status');

  // Si se busca por ID específico, no cacheamos por ahora
  if (id) {
    console.log('🔍 [Orders API] Buscando orden por ID:', id);
    const { data: order, error } = await supabase
      .from('orders')
      .select('*')
      .or(`order_id.eq.${id},id.eq.${id}`)
      .single();

    if (error) {
      console.error('❌ [Orders API] Error al buscar orden:', error);
      return NextResponse.json({ error: 'Error al buscar orden' }, { status: 500 });
    }

    if (!order) {
      return NextResponse.json({ error: 'Orden no encontrada' }, { status: 404 });
    }

    // Transform snake_case to camelCase
    const formattedOrder = {
      orderId: order.order_id,
      storeId: order.store_id,
      customerName: order.customer_name,
      customerPhone: order.customer_phone,
      customerEmail: order.customer_email,
      items: typeof order.items === 'string' ? JSON.parse(order.items) : order.items,
      total: order.total,
      status: order.status,
      processedBy: order.user_id,
      createdAt: order.created_at,
      updatedAt: order.updated_at,
      customerAddress: order.customerAddress,
      deliveryMethod: order.deliveryMethod,
      deliveryStatus: order.deliveryStatus,
      deliveryFee: order.deliveryFee,
      deliveryDate: order.deliveryDate,
      deliveryTime: order.deliveryTime,
      latitude: order.latitude,
      longitude: order.longitude
    };

    return NextResponse.json(formattedOrder);
  }

  // Si no hay storeId, error
  if (!storeId) {
    return NextResponse.json({ error: 'Store ID is required' }, { status: 400 });
  }

  try {
    const customerEmail = searchParams.get('customerEmail');

    // Cache key parts (include customerEmail in key to separate user caches)
    const cacheKey = ['orders', storeId, status || 'all', customerEmail || 'all_emails'];
    const cacheTags = [`orders-${storeId}`, 'orders'];

    // Función cacheada
    const getCachedOrders = unstable_cache(
      async (sId: string, sStatus: string | null, cEmail: string | null) => {
        console.log(`🔌 [Orders API] Fetching FRESH orders from DB for store: ${sId}, status: ${sStatus || 'all'}, user: ${cEmail || 'all'}`);
        let query = supabase
          .from('orders')
          .select('*')
          .eq('store_id', sId)
          .order('created_at', { ascending: false });

        if (sStatus) {
          const statuses = sStatus.split(',');
          if (statuses.length > 1) {
            query = query.in('status', statuses);
          } else {
            query = query.eq('status', sStatus);
          }
        }

        if (cEmail) {
          query = query.eq('customer_email', cEmail);
        }

        const { data, error } = await query;
        if (error) throw error;
        return data;
      },
      cacheKey,
      {
        tags: cacheTags,
        revalidate: 30 // Check DB every 30s max if no revalidation event occurs
      }
    );

    const orders = await getCachedOrders(storeId, status, customerEmail);

    // Transform snake_case to camelCase
    const formattedOrders = orders?.map((order: any) => ({
      orderId: order.order_id,
      storeId: order.store_id,
      customerName: order.customer_name,
      customerPhone: order.customer_phone,
      customerEmail: order.customer_email,
      items: typeof order.items === 'string' ? JSON.parse(order.items) : order.items,
      total: order.total,
      status: order.status,
      processedBy: order.user_id,
      createdAt: order.created_at,
      updatedAt: order.updated_at,
      customerAddress: order.customerAddress,
      deliveryMethod: order.deliveryMethod,
      deliveryStatus: order.deliveryStatus,
      deliveryFee: order.deliveryFee,
      deliveryDate: order.deliveryDate,
      deliveryTime: order.deliveryTime,
      latitude: order.latitude,
      longitude: order.longitude
    })) || [];

    console.log(`✅ [Orders API] Returned ${formattedOrders.length} orders (Cache Status: Likely HIT if no 'Fresh data' log)`);

    return NextResponse.json(formattedOrders, {
      headers: {
        'Cache-Control': 'public, s-maxage=10, stale-while-revalidate=59',
      }
    });

  } catch (error: any) {
    console.error('❌ [Orders API] Error fetching orders:', error);
    return NextResponse.json({ error: 'Error fetching orders' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validar campos requeridos
    if (!body.storeId || !body.customerName || !body.customerPhone || !body.items) {
      return NextResponse.json({
        error: 'Campos requeridos: storeId, customerName, customerPhone, items'
      }, { status: 400 });
    }

    // Generar ID único si no se proporciona
    const orderId = body.orderId || body.id || generateId('ORD');

    // Preparar datos para Supabase
    const orderData = {
      id: orderId, // Add id field for NOT NULL constraint
      order_id: orderId,
      customer_name: body.customerName,
      customer_phone: body.customerPhone,
      customer_email: body.customerEmail,
      items: body.items,
      total: body.total || 0,
      store_id: body.storeId,
      status: 'pending',
      notes: body.notes,
      processed_by: body.user_id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      customerAddress: body.customerAddress,
      deliveryMethod: body.deliveryMethod,
      deliveryStatus: body.deliveryStatus,
      deliveryFee: body.deliveryFee,
      deliveryDate: body.deliveryDate,
      deliveryTime: body.deliveryTime,
      latitude: body.latitude,
      longitude: body.longitude
    };

    // Agregar link de ubicación a las notas si hay coordenadas (para compatibilidad)
    if (body.latitude && body.longitude) {
      const mapsLink = `\n📍 Ubicación: https://www.google.com/maps?q=${body.latitude},${body.longitude}`;
      orderData.notes = (orderData.notes || '') + mapsLink;
    }

    console.log('📦 [Orders API] Creando pedido en Supabase:', orderId);

    // Insertar pedido en Supabase
    const { data: createdOrder, error } = await supabase
      .from('orders')
      .insert([orderData])
      .select()
      .single();

    if (error) {
      console.error('❌ [Orders API] Error creando pedido en Supabase:', error);
      return NextResponse.json(
        { error: 'Error al crear el pedido', detalles: error.message },
        { status: 500 }
      );
    }

    console.log('✅ [Orders API] Pedido creado exitosamente:', orderId);

    // Formatear respuesta para mantener compatibilidad
    const formattedResponse = {
      success: true,
      data: {
        orderId: createdOrder.order_id,
        id: createdOrder.order_id, // Compatibilidad
        customerName: createdOrder.customer_name,
        customerPhone: createdOrder.customer_phone,
        customerEmail: createdOrder.customer_email,
        items: createdOrder.items,
        total: createdOrder.total,
        storeId: createdOrder.store_id,
        status: createdOrder.status,
        notes: createdOrder.notes,
        processedBy: createdOrder.user_id,
        createdAt: createdOrder.created_at,
        updatedAt: createdOrder.updated_at,
        customerAddress: createdOrder.customerAddress,
        deliveryMethod: createdOrder.deliveryMethod,
        deliveryStatus: createdOrder.deliveryStatus,
        deliveryFee: createdOrder.deliveryFee,
        deliveryDate: createdOrder.deliveryDate,
        deliveryTime: createdOrder.deliveryTime,
        latitude: createdOrder.latitude,
        longitude: createdOrder.longitude
      }
    };

    // Invalidar cache de pedidos
    revalidateTag(`orders-${createdOrder.store_id}`);
    revalidateTag('orders');

    return NextResponse.json(formattedResponse);

  } catch (error: any) {
    console.error('❌ [Orders API] Error general creando pedido:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor', detalles: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderId, status, processedBy, saleId, notes, storeId, items, total, customerName, customerPhone, customerEmail, latitude, longitude, customerAddress } = body;

    if (!orderId || !storeId) {
      return NextResponse.json({
        error: 'orderId y storeId son requeridos'
      }, { status: 400 });
    }

    console.log('🔄 [Orders API] Actualizando pedido:', orderId, 'store:', storeId);

    // Preparar datos para actualización
    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    // Actualizar campos si se proporcionan
    if (status) updateData.status = status;
    if (items) updateData.items = items;
    if (total !== undefined) updateData.total = total;
    if (customerName) updateData.customer_name = customerName;
    if (customerPhone) updateData.customer_phone = customerPhone;
    if (customerEmail !== undefined) updateData.customer_email = customerEmail;
    if (notes !== undefined) updateData.notes = notes;
    if (customerAddress !== undefined) updateData.customerAddress = customerAddress;
    if (latitude !== undefined) updateData.latitude = latitude;
    if (longitude !== undefined) updateData.longitude = longitude;

    // Si se marca como procesado, agregar campos adicionales
    if (status === OrderStatus.PROCESSED) {
      updateData.processed_at = new Date().toISOString();
      if (processedBy) updateData.processed_by = processedBy;
      if (saleId) updateData.sale_id = saleId;
    }

    // Actualizar en Supabase
    const { data: updatedOrder, error } = await supabase
      .from('orders')
      .update(updateData)
      .eq('order_id', orderId)
      .eq('store_id', storeId)
      .select()
      .single();

    if (error) {
      console.error('❌ [Orders API] Error actualizando pedido en Supabase:', error);
      return NextResponse.json(
        { error: 'Error al actualizar el pedido', detalles: error.message },
        { status: 500 }
      );
    }

    if (!updatedOrder) {
      return NextResponse.json({
        error: 'Pedido no encontrado'
      }, { status: 404 });
    }

    console.log('✅ [Orders API] Pedido actualizado:', updatedOrder.order_id);

    // Convertir formato para compatibilidad
    const formattedOrder = {
      id: updatedOrder.order_id,
      orderId: updatedOrder.order_id,
      date: updatedOrder.created_at,
      customerName: updatedOrder.customer_name,
      customerEmail: updatedOrder.customer_email,
      customerPhone: updatedOrder.customer_phone,
      notes: updatedOrder.notes,
      items: updatedOrder.items,
      total: updatedOrder.total,
      storeId: updatedOrder.store_id,
      status: updatedOrder.status,
      processedBy: updatedOrder.user_id,
      customerAddress: updatedOrder.customerAddress,
      deliveryMethod: updatedOrder.delivery_method,
      deliveryStatus: updatedOrder.delivery_status,
      deliveryFee: updatedOrder.delivery_fee,
      deliveryDate: updatedOrder.delivery_date,
      deliveryTime: updatedOrder.delivery_time,
      latitude: updatedOrder.latitude,
      longitude: updatedOrder.longitude
    };

    // Invalidar cache de pedidos
    revalidateTag(`orders-${updatedOrder.store_id}`);
    revalidateTag('orders');

    return NextResponse.json(formattedOrder);

  } catch (error: any) {
    console.error('❌ [Orders API] Error general actualizando pedido:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor', detalles: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('orderId');
    const storeId = searchParams.get('storeId');

    if (!orderId || !storeId) {
      return NextResponse.json({
        error: "Faltan parámetros 'orderId' y/o 'storeId'"
      }, { status: 400 });
    }

    console.log('🗑️ [Orders API] Eliminando pedido:', orderId);

    const { data: deleted, error } = await supabase
      .from('orders')
      .delete()
      .eq('order_id', orderId)
      .eq('store_id', storeId)
      .select()
      .single();

    if (error) {
      console.error('❌ [Orders API] Error eliminando pedido:', error);
      throw error;
    }

    if (!deleted) {
      return NextResponse.json({ error: "Orden no existe" }, { status: 404 });
    }

    console.log('✅ [Orders API] Pedido eliminado:', orderId);

    return NextResponse.json({
      success: true,
      message: "Orden eliminada exitosamente"
    });
  } catch (error: any) {
    console.error('❌ [Orders API] Error eliminando pedido:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor', detalles: error.message },
      { status: 500 }
    );
  }
}