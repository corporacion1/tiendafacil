import { NextResponse, NextRequest } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Store } from '@/models/Store';

// Leer tienda actual
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id'); // id de la tienda
    if (!id) {
      console.error('❌ [Stores API] ID de tienda requerido');
      return NextResponse.json({ error: 'ID de tienda requerido' }, { status: 400 });
    }
    
    console.log('🔍 [Stores API] Buscando tienda con ID:', id);
    
    // Try to find by storeId first (correct field), then by id for backwards compatibility
    let store = await Store.findOne({ storeId: id }).lean();
    if (!store) {
      console.log('⚠️ [Stores API] No encontrada por storeId, intentando con id...');
      store = await Store.findOne({ id }).lean();
    }
    
    const storeData = Array.isArray(store) ? store[0] : store;
    if (!storeData) {
      console.error('❌ [Stores API] Tienda no encontrada:', id);
      return NextResponse.json({ error: "Tienda no encontrada" }, { status: 404 });
    }
    
    console.log('✅ [Stores API] Tienda encontrada:', storeData.name);
    return NextResponse.json(storeData);
  } catch (error: any) {
    console.error('❌ [Stores API] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Crear tienda
export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    const data = await request.json();
    
    console.log('📥 [Stores API] Datos recibidos para crear tienda:', JSON.stringify(data, null, 2));
    
    // Ensure we use storeId consistently
    if (!data.storeId && data.id) {
      data.storeId = data.id;
    }
    
    if (!data.storeId || !data.name) {
      console.error('❌ [Stores API] Faltan campos obligatorios:', { storeId: data.storeId, name: data.name });
      return NextResponse.json({ error: "Faltan campos obligatorios (storeId, name)" }, { status: 400 });
    }
    
    // Verificar si ya existe una tienda con este storeId
    const existingStore = await Store.findOne({ storeId: data.storeId });
    if (existingStore) {
      console.log('⚠️ [Stores API] Tienda ya existe, devolviendo existente:', data.storeId);
      return NextResponse.json(existingStore);
    }
    
    console.log('🏪 [Stores API] Creando nueva tienda:', data.storeId);
    const created = await Store.create(data);
    console.log('✅ [Stores API] Tienda creada exitosamente:', created.storeId);
    return NextResponse.json(created);
  } catch (error: any) {
    console.error('❌ [Stores API] Error creando tienda:', error);
    console.error('❌ [Stores API] Stack trace:', error.stack);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Editar tienda/settings
export async function PUT(request: NextRequest) {
  try {
    await connectToDatabase();
    const data = await request.json();
    
    // Support both id and storeId for backwards compatibility
    const storeId = data.storeId || data.id;
    if (!storeId) {
      return NextResponse.json({ error: "Falta storeId de tienda" }, { status: 400 });
    }
    
    console.log('📝 [Stores API] Actualizando tienda:', storeId);
    console.log('🏷️ [Stores API] Nombre recibido:', data.name, 'Longitud:', data.name?.length);
    
    // Try to update by storeId first, then by id
    let updated = await Store.findOneAndUpdate(
      { storeId: storeId },
      { $set: data },
      { new: true }
    );
    
    if (!updated) {
      updated = await Store.findOneAndUpdate(
        { id: storeId },
        { $set: data },
        { new: true }
      );
    }
    
    if (!updated) {
      console.error('❌ [Stores API] Tienda no encontrada para actualizar:', storeId);
      return NextResponse.json({ error: "Tienda no encontrada" }, { status: 404 });
    }
    
    console.log('✅ [Stores API] Tienda actualizada:', updated.name, 'Longitud final:', updated.name?.length);
    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('❌ [Stores API] Error actualizando tienda:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Borrar tienda (si lo permites)
export async function DELETE(request: NextRequest) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: "Falta id" }, { status: 400 });
    
    console.log('🗑️ [Stores API] Eliminando tienda:', id);
    
    // Try to delete by storeId first, then by id
    let deleted = await Store.findOneAndDelete({ storeId: id });
    if (!deleted) {
      deleted = await Store.findOneAndDelete({ id });
    }
    
    if (!deleted) {
      console.error('❌ [Stores API] Tienda no encontrada para eliminar:', id);
      return NextResponse.json({ error: "Tienda no existe" }, { status: 404 });
    }
    
    console.log('✅ [Stores API] Tienda eliminada:', deleted.name);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('❌ [Stores API] Error eliminando tienda:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
