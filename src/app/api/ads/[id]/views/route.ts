import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Ad } from '@/models/Ad';
import { handleDatabaseError, logDatabaseOperation } from '@/lib/db-error-handler';

// POST /api/ads/[id]/views - Incrementar vistas de un anuncio
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: 'ID es requerido' }, { status: 400 });
    }

    logDatabaseOperation('POST', 'ads/views', { id });

    const updatedAd = await Ad.findOneAndUpdate(
      { id: id },
      { $inc: { views: 1 } },
      { new: true }
    );

    if (!updatedAd) {
      return NextResponse.json({ error: 'Anuncio no encontrado' }, { status: 404 });
    }

    return NextResponse.json({ views: updatedAd.views });
  } catch (error) {
    return handleDatabaseError(error, 'POST ads/views');
  }
}