import { NextRequest, NextResponse } from 'next/server';

// Importación dinámica para evitar errores durante el build
async function getUploadImage() {
  try {
    const { uploadImage } = await import('@/lib/supabase');
    return uploadImage;
  } catch (error) {
    console.error('Error importing Supabase:', error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verificar si Supabase está disponible
    const uploadImage = await getUploadImage();
    if (!uploadImage) {
      return NextResponse.json(
        { error: 'Servicio de subida de imágenes no disponible' },
        { status: 503 }
      );
    }

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