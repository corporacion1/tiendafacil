import { NextRequest, NextResponse } from 'next/server';
import { uploadImage } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No se encontró archivo' },
        { status: 400 }
      );
    }

    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'El archivo debe ser una imagen' },
        { status: 400 }
      );
    }

    // Validar tamaño (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'La imagen debe ser menor a 5MB' },
        { status: 400 }
      );
    }

    // Subir a Supabase Storage
    const result = await uploadImage(file);

    return NextResponse.json({
      url: result.url,
      path: result.path,
    });

  } catch (error) {
    console.error('Error uploading to Supabase:', error);
    return NextResponse.json(
      { error: 'Error al subir la imagen' },
      { status: 500 }
    );
  }
}