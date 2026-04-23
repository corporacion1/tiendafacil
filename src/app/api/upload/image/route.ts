import { NextRequest, NextResponse } from 'next/server';
import { LocalStorageService } from '@/services/local-storage';

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
    if (file.size > 10 * 1024 * 1024) { // 10MB para local
      return NextResponse.json({ error: 'La imagen debe ser menor a 10MB' }, { status: 400 });
    }

    // Determinar carpeta según parámetro o referer
    let folder: string = 'products';
    
    if (folderParam) {
      folder = folderParam;
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

    // Preparar el archivo como buffer para el servicio local
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Generar nombre de archivo único
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}.${fileExt}`;

    console.log('[api/upload/image] Uploading to Local Storage:', { 
      filename: fileName, 
      size: file.size, 
      type: file.type,
      folder 
    });

    // Subir a disco local
    const { url, path } = await LocalStorageService.uploadFile(buffer, fileName, folder, file.type);

    console.log('[api/upload/image] Uploaded locally successfully:', { url, path, folder });

    return NextResponse.json({ 
      url, 
      path,
      folder,
      success: true 
    });

  } catch (error: any) {
    console.error('[api/upload/image] Unexpected error:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Error al subir la imagen localmente' 
    }, { status: 500 });
  }
}