import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Lazy Supabase client initialization to avoid build-time errors
const getSupabaseClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase environment variables');
  }

  return createClient(supabaseUrl, supabaseServiceKey);
};

// Helper para generar IDs
const generateId = (prefix: string) => {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('storeId');

    if (!storeId) {
      return NextResponse.json({ error: 'storeId requerido' }, { status: 400 });
    }

    // Obtener clientes de Supabase
    const supabase = getSupabaseClient();
    const { data: customers, error } = await supabase
      .from('customers')
      .select('*')
      .eq('store_id', storeId)
      .order('name', { ascending: true });

    if (error) {
      console.error('❌ Error obteniendo clientes de Supabase:', error);
      return NextResponse.json(
        { error: 'No se pudo obtener la lista de clientes', detalles: error.message },
        { status: 500 }
      );
    }

    // Mapear campos de Supabase a tu formato actual
    const formattedCustomers = customers?.map((customer: any) => ({
      id: customer.id,
      name: customer.name,
      phone: customer.phone,
      address: customer.address,
      cardId: customer.card_id,
      storeId: customer.store_id,
      createdAt: customer.created_at,
      updatedAt: customer.updated_at
    })) || [];

    console.log('✅ [Customers API] Clientes obtenidos:', formattedCustomers.length);
    return NextResponse.json(formattedCustomers);

  } catch (error: any) {
    console.error('❌ Error general obteniendo clientes:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor', detalles: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    // Validaciones básicas
    if (!data.name || !data.storeId) {
      return NextResponse.json({ error: "Campos requeridos faltantes" }, { status: 400 });
    }

    // Verificar si ya existe un cliente con el mismo teléfono en la misma tienda
    if (data.phone && data.phone.trim()) {
      const supabase = getSupabaseClient();
      const { data: existingCustomer, error: searchError } = await supabase
        .from('customers')
        .select('id, name')
        .eq('store_id', data.storeId)
        .eq('phone', data.phone.trim())
        .single();

      if (existingCustomer) {
        console.warn('⚠️ [Customers API] Cliente duplicado intentado:', data.phone);
        return NextResponse.json(
          { error: `Ya existe un cliente con el teléfono ${data.phone}: ${existingCustomer.name}` },
          { status: 409 }
        );
      }
    }

    // Generar ID único si no se proporciona
    const customerId = data.id || generateId('CUST');

    // Preparar datos para Supabase
    const customerData = {
      id: customerId,
      name: data.name.trim(),
      phone: data.phone?.trim() || null,
      address: data.address?.trim() || null,
      card_id: data.cardId?.trim() || null,
      store_id: data.storeId
      // created_at and updated_at removed to test if columns are missing
    };

    console.log('👤 [Customers API] Creando cliente en Supabase:', customerId);

    // Insertar cliente en Supabase
    const supabase = getSupabaseClient();
    const { data: createdCustomer, error } = await supabase
      .from('customers')
      .insert([customerData])
      .select()
      .single();

    if (error) {
      console.error('❌ Error creando cliente en Supabase:', error);

      // Verificar si es error de duplicado
      if (error.code === '23505') { // Código de violación de unique constraint
        return NextResponse.json(
          { error: 'Ya existe un cliente con este ID o teléfono' },
          { status: 409 }
        );
      }

      return NextResponse.json(
        { error: 'Error al crear el cliente', detalles: error.message },
        { status: 500 }
      );
    }

    console.log('✅ [Customers API] Cliente creado exitosamente:', customerId);

    // Formatear respuesta para mantener compatibilidad
    const formattedResponse = {
      id: createdCustomer.id,
      name: createdCustomer.name,
      phone: createdCustomer.phone,
      address: createdCustomer.address,
      cardId: createdCustomer.card_id,
      storeId: createdCustomer.store_id,
      createdAt: createdCustomer.created_at,
      updatedAt: createdCustomer.updated_at
    };

    return NextResponse.json(formattedResponse);

  } catch (error: any) {
    console.error('❌ Error general creando cliente:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor', detalles: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const data = await request.json();

    if (!data.id || !data.storeId) {
      return NextResponse.json({ error: "Campos requeridos 'id' y 'storeId'" }, { status: 400 });
    }

    // Preparar datos para actualización
    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    if (data.name !== undefined) updateData.name = data.name.trim();
    if (data.phone !== undefined) updateData.phone = data.phone?.trim() || null;
    if (data.address !== undefined) updateData.address = data.address?.trim() || null;
    if (data.cardId !== undefined) updateData.card_id = data.cardId?.trim() || null;

    console.log('👤 [Customers API] Actualizando cliente:', data.id);

    // Actualizar en Supabase
    const supabase = getSupabaseClient();
    const { data: updatedCustomer, error } = await supabase
      .from('customers')
      .update(updateData)
      .eq('id', data.id)
      .eq('store_id', data.storeId)
      .select()
      .single();

    if (error) {
      console.error('❌ Error actualizando cliente en Supabase:', error);
      return NextResponse.json(
        { error: 'Error al actualizar el cliente', detalles: error.message },
        { status: 500 }
      );
    }

    if (!updatedCustomer) {
      return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 });
    }

    // Formatear respuesta
    const formattedResponse = {
      id: updatedCustomer.id,
      name: updatedCustomer.name,
      phone: updatedCustomer.phone,
      address: updatedCustomer.address,
      cardId: updatedCustomer.card_id,
      storeId: updatedCustomer.store_id,
      createdAt: updatedCustomer.created_at,
      updatedAt: updatedCustomer.updated_at
    };

    console.log('✅ [Customers API] Cliente actualizado exitosamente:', data.id);
    return NextResponse.json(formattedResponse);

  } catch (error: any) {
    console.error('❌ Error general actualizando cliente:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor', detalles: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const storeId = searchParams.get('storeId');

    if (!id || !storeId) {
      return NextResponse.json({ error: "Faltan parámetros 'id' y/o 'storeId'" }, { status: 400 });
    }

    console.log('👤 [Customers API] Eliminando cliente:', id);

    // Eliminar de Supabase
    const supabase = getSupabaseClient();
    const { error } = await supabase
      .from('customers')
      .delete()
      .eq('id', id)
      .eq('store_id', storeId);

    if (error) {
      console.error('❌ Error eliminando cliente de Supabase:', error);
      return NextResponse.json(
        { error: 'Error al eliminar el cliente', detalles: error.message },
        { status: 500 }
      );
    }

    console.log('✅ [Customers API] Cliente eliminado exitosamente:', id);
    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('❌ Error general eliminando cliente:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor', detalles: error.message },
      { status: 500 }
    );
  }
}