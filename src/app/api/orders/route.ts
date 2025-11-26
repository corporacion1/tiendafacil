import { NextResponse, NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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
  try {
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('storeId');
    const phone = searchParams.get('phone');
    const id = searchParams.get('id');
    const status = searchParams.get('status');
    const customerEmail = searchParams.get('customerEmail');
    const limit = parseInt(searchParams.get('limit') || '50');

    console.log('🔍 [Orders API] Búsqueda con parámetros:', { storeId, phone, id, status, customerEmail, limit });

    // Construir query para Supabase
    let query = supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    // Aplicar filtros
    if (storeId) {
      query = query.eq('store_id', storeId);
    }
    
    if (phone) {
      query = query.eq('customer_phone', phone);
    }
    
    if (id) {
      query = query.eq('order_id', id);
      console.log('🎯 [Orders API] Buscando pedido específico:', id);
    }
    
    if (customerEmail) {
      query = query.eq('customer_email', customerEmail);
      console.log('📧 [Orders API] Filtrando por email:', customerEmail);
    }
    
    // Filtro por estado
    if (status) {
      if (status.includes(',')) {
        const statusArray = status.split(',').map(s => s.trim());
        query = query.in('status', statusArray);
        console.log('🔍 [Orders API] Filtrando por múltiples estados:', statusArray);
      } else {
        query = query.eq('status', status);
        console.log('🔍 [Orders API] Filtrando por estado único:', status);
      }
    } else {
      // Por defecto, solo mostrar pedidos pendientes y en procesamiento
      query = query.in('status', [OrderStatus.PENDING, OrderStatus.PROCESSING]);
      console.log('🔍 [Orders API] Usando filtro por defecto: pending, processing');
    }

    // Ejecutar query
    const { data: orders, error } = await query;

    if (error) {
      console.error('❌ [Orders API] Error obteniendo pedidos de Supabase:', error);
      return NextResponse.json(
        { error: 'Error al obtener pedidos', detalles: error.message },
        { status: 500 }
      );
    }

    console.log('📊 [Orders API] Pedidos encontrados:', orders?.length || 0);

    // Si se busca por ID específico, devolver el pedido directamente
    if (id && orders && orders.length > 0) {
      const order = orders[0];
      console.log('✅ [Orders API] Pedido encontrado:', order.order_id);
      
      // Convertir formato para compatibilidad
      const formattedOrder = {
        orderId: order.order_id,
        id: order.order_id, // Mantener compatibilidad
        createdAt: order.created_at,
        date: order.created_at, // Mantener compatibilidad
        updatedAt: order.updated_at,
        customerName: order.customer_name,
        customerPhone: order.customer_phone,
        customerEmail: order.customer_email,
        items: order.items,
        total: order.total,
        storeId: order.store_id,
        status: order.status
      };
      
      return NextResponse.json(formattedOrder);
    }

    // Para búsquedas generales, devolver lista
    const formattedOrders = (orders || []).map(order => ({
      orderId: order.order_id,
      id: order.order_id, // Mantener compatibilidad
      createdAt: order.created_at,
      date: order.created_at, // Mantener compatibilidad
      updatedAt: order.updated_at,
      customerName: order.customer_name,
      customerPhone: order.customer_phone,
      customerEmail: order.customer_email,
      items: order.items,
      total: order.total,
      storeId: order.store_id,
      status: order.status,
      processedAt: order.processed_at,
      processedBy: order.processed_by,
      saleId: order.sale_id,
      notes: order.notes
    }));

    return NextResponse.json(formattedOrders);

  } catch (error: any) {
    console.error('❌ [Orders API] Error general obteniendo pedidos:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor', detalles: error.message },
      { status: 500 }
    );
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
      order_id: orderId,
      customer_name: body.customerName,
      customer_phone: body.customerPhone,
      customer_email: body.customerEmail,
      items: body.items,
      total: body.total || 0,
      store_id: body.storeId,
      status: 'pending',
      notes: body.notes,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

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
        createdAt: createdOrder.created_at,
        updatedAt: createdOrder.updated_at
      }
    };

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
    const { orderId, status, processedBy, saleId, notes, storeId } = body;

    if (!orderId || !status || !storeId) {
      return NextResponse.json({ 
        error: 'orderId, status y storeId son requeridos' 
      }, { status: 400 });
    }

    console.log('🔄 [Orders API] Actualizando pedido:', orderId, 'a estado:', status);

    // Preparar datos para actualización
    const updateData: any = {
      status,
      updated_at: new Date().toISOString()
    };

    // Si se marca como procesado, agregar campos adicionales
    if (status === OrderStatus.PROCESSED) {
      updateData.processed_at = new Date().toISOString();
      if (processedBy) updateData.processed_by = processedBy;
      if (saleId) updateData.sale_id = saleId;
    }

    if (notes !== undefined) updateData.notes = notes;

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
      customerPhone: updatedOrder.customer_phone,
      items: updatedOrder.items,
      total: updatedOrder.total,
      storeId: updatedOrder.store_id,
      status: updatedOrder.status,
      processedAt: updatedOrder.processed_at,
      processedBy: updatedOrder.processed_by,
      saleId: updatedOrder.sale_id,
      notes: updatedOrder.notes
    };

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