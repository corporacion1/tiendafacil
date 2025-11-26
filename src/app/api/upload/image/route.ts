import { NextRequest, NextResponse } from 'next/server';
import { uploadImage } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const folderParam = formData.get('folder') as string;

    if (!file) {
      console.warn('[api/upload/image] No file found in formData');
      return NextResponse.json({ error: 'No se encontró archivo' }, { status: 400 });
    }

    // Basic validation
    if (!file.type || !file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'El archivo debe ser una imagen' }, { status: 400 });
    }
    if (file.size > 5 * 1024 * 1024) { // 5MB for Supabase Storage
      return NextResponse.json({ error: 'La imagen debe ser menor a 5MB' }, { status: 400 });
    }

    // Determinar carpeta según parámetro o referer
    let folder: 'products' | 'ads' | 'stores' | 'users' = 'products';
    
    if (folderParam && ['products', 'ads', 'stores', 'users'].includes(folderParam)) {
      folder = folderParam as any;
    } else {
      // Intentar detectar por referer
      const referer = request.headers.get('referer') || '';
      if (referer.includes('/ads')) {
        folder = 'ads';
      } else if (referer.includes('/settings') || referer.includes('/store')) {
        folder = 'stores';
      } else if (referer.includes('/profile') || referer.includes('/user')) {
        folder = 'users';
      }
    }

    console.log('[api/upload/image] Uploading to Supabase Storage:', { 
      filename: file.name, 
      size: file.size, 
      type: file.type,
      folder 
    });

    // Subir a Supabase Storage
    const { url, path } = await uploadImage(file, folder);

    console.log('[api/upload/image] Uploaded successfully:', { url, path, folder });

    return NextResponse.json({ 
      url, 
      path,
      folder,
      success: true 
    });

  } catch (error: any) {
    console.error('[api/upload/image] Unexpected error:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Error al subir la imagen' 
    }, { status: 500 });
  }
}