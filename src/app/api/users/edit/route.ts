import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { User } from '@/models/User';
import { Store } from '@/models/Store';

export async function PUT(request: Request) {
  try {
    await connectToDatabase();
    
    const body = await request.json();
    const { uid, storeId, role, displayName, phone, email } = body;
    
    console.log('👤 [Edit User] Datos recibidos:', { uid, storeId, role, displayName, phone, email });
    
    // Validar campos requeridos
    if (!uid) {
      return NextResponse.json(
        { error: "UID del usuario es requerido" },
        { status: 400 }
      );
    }
    
    // Buscar el usuario
    const user = await User.findOne({ uid });
    if (!user) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      );
    }
    
    // Si se está asignando una tienda, verificar que existe
    if (storeId) {
      const store = await Store.findOne({ storeId });
      if (!store) {
        return NextResponse.json(
          { error: "Tienda no encontrada" },
          { status: 404 }
        );
      }
      
      // Si el usuario cambia de tienda, removerlo de la tienda anterior
      if (user.storeId && user.storeId !== storeId) {
        console.log('🔄 [Edit User] Removiendo usuario de tienda anterior:', user.storeId);
        await Store.updateOne(
          { storeId: user.storeId },
          { 
            $pull: { 
              ownerIds: uid,
              userRoles: { uid: uid }
            }
          }
        );
      }
      
      // Agregar usuario a la nueva tienda si no está ya
      const isOwner = store.ownerIds?.includes(uid);
      const hasRole = store.userRoles?.some((ur: any) => ur.uid === uid);
      
      if (!isOwner || !hasRole) {
        console.log('➕ [Edit User] Agregando usuario a tienda:', storeId);
        await Store.updateOne(
          { storeId },
          { 
            $addToSet: { 
              ownerIds: uid,
              userRoles: { uid: uid, role: role || 'user' }
            }
          }
        );
      }
    }
    
    // Preparar datos de actualización
    const updateData: any = {};
    if (storeId !== undefined) updateData.storeId = storeId;
    if (role !== undefined) updateData.role = role;
    if (displayName !== undefined) updateData.displayName = displayName;
    if (phone !== undefined) updateData.phone = phone;
    if (email !== undefined) updateData.email = email;
    
    // Actualizar usuario
    const updatedUser = await User.findOneAndUpdate(
      { uid },
      { $set: updateData },
      { new: true }
    );
    
    console.log('✅ [Edit User] Usuario actualizado:', updatedUser.uid);
    
    return NextResponse.json({
      success: true,
      message: 'Usuario actualizado exitosamente',
      user: {
        uid: updatedUser.uid,
        email: updatedUser.email,
        displayName: updatedUser.displayName,
        phone: updatedUser.phone,
        role: updatedUser.role,
        storeId: updatedUser.storeId,
        status: updatedUser.status
      }
    });
    
  } catch (error: any) {
    console.error('❌ [Edit User] Error:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Error al actualizar usuario',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

// API para "Ver como este usuario" - cambiar contexto de sesión
export async function POST(request: Request) {
  try {
    await connectToDatabase();
    
    const body = await request.json();
    const { targetUid, adminUid } = body;
    
    console.log('👁️ [View As User] Solicitud de cambio de contexto:', { targetUid, adminUid });
    
    // Validar campos requeridos
    if (!targetUid || !adminUid) {
      return NextResponse.json(
        { error: "UID del usuario objetivo y administrador son requeridos" },
        { status: 400 }
      );
    }
    
    // Verificar que el admin tiene permisos
    const admin = await User.findOne({ uid: adminUid });
    if (!admin || (admin.role !== 'admin' && admin.role !== 'super_admin')) {
      return NextResponse.json(
        { error: "No tienes permisos para realizar esta acción" },
        { status: 403 }
      );
    }
    
    // Buscar el usuario objetivo
    const targetUser = await User.findOne({ uid: targetUid });
    if (!targetUser) {
      return NextResponse.json(
        { error: "Usuario objetivo no encontrado" },
        { status: 404 }
      );
    }
    
    // Obtener información de la tienda del usuario
    let storeInfo = null;
    if (targetUser.storeId) {
      const store = await Store.findOne({ storeId: targetUser.storeId });
      if (store) {
        storeInfo = {
          storeId: store.storeId,
          name: store.name,
          businessType: store.businessType,
          status: store.status
        };
      }
    }
    
    console.log('✅ [View As User] Contexto de usuario obtenido');
    
    return NextResponse.json({
      success: true,
      message: 'Contexto de usuario obtenido exitosamente',
      userContext: {
        uid: targetUser.uid,
        email: targetUser.email,
        displayName: targetUser.displayName,
        role: targetUser.role,
        storeId: targetUser.storeId,
        store: storeInfo
      },
      adminContext: {
        uid: admin.uid,
        email: admin.email,
        displayName: admin.displayName
      }
    });
    
  } catch (error: any) {
    console.error('❌ [View As User] Error:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Error al obtener contexto de usuario',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}