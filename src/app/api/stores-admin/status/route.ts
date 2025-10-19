import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Store } from '@/models/Store';

// PUT /api/stores-admin/status - Update store status
export async function PUT(request: Request) {
  try {
    await connectToDatabase();
    
    const body = await request.json();
    const { storeId, newStatus, reason } = body;

    if (!storeId || !newStatus) {
      return NextResponse.json(
        { error: 'storeId y newStatus son requeridos' },
        { status: 400 }
      );
    }

    if (!['active', 'inactive'].includes(newStatus)) {
      return NextResponse.json(
        { error: 'Estado inválido. Debe ser active o inactive' },
        { status: 400 }
      );
    }

    console.log('🔄 [Stores Admin Status API] Updating store status:', { storeId, newStatus, reason });

    // Find and update the store
    const updatedStore = await Store.findOneAndUpdate(
      { storeId: storeId },
      { 
        $set: { 
          status: newStatus,
          updatedAt: new Date()
        }
      },
      { new: true }
    );

    if (!updatedStore) {
      console.error('❌ [Stores Admin Status API] Store not found:', storeId);
      return NextResponse.json(
        { error: 'Tienda no encontrada' },
        { status: 404 }
      );
    }

    // Log the status change for audit purposes
    console.log('📝 [Stores Admin Status API] Status change logged:', {
      storeId,
      oldStatus: updatedStore.status,
      newStatus,
      reason,
      timestamp: new Date().toISOString()
    });

    const response = {
      success: true,
      store: {
        storeId: updatedStore.storeId,
        name: updatedStore.name,
        status: updatedStore.status,
        updatedAt: updatedStore.updatedAt
      },
      message: `Estado de la tienda actualizado a ${newStatus}`
    };

    console.log('✅ [Stores Admin Status API] Store status updated successfully');
    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ [Stores Admin Status API] Error:', error);
    return NextResponse.json(
      { error: 'Error al actualizar el estado de la tienda' },
      { status: 500 }
    );
  }
}