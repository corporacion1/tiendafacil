import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// GET /api/users - Obtener todos los usuarios (solo para superadmin)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('storeId');

    let query = supabaseAdmin
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    if (storeId) {
      query = query.eq('store_id', storeId);
    }

    const { data: users, error } = await query;

    if (error) throw error;

    // Transformar snake_case a camelCase
    const transformedUsers = users?.map((u: any) => ({
      uid: u.uid,
      email: u.email,
      displayName: u.display_name,
      photoURL: u.photo_url,
      role: u.role,
      status: u.status,
      storeId: u.store_id,
      storeRequest: u.store_request,
      phone: u.phone,
      createdAt: u.created_at
    })) || [];

    console.log(`📋 [Users API] Returning ${transformedUsers.length} users`);
    console.log('👥 [Users API] Sample user data:', transformedUsers[0]);

    return NextResponse.json(transformedUsers);
  } catch (error: any) {
    console.error('❌ [Users API] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/users - Crear un nuevo usuario
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.email || !body.displayName) {
      return NextResponse.json({ error: 'email y displayName son requeridos' }, { status: 400 });
    }

    // Mapear a snake_case
    const userData = {
      uid: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      email: body.email,
      display_name: body.displayName,
      photo_url: body.photoURL,
      role: body.role || 'user',
      status: 'active',
      store_id: body.storeId,
      store_request: body.storeRequest,
      phone: body.phone,
      password: body.password // Nota: En producción esto debería estar hasheado
    };

    const { data: savedUser, error } = await supabaseAdmin
      .from('users')
      .insert([userData])
      .select()
      .single();

    if (error) throw error;

    // Transformar respuesta
    const response = {
      uid: savedUser.uid,
      email: savedUser.email,
      displayName: savedUser.display_name,
      photoURL: savedUser.photo_url,
      role: savedUser.role,
      status: savedUser.status,
      storeId: savedUser.store_id,
      storeRequest: savedUser.store_request,
      phone: savedUser.phone,
      createdAt: savedUser.created_at
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error: any) {
    console.error('❌ [Users API] Error creating user:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT /api/users - Actualizar un usuario
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { uid, ...updateData } = body;

    if (!uid) {
      return NextResponse.json({ error: 'uid es requerido' }, { status: 400 });
    }

    // Mapear campos a snake_case
    const supabaseUpdateData: any = {};
    if (updateData.email) supabaseUpdateData.email = updateData.email;
    if (updateData.displayName) supabaseUpdateData.display_name = updateData.displayName;
    if (updateData.photoURL) supabaseUpdateData.photo_url = updateData.photoURL;
    if (updateData.role) supabaseUpdateData.role = updateData.role;
    if (updateData.status) supabaseUpdateData.status = updateData.status;
    if (updateData.storeId) supabaseUpdateData.store_id = updateData.storeId;
    if (updateData.storeRequest) supabaseUpdateData.store_request = updateData.storeRequest;
    if (updateData.phone) supabaseUpdateData.phone = updateData.phone;

    const { data: updatedUser, error } = await supabaseAdmin
      .from('users')
      .update(supabaseUpdateData)
      .eq('uid', uid)
      .select()
      .single();

    if (error) throw error;

    if (!updatedUser) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    // Transformar respuesta
    const response = {
      uid: updatedUser.uid,
      email: updatedUser.email,
      displayName: updatedUser.display_name,
      photoURL: updatedUser.photo_url,
      role: updatedUser.role,
      status: updatedUser.status,
      storeId: updatedUser.store_id,
      storeRequest: updatedUser.store_request,
      phone: updatedUser.phone,
      createdAt: updatedUser.created_at
    };

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('❌ [Users API] Error updating user:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/users - Eliminar un usuario
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const uid = searchParams.get('uid');

    if (!uid) {
      return NextResponse.json({ error: 'uid es requerido' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('users')
      .delete()
      .eq('uid', uid);

    if (error) throw error;

    return NextResponse.json({ message: 'Usuario eliminado exitosamente' });
  } catch (error: any) {
    console.error('❌ [Users API] Error deleting user:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}