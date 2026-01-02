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

/**
 * Normalizar estatus: lowercase y trim
 */
const normalizeStatus = (status: string | null | undefined): string => {
  if (!status) return 'pending';
  return status.toString().toLowerCase().trim();
};

/**
 * Validar estatus
 */
const isValidStatus = (status: string): boolean => {
  const validStatuses = ['pending', 'processing', 'processed', 'cancelled', 'expired'];
  return validStatuses.includes(status.toLowerCase().trim());
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
  const noCache = searchParams.get('noCache');
  
  // Si se busca por ID específico, buscar orden individual
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
      status: normalizeStatus(order.status), // Normalizar estatus al leer
      processedBy: order.user_id,
      createdAt: order.created_at,
      updatedAt: order.updated_at,
      customerAddress: order.customer_address,
      deliveryMethod: order.delivery_method,
      deliveryStatus: order.delivery_status,
      deliveryProviderID: order.delivery_provider_id,
      deliveryFee: order.delivery_fee,
      deliveryDate: order.delivery_date,
      deliveryTime: order.delivery_time,
      deliveryNotes: order.delivery_notes,
      notes: order.notes,
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
    // Agregar tags específicos para invalidación más precisa
    if (customerEmail) {
      cacheTags.push(`orders-${storeId}-${customerEmail}`);
    }

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
        revalidate: 5 // Check DB every 5s max if no revalidation event occurs
      }
    );

    let orders;
    if (noCache) {
      // Fetch directly from database without cache
      console.log('🔍 [Orders API] Fetching orders without cache for store:', storeId);
      
      let query = supabase
        .from('orders')
        .select('*')
        .eq('store_id', storeId);

      // Apply status filter if provided
      if (status) {
        const statuses = status.split(',');
        const sStatus = statuses[0]; // Use first status for now
        
        if (statuses.length > 1) {
          query = query.in('status', statuses);
        } else {
          query = query.eq('status', sStatus);
        }
      }

      if (customerEmail) {
        query = query.eq('customer_email', customerEmail);
      }

      const { data, error } = await query;
      if (error) throw error;
      orders = data;
    } else {
      // Use cached version
      orders = await getCachedOrders(storeId, status, customerEmail);
    }

    // Transform snake_case to camelCase
    const formattedOrders = orders?.map((order: any) => ({
      orderId: order.order_id,
      storeId: order.store_id,
      customerName: order.customer_name,
      customerPhone: order.customer_phone,
      customerEmail: order.customer_email,
      items: typeof order.items === 'string' ? JSON.parse(order.items) : order.items,
      total: order.total,
      status: normalizeStatus(order.status), // Normalizar estatus al leer
      notes: order.notes,
      processedBy: order.user_id,
      saleId: order.sale_id,
      createdAt: order.created_at,
      updatedAt: order.updated_at,
      customerAddress: order.customer_address,
      deliveryMethod: order.delivery_method,
      deliveryStatus: order.delivery_status,
      deliveryProviderID: order.delivery_provider_id,
      deliveryFee: order.delivery_fee,
      deliveryDate: order.delivery_date,
      deliveryTime: order.delivery_time,
      deliveryNotes: order.delivery_notes,
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

    // Normalizar estatus al crear
    const normalizedStatus = normalizeStatus(body.status) || 'pending';
    if (!isValidStatus(normalizedStatus)) {
      return NextResponse.json({
        error: `Estatus inválido: ${body.status}`
      }, { status: 400 });
    }

    // Preparar datos para Supabase - Solo incluir campos que existen en la tabla
    const orderData: any = {
      id: orderId, // Add id field for NOT NULL constraint
      order_id: orderId,
      customer_name: body.customerName,
      customer_phone: body.customerPhone,
      customer_email: body.customerEmail,
      items: body.items,
      total: body.total || 0,
      store_id: body.storeId,
      status: normalizedStatus, // Usar estatus normalizado
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    
    // Agregar campos opcionales solo si existen y tienen valor
    if (body.notes !== undefined) orderData.notes = body.notes;
    if (body.user_id !== undefined) orderData.processed_by = body.user_id;
    if (body.saleId !== undefined) orderData.sale_id = body.saleId;
    if (body.customerAddress !== undefined) orderData.customer_address = body.customerAddress;
    if (body.deliveryMethod !== undefined) orderData.delivery_method = body.deliveryMethod;
    if (body.deliveryStatus !== undefined) orderData.delivery_status = body.deliveryStatus;
    if (body.deliveryProviderID !== undefined) orderData.delivery_provider_id = body.deliveryProviderID;
    if (body.deliveryFee !== undefined) orderData.delivery_fee = body.deliveryFee;
    if (body.deliveryDate !== undefined) orderData.delivery_date = body.deliveryDate;
    if (body.deliveryTime !== undefined) orderData.delivery_time = body.deliveryTime;
    if (body.deliveryNotes !== undefined) orderData.delivery_notes = body.deliveryNotes;
    if (body.latitude !== undefined) orderData.latitude = body.latitude;
    if (body.longitude !== undefined) orderData.longitude = body.longitude;

    // Agregar link de ubicación a las notas si hay coordenadas (para compatibilidad)
    if (body.latitude && body.longitude) {
      const mapsLink = `\n📍 Ubicación: https://www.google.com/maps?q=${body.latitude},${body.longitude}`;
      orderData.notes = (orderData.notes || '') + mapsLink;
    }

    console.log('📦 [Orders API] Creando pedido en Supabase:', orderId);

    // Insertar pedido en Supabase
    let { data: createdOrder, error } = await supabase
      .from('orders')
      .insert([orderData])
      .select()
      .single();

    // Si hay error de columna no encontrada, intentar con un subconjunto de campos
    if (error && error.message.includes('column') && error.message.includes('does not exist')) {
      console.warn('⚠️ [Orders API] Error de columna en insert - intentando con campos básicos:', error.message);
      
      // Crear un objeto con solo los campos básicos que deben existir
      const basicOrderData: any = {
        id: orderId,
        order_id: orderId,
        customer_name: body.customerName,
        customer_phone: body.customerPhone,
        customer_email: body.customerEmail,
        items: body.items,
        total: body.total || 0,
        store_id: body.storeId,
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      
      // Agregar campos opcionales básicos que probablemente existan
      if (body.notes !== undefined) basicOrderData.notes = body.notes;
      
      const result = await supabase
        .from('orders')
        .insert([basicOrderData])
        .select()
        .single();
        
      createdOrder = result.data;
      error = result.error;
    }

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
        status: normalizeStatus(createdOrder.status), // Normalizar estatus en respuesta
        notes: createdOrder.notes,
        processedBy: createdOrder.user_id,
        saleId: createdOrder.sale_id,
        createdAt: createdOrder.created_at,
        updatedAt: createdOrder.updated_at,
        customerAddress: createdOrder.customer_address,
        deliveryMethod: createdOrder.delivery_method,
        deliveryStatus: createdOrder.delivery_status,
        deliveryProviderID: createdOrder.delivery_provider_id,
        deliveryFee: createdOrder.delivery_fee,
        deliveryDate: createdOrder.delivery_date,
        deliveryTime: createdOrder.delivery_time,
        deliveryNotes: createdOrder.delivery_notes,
        latitude: createdOrder.latitude,
        longitude: createdOrder.longitude
      }
    };

    // Invalidar cache de pedidos para todas las combinaciones relevantes
    revalidateTag(`orders-${createdOrder.store_id}`);
    revalidateTag('orders');
    if (createdOrder.customer_email) {
      // Invalidar también la caché específica del cliente
      revalidateTag(`orders-${createdOrder.store_id}-${createdOrder.customer_email}`);
    }

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
    const { orderId, status, processedBy, saleId, notes, storeId, items, total, customerName, customerPhone, customerEmail, latitude, longitude, customerAddress, deliveryMethod, deliveryStatus, deliveryProviderID, deliveryFee, deliveryDate, deliveryTime, deliveryNotes } = body;

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
    if (status) {
      const normalizedStatus = normalizeStatus(status);
      if (!isValidStatus(normalizedStatus)) {
        return NextResponse.json({
          error: `Estatus inválido: ${status}`
        }, { status: 400 });
      }
      updateData.status = normalizedStatus; // Usar estatus normalizado
    }
    if (notes) updateData.notes = notes;
    if (items) updateData.items = items;
    if (total !== undefined) updateData.total = total;
    if (customerName) updateData.customer_name = customerName;
    if (customerPhone) updateData.customer_phone = customerPhone;
    // Solo actualizar customer_email si tiene un valor válido (no vacío)
    if (customerEmail !== undefined && customerEmail !== "") updateData.customer_email = customerEmail;
    if (processedBy !== undefined) updateData.processed_by = processedBy;
    if (saleId !== undefined) updateData.sale_id = saleId;
    if (notes !== undefined) updateData.notes = notes;
    if (customerAddress !== undefined) updateData.customer_address = customerAddress;
    if (latitude !== undefined) updateData.latitude = latitude;
    if (longitude !== undefined) updateData.longitude = longitude;
    if (deliveryMethod !== undefined) updateData.delivery_method = deliveryMethod;
    if (deliveryStatus !== undefined) updateData.delivery_status = deliveryStatus;
    if (deliveryProviderID !== undefined) updateData.delivery_provider_id = deliveryProviderID;
    if (deliveryFee !== undefined) updateData.delivery_fee = deliveryFee;
    if (deliveryDate !== undefined) updateData.delivery_date = deliveryDate;
    if (deliveryTime !== undefined) updateData.delivery_time = deliveryTime;
    if (deliveryNotes !== undefined) updateData.delivery_notes = deliveryNotes;

    // Si se marca como procesado, agregar campos adicionales
    if (status === OrderStatus.PROCESSED) {
      updateData.processed_at = new Date().toISOString();
      if (processedBy) updateData.processed_by = processedBy;
      if (saleId) updateData.sale_id = saleId;
    }

    // Actualizar en Supabase
    let { data: updatedOrder, error } = await supabase
      .from('orders')
      .update(updateData)
      .eq('order_id', orderId)
      .eq('store_id', storeId)
      .select()
      .single();

    // Si hay error de columna no encontrada, intentar con un subconjunto de campos
    if (error && error.message.includes('column') && error.message.includes('does not exist')) {
      console.warn('⚠️ [Orders API] Error de columna en update - intentando con campos básicos:', error.message);
      
      // Crear un objeto con solo los campos básicos que deben existir
      const basicUpdateData: any = {
        updated_at: new Date().toISOString()
      };
      
      // Agregar campos básicos que probablemente existan
      if (status) basicUpdateData.status = status;
      if (notes !== undefined) basicUpdateData.notes = notes;
      if (customerName) basicUpdateData.customer_name = customerName;
      if (customerPhone) basicUpdateData.customer_phone = customerPhone;
      // Solo actualizar customer_email si tiene un valor válido (no vacío)
      if (customerEmail !== undefined && customerEmail !== "") basicUpdateData.customer_email = customerEmail;
      
      const result = await supabase
        .from('orders')
        .update(basicUpdateData)
        .eq('order_id', orderId)
        .eq('store_id', storeId)
        .select()
        .single();
        
      updatedOrder = result.data;
      error = result.error;
    }

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
      status: normalizeStatus(updatedOrder.status), // Normalizar estatus en respuesta
      processedBy: updatedOrder.user_id,
      saleId: updatedOrder.sale_id,
      customerAddress: updatedOrder.customer_address,
      deliveryMethod: updatedOrder.delivery_method,
      deliveryStatus: updatedOrder.delivery_status,
      deliveryProviderID: updatedOrder.delivery_provider_id,
      deliveryFee: updatedOrder.delivery_fee,
      deliveryDate: updatedOrder.delivery_date,
      deliveryTime: updatedOrder.delivery_time,
      deliveryNotes: updatedOrder.delivery_notes,
      latitude: updatedOrder.latitude,
      longitude: updatedOrder.longitude
    };

    // Invalidar cache de pedidos para todas las combinaciones relevantes
    revalidateTag(`orders-${updatedOrder.store_id}`);
    revalidateTag('orders');
    if (updatedOrder.customer_email) {
      // Invalidar también la caché específica del cliente
      revalidateTag(`orders-${updatedOrder.store_id}-${updatedOrder.customer_email}`);
    }

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

    // Invalidar cache de pedidos para todas las combinaciones relevantes
    revalidateTag(`orders-${deleted.store_id}`);
    revalidateTag('orders');
    if (deleted.customer_email) {
      // Invalidar también la caché específica del cliente
      revalidateTag(`orders-${deleted.store_id}-${deleted.customer_email}`);
    }

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