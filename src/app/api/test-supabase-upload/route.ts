import { NextResponse, NextRequest } from 'next/server';
import { uploadMultipleImages } from '@/lib/supabase';

/**
 * Endpoint de prueba para verificar la subida a Supabase
 */
export async function POST(request: NextRequest) {
  try {
    console.log('🧪 [Test Supabase] Iniciando test de subida');
    
    const formData = await request.formData();
    const storeId = formData.get('storeId') as string;
    const productId = formData.get('productId') as string;
    const files = formData.getAll('images') as File[];
    
    console.log('📋 [Test Supabase] Parámetros:', {
      storeId,
      productId,
      filesCount: files.length,
      fileNames: files.map(f => f.name)
    });
    
    if (!storeId || !productId) {
      return NextResponse.json({ 
        error: 'storeId y productId son requeridos' 
      }, { status: 400 });
    }
    
    if (files.length === 0) {
      return NextResponse.json({ 
        error: 'No se enviaron archivos' 
      }, { status: 400 });
    }
    
    // Validar archivos
    for (const file of files) {
      if (!file.type.startsWith('image/')) {
        return NextResponse.json({ 
          error: `Archivo ${file.name} no es una imagen` 
        }, { status: 400 });
      }
      
      if (file.size > 5 * 1024 * 1024) {
        return NextResponse.json({ 
          error: `Archivo ${file.name} es demasiado grande (máximo 5MB)` 
        }, { status: 400 });
      }
    }
    
    console.log('✅ [Test Supabase] Archivos validados, subiendo a Supabase...');
    
    // Subir a Supabase
    const uploadedImages = await uploadMultipleImages(files, productId, storeId);
    
    console.log('✅ [Test Supabase] Subida exitosa:', uploadedImages);
    
    return NextResponse.json({
      success: true,
      message: 'Imágenes subidas exitosamente a Supabase',
      uploadedImages,
      totalUploaded: uploadedImages.length
    });
    
  } catch (error) {
    console.error('❌ [Test Supabase] Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
      details: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}