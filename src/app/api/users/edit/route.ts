import { NextResponse, NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import bcrypt from 'bcryptjs';

export async function PUT(request: NextRequest) {
  try {
    const data = await request.json();
    const { uid, ...updateData } = data;

    if (!uid) {
      return NextResponse.json({ error: 'uid es requerido' }, { status: 400 });
    }

    console.log('📝 [Users Edit API] Updating user:', { uid, updateData });

    // Preparar datos para actualizar en Supabase
    const supabaseUpdateData: any = {};

    if (updateData.displayName !== undefined) supabaseUpdateData.display_name = updateData.displayName;
    if (updateData.email !== undefined) supabaseUpdateData.email = updateData.email;
    if (updateData.phone !== undefined) supabaseUpdateData.phone = updateData.phone;
    if (updateData.role !== undefined) supabaseUpdateData.role = updateData.role;
    if (updateData.status !== undefined) supabaseUpdateData.status = updateData.status;
    if (updateData.permissions !== undefined) supabaseUpdateData.permissions = updateData.permissions;
    if (updateData.storeId !== undefined) supabaseUpdateData.store_id = updateData.storeId;

    // Si hay cambio de contraseña
    if (updateData.password) {
      const salt = await bcrypt.genSalt(10);
      supabaseUpdateData.password = await bcrypt.hash(updateData.password, salt);
    }

    const { data: updatedUser, error } = await supabaseAdmin
      .from('users')
      .update(supabaseUpdateData)
      .eq('uid', uid)
      .select()
      .single();

    if (error) {
      console.error('❌ [Users Edit API] Error updating user:', error);
      throw error;
    }

    if (!updatedUser) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    console.log('✅ [Users Edit API] User updated successfully');

    // Transformar respuesta a camelCase
    const response = {
      uid: updatedUser.uid,
      email: updatedUser.email,
      displayName: updatedUser.display_name,
      phone: updatedUser.phone,
      role: updatedUser.role,
      storeId: updatedUser.store_id,
      status: updatedUser.status,
      permissions: updatedUser.permissions,
      createdAt: updatedUser.created_at
    };

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('❌ [Users Edit API] Unexpected error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const uid = searchParams.get('uid');
    const storeId = searchParams.get('storeId');

    if (!uid || !storeId) {
      return NextResponse.json({ error: 'uid y storeId son requeridos' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('users')
      .delete()
      .eq('uid', uid)
      .eq('store_id', storeId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}