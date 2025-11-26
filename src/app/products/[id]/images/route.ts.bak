import { NextResponse, NextRequest } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Product } from '@/models/Product';
import { handleDatabaseError, logDatabaseOperation } from '@/lib/db-error-handler';

// Configuración para MongoDB (base64)
const MONGODB_CONFIG = {
  MAX_FILE_SIZE: 2 * 1024 * 1024, // 2MB para base64
  ALLOWED_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  MAX_IMAGES: 4
};

/**
 * POST - Subir múltiples imágenes (versión MongoDB con base64)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log('🚀 [API] POST /api/products/[id]/images iniciado (MongoDB)');
    
    await connectToDatabase();
    
    const resolvedParams = await params;
    const productId = resolvedParams.id;
    console.log('📦 [API] ProductId:', productId);
    
    const formData = await request.formData();
    const storeId = formData.get('storeId') as string;
    
    console.log('🏪 [API] StoreId:', storeId);
    
    if (!storeId) {
      console.error('❌ [API] StoreId no proporcionado');
      return NextResponse.json({ error: 'storeId requerido' }, { status: 400 });
    }
    
    // Verificar que el producto existe
    console.log('🔍 [API] Buscando producto:', { id: productId, storeId });
    const product = await Product.findOne({ id: productId, storeId });
    if (!product) {
      console.error('❌ [API] Producto no encontrado');
      return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 });
    }
    
    console.log('✅ [API] Producto encontrado:', product.name);
    
    // Obtener imágenes actuales
    let currentImages = product.images || [];
    
    // Si no tiene array de imágenes pero sí tiene imageUrl, migrar automáticamente
    if ((!product.images || product.images.length === 0) && product.imageUrl) {
      console.log('🔄 [API] Migrando producto de imagen única a múltiples imágenes');
      
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
      console.log('✅ [API] Producto migrado exitosamente');
    }
    
    console.log('📊 [API] Imágenes actuales:', currentImages.length);
    
    // Obtener archivos del FormData
    const files = formData.getAll('images') as File[];
    console.log('📁 [API] Archivos recibidos:', files.length);
    
    if (files.length === 0) {
      console.error('❌ [API] No se enviaron archivos');
      return NextResponse.json({ error: 'No se enviaron archivos' }, { status: 400 });
    }
    
    // Procesar archivos y convertir a base64
    const processedImages = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      console.log(`📷 [API] Procesando archivo ${i + 1}: ${file.name} (${file.size} bytes)`);
      
      // Validar tamaño (máximo 2MB para base64)
      if (file.size > 2 * 1024 * 1024) {
        console.warn(`⚠️ [API] Archivo muy grande: ${file.name}`);
        return NextResponse.json({ 
          error: `Archivo ${file.name} es demasiado grande (máximo 2MB)` 
        }, { status: 400 });
      }
      
      // Validar formato
      if (!['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type)) {
        return NextResponse.json({ 
          error: `Formato ${file.type} no soportado` 
        }, { status: 400 });
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
      console.log(`✅ [API] Imagen procesada: ${file.name}`);
    }
    
    console.log('📝 [API] Imágenes procesadas:', processedImages.length);
    
    // Actualizar producto con nuevas imágenes
    const updatedImages = [...currentImages, ...processedImages];
    console.log('🔄 [API] Total de imágenes:', updatedImages.length);
    
    const updateData: any = {
      images: updatedImages
    };
    
    // Actualizar campos de compatibilidad si es la primera imagen
    if (currentImages.length === 0 && processedImages.length > 0) {
      updateData.imageUrl = processedImages[0].url;
      updateData.imageHint = processedImages[0].alt;
      updateData.primaryImageIndex = 0;
      console.log('🔄 [API] Actualizando campos de compatibilidad');
    }
    
    console.log('💾 [API] Actualizando producto en BD...');
    
    const updatedProduct = await Product.findOneAndUpdate(
      { id: productId, storeId },
      { $set: updateData },
      { new: true, runValidators: true }
    );
    
    if (!updatedProduct) {
      console.error('❌ [API] No se pudo actualizar el producto');
      return NextResponse.json({ error: 'Error al actualizar producto' }, { status: 500 });
    }
    
    console.log('✅ [API] Producto actualizado exitosamente');
    
    logDatabaseOperation('POST', 'product-images-mongodb', { 
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
    
    console.log('📤 [API] Enviando respuesta exitosa');
    
    return NextResponse.json(response);
    
  } catch (error) {
    console.error('❌ [API] Error:', error);
    return handleDatabaseError(error, 'POST product images mongodb');
  }
}

/**
 * PUT - Reordenar imágenes de un producto
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    
    const resolvedParams = await params;
    const productId = resolvedParams.id;
    const { imageIds, storeId } = await request.json();
    
    if (!storeId || !Array.isArray(imageIds)) {
      return NextResponse.json({ 
        error: 'storeId e imageIds (array) son requeridos' 
      }, { status: 400 });
    }
    
    // Verificar que el producto existe
    const product = await Product.findOne({ id: productId, storeId });
    if (!product) {
      return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 });
    }
    
    const currentImages = product.images || [];
    
    // Reordenar imágenes según el nuevo orden
    const reorderedImages = imageIds
      .map(id => currentImages.find((img: any) => img.id === id))
      .filter(img => img !== undefined)
      .map((img, index) => ({ ...img, order: index }));
    
    // Actualizar campos de compatibilidad
    const updateData: any = {
      images: reorderedImages
    };
    
    if (reorderedImages.length > 0) {
      updateData.imageUrl = reorderedImages[0].url;
      updateData.imageHint = reorderedImages[0].alt;
      updateData.primaryImageIndex = 0;
    }
    
    const updatedProduct = await Product.findOneAndUpdate(
      { id: productId, storeId },
      { $set: updateData },
      { new: true, runValidators: true }
    );
    
    logDatabaseOperation('PUT', 'product-images-reorder', { 
      productId, 
      storeId, 
      newOrder: imageIds 
    });
    
    return NextResponse.json({
      success: true,
      product: updatedProduct
    });
    
  } catch (error) {
    return handleDatabaseError(error, 'PUT product images reorder');
  }
}

/**
 * DELETE - Eliminar una imagen específica de un producto (MongoDB)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log('🗑️ [API] DELETE imagen iniciado (MongoDB)');
    
    await connectToDatabase();
    
    const resolvedParams = await params;
    const productId = resolvedParams.id;
    const { searchParams } = new URL(request.url);
    const imageId = searchParams.get('imageId');
    const storeId = searchParams.get('storeId');
    
    console.log('📋 [API] Parámetros:', { productId, imageId, storeId });
    
    if (!imageId || !storeId) {
      return NextResponse.json({ 
        error: 'imageId y storeId son requeridos' 
      }, { status: 400 });
    }
    
    // Verificar que el producto existe
    const product = await Product.findOne({ id: productId, storeId });
    if (!product) {
      return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 });
    }
    
    const currentImages = product.images || [];
    
    // Encontrar la imagen a eliminar
    const imageToDelete = currentImages.find((img: any) => img.id === imageId);
    if (!imageToDelete) {
      return NextResponse.json({ error: 'Imagen no encontrada' }, { status: 404 });
    }
    
    console.log('🖼️ [API] Imagen a eliminar:', imageToDelete.id);
    
    // Filtrar la imagen eliminada y reordenar
    const filteredImages = currentImages
      .filter((img: any) => img.id !== imageId)
      .map((img: any, index: number) => ({ ...img, order: index }));
    
    // Actualizar campos de compatibilidad
    const updateData: any = {
      images: filteredImages
    };
    
    if (filteredImages.length > 0) {
      updateData.imageUrl = filteredImages[0].url;
      updateData.imageHint = filteredImages[0].alt;
      updateData.primaryImageIndex = 0;
    } else {
      updateData.imageUrl = '';
      updateData.imageHint = '';
      updateData.primaryImageIndex = 0;
    }
    
    const updatedProduct = await Product.findOneAndUpdate(
      { id: productId, storeId },
      { $set: updateData },
      { new: true, runValidators: true }
    );
    
    console.log('✅ [API] Imagen eliminada exitosamente');
    
    logDatabaseOperation('DELETE', 'product-image-mongodb', { 
      productId, 
      storeId, 
      imageId 
    });
    
    return NextResponse.json({
      success: true,
      product: updatedProduct
    });
    
  } catch (error) {
    console.error('❌ [API] Error eliminando imagen:', error);
    return handleDatabaseError(error, 'DELETE product image mongodb');
  }
}