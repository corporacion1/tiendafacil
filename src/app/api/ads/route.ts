import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Ad } from '@/models/Ad';
import { handleDatabaseError, logDatabaseOperation } from '@/lib/db-error-handler';
import { IDGenerator } from '@/lib/id-generator';

// Función para inactivar automáticamente anuncios vencidos
async function inactivateExpiredAds() {
  try {
    const now = new Date();
    const result = await Ad.updateMany(
      {
        expiryDate: { $lt: now.toISOString() },
        status: 'active'
      },
      {
        $set: { status: 'inactive' }
      }
    );
    
    if (result.modifiedCount > 0) {
      console.log(`🔄 [ADS] ${result.modifiedCount} anuncios vencidos marcados como inactivos`);
    }
  } catch (error) {
    console.error('Error inactivating expired ads:', error);
  }
}

// GET /api/ads - Obtener anuncios filtrados por tipo de negocio
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    
    // Inactivar anuncios vencidos automáticamente
    await inactivateExpiredAds();
    
    const { searchParams } = new URL(request.url);
    const businessType = searchParams.get('businessType');

    logDatabaseOperation('GET', 'ads', { businessType });
    
    let ads;
    if (businessType) {
      // Filtrar anuncios que incluyan este tipo de negocio en sus targetBusinessTypes
      // Solo mostrar anuncios activos y no vencidos para las tiendas
      ads = await Ad.find({ 
        targetBusinessTypes: { $in: [businessType] },
        status: 'active'
      }).sort({ createdAt: -1 }).lean();
    } else {
      // Si no se especifica businessType, devolver todos los anuncios (para administración)
      ads = await Ad.find({}).sort({ createdAt: -1 }).lean();
    }

    return NextResponse.json(ads);
  } catch (error) {
    return handleDatabaseError(error, 'GET ads');
  }
}

// POST /api/ads - Crear un nuevo anuncio
export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    
    const body = await request.json();

    if (!body.targetBusinessTypes || body.targetBusinessTypes.length === 0) {
      return NextResponse.json({ error: 'targetBusinessTypes es requerido' }, { status: 400 });
    }

    logDatabaseOperation('POST', 'ads', body);

    const newAd = new Ad({
      ...body,
      id: IDGenerator.generate('ad'),
      views: 0,
      createdAt: new Date().toISOString(),
    });

    const savedAd = await newAd.save();
    return NextResponse.json(savedAd, { status: 201 });
  } catch (error) {
    return handleDatabaseError(error, 'POST ads');
  }
}

// PUT /api/ads - Actualizar un anuncio
export async function PUT(request: NextRequest) {
  try {
    await connectToDatabase();
    
    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json({ error: 'id es requerido' }, { status: 400 });
    }

    logDatabaseOperation('PUT', 'ads', { id, ...updateData });

    const updatedAd = await Ad.findOneAndUpdate(
      { id: id },
      updateData,
      { new: true }
    );

    if (!updatedAd) {
      return NextResponse.json({ error: 'Anuncio no encontrado' }, { status: 404 });
    }

    return NextResponse.json(updatedAd);
  } catch (error) {
    return handleDatabaseError(error, 'PUT ads');
  }
}

// DELETE /api/ads - Eliminar un anuncio
export async function DELETE(request: NextRequest) {
  try {
    await connectToDatabase();
    
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'id es requerido' }, { status: 400 });
    }

    logDatabaseOperation('DELETE', 'ads', { id });

    const deletedAd = await Ad.findOneAndDelete({ id: id });

    if (!deletedAd) {
      return NextResponse.json({ error: 'Anuncio no encontrado' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Anuncio eliminado exitosamente' });
  } catch (error) {
    return handleDatabaseError(error, 'DELETE ads');
  }
}