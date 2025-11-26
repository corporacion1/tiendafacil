import { NextResponse, NextRequest } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Product } from '@/models/Product';
import { handleDatabaseError, logDatabaseOperation } from '@/lib/db-error-handler';

/**
 * POST - Subir múltiples imágenes (versión simplificada sin Supabase)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log('🚀 [API-SIMPLE] POST /api/products/[id]/images-simple iniciado');
    
    await connectToDatabase();
    
    const resolvedParams = await params;
    const productId = resolvedParams.id;
    console.log('📦 [API-SIMPLE] ProductId:', productId);
    
    const formData = await request.formData();
    const storeId = formData.get('storeId') as string;
    
    console.log('🏪 [API-SIMPLE] StoreId:', storeId);
    
    if (!storeId) {
      console.error('❌ [API-SIMPLE] StoreId no proporcionado');
      return NextResponse.json({ error: 'storeId requerido' }, { status: 400 });
    }
    
    // Verificar que el producto existe
    console.log('🔍 [API-SIMPLE] Buscando producto:', { id: productId, storeId });
    const product = await Product.findOne({ id: productId, storeId });
    if (!product) {
      console.error('❌ [API-SIMPLE] Producto no encontrado');
      return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 });
    }
    
    console.log('✅ [API-SIMPLE] Producto encontrado:', product.name);
    
    // Obtener imágenes actuales
    let currentImages = product.images || [];
    
    // Si no tiene array de imágenes pero sí tiene imageUrl, migrar automáticamente
    if ((!product.images || product.images.length === 0) && product.imageUrl) {
      console.log('🔄 [API-SIMPLE] Migrando producto de imagen única a múltiples imágenes');
      
      const migratedImage = {
        id: `migrated-${Date.now()}`,
        url: product.imageUrl,
        thumbnailUrl: product.imageUrl,
        alt: product.imageHint || product.name,
        order: 0,
        uploadedAt: new Date().toISOString(),
        size: 0,
        dimensions: { width: 800, height: 600 }
      };
      
      currentImages = [migratedImage];
      console.log('✅ [API-SIMPLE] Producto migrado exitosamente');
    }
    
    console.log('📊 [API-SIMPLE] Imágenes actuales:', currentImages.length);
    
    // Obtener archivos del FormData
    const files = formData.getAll('images') as File[];
    console.log('📁 [API-SIMPLE] Archivos recibidos:', files.length);
    
    if (files.length === 0) {
      console.error('❌ [API-SIMPLE] No se enviaron archivos');
      return NextResponse.json({ error: 'No se enviaron archivos' }, { status: 400 });
    }
    
    // Procesar archivos y convertir a base64 (versión simple)
    const processedImages = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      console.log(`📷 [API-SIMPLE] Procesando archivo ${i + 1}: ${file.name} (${file.size} bytes)`);
      
      // Validar tamaño (máximo 2MB para base64)
      if (file.size > 2 * 1024 * 1024) {
        console.warn(`⚠️ [API-SIMPLE] Archivo muy grande: ${file.name}`);
        continue;
      }
      
      // Convertir a base64
      const arrayBuffer = await file.arrayBuffer();
      const base64 = Buffer.from(arrayBuffer).toString('base64');
      const dataUrl = `data:${file.type};base64,${base64}`;
      
      const imageData = {
        id: `img-${Date.now()}-${i}`,
        url: dataUrl,
        thumbnailUrl: dataUrl,
        alt: file.name.replace(/\.[^/.]+$/, ''),
        order: currentImages.length + i,
        uploadedAt: new Date().toISOString(),
        size: file.size,
        dimensions: { width: 800, height: 600 }
      };
      
      processedImages.push(imageData);
      console.log(`✅ [API-SIMPLE] Imagen procesada: ${file.name}`);
    }
    
    console.log('📝 [API-SIMPLE] Imágenes procesadas:', processedImages.length);
    
    // Actualizar producto con nuevas imágenes
    const updatedImages = [...currentImages, ...processedImages];
    console.log('🔄 [API-SIMPLE] Total de imágenes:', updatedImages.length);
    
    const updateData: any = {
      images: updatedImages
    };
    
    // Actualizar campos de compatibilidad si es la primera imagen
    if (currentImages.length === 0 && processedImages.length > 0) {
      updateData.imageUrl = processedImages[0].url;
      updateData.imageHint = processedImages[0].alt;
      updateData.primaryImageIndex = 0;
      console.log('🔄 [API-SIMPLE] Actualizando campos de compatibilidad');
    }
    
    console.log('💾 [API-SIMPLE] Actualizando producto en BD...');
    
    const updatedProduct = await Product.findOneAndUpdate(
      { id: productId, storeId },
      { $set: updateData },
      { new: true, runValidators: true }
    );
    
    if (!updatedProduct) {
      console.error('❌ [API-SIMPLE] No se pudo actualizar el producto');
      return NextResponse.json({ error: 'Error al actualizar producto' }, { status: 500 });
    }
    
    console.log('✅ [API-SIMPLE] Producto actualizado exitosamente');
    
    logDatabaseOperation('POST', 'product-images-simple', { 
      productId, 
      storeId, 
      imagesAdded: processedImages.length 
    });
    
    const response = {
      success: true,
      imagesAdded: processedImages.length,
      totalImages: updatedImages.length,
      product: updatedProduct
    };
    
    console.log('📤 [API-SIMPLE] Enviando respuesta exitosa');
    
    return NextResponse.json(response);
    
  } catch (error) {
    console.error('❌ [API-SIMPLE] Error:', error);
    return handleDatabaseError(error, 'POST product images simple');
  }
}