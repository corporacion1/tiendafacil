import { NextResponse, NextRequest } from 'next/server';
import { dbAdmin } from '@/lib/db-client';
import bcrypt from 'bcryptjs';

export async function PUT(request: NextRequest) {
  try {
    const data = await request.json();
    const { uid, ...updateData } = data;

    if (!uid) {
      return NextResponse.json({ error: 'uid es requerido' }, { status: 400 });
    }

    console.log('📝 [Users Edit API] Updating user:', { uid, updateData });

    // Preparar datos para actualizar en Database
    const DBUpdateData: any = {};

    if (updateData.displayName !== undefined) DBUpdateData.display_name = updateData.displayName;
    if (updateData.email !== undefined) DBUpdateData.email = updateData.email;
    if (updateData.phone !== undefined) DBUpdateData.phone = updateData.phone;
    if (updateData.role !== undefined) DBUpdateData.role = updateData.role;
    if (updateData.status !== undefined) DBUpdateData.status = updateData.status;
    if (updateData.permissions !== undefined) DBUpdateData.permissions = updateData.permissions;
    if (updateData.storeId !== undefined) DBUpdateData.store_id = updateData.storeId;
    if (updateData.photoURL !== undefined) DBUpdateData.photo_url = updateData.photoURL;

    // Si hay cambio de contraseña (soporta tanto 'password' como 'newPassword')
    const passwordToUpdate = updateData.newPassword || updateData.password;
    if (passwordToUpdate && passwordToUpdate.trim()) {
      if (passwordToUpdate.length < 6) {
        return NextResponse.json({ error: 'La contraseña debe tener al menos 6 caracteres' }, { status: 400 });
      }
      const salt = await bcrypt.genSalt(10);
      DBUpdateData.password = await bcrypt.hash(passwordToUpdate, salt);
      console.log('🔐 [Users Edit API] Password will be updated');
    }

    const { data: updatedUser, error } = await dbAdmin
      .from('users')
      .update(DBUpdateData)
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
      photoURL: updatedUser.photo_url,
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

    const { error } = await dbAdmin
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