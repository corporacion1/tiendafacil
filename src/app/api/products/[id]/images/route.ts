import { NextResponse, NextRequest } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Product } from '@/models/Product';
import { handleDatabaseError, validateRequiredFields, logDatabaseOperation } from '@/lib/db-error-handler';
import { uploadMultipleImages, deleteImage } from '@/lib/supabase';

// Configuración para subida de archivos
const UPLOAD_CONFIG = {
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  THUMBNAIL_SIZE: 150,
  COMPRESSED_MAX_WIDTH: 1200,
  COMPRESSED_MAX_HEIGHT: 1200,
  QUALITY: 85
};

// Ya no necesitamos esta función, usaremos Supabase directamente

/**
 * POST - Subir múltiples imágenes a un producto
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('🚀 [API] POST /api/products/[id]/images iniciado');
    
    await connectToDatabase();
    
    const productId = params.id;
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
    
    // MIGRACIÓN AUTOMÁTICA: Convertir producto de imagen única a múltiples imágenes
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
        size: 0, // Tamaño desconocido para imágenes migradas
        dimensions: {
          width: 800,
          height: 600
        }
        // No tiene supabasePath porque es una imagen legacy
      };
      
      currentImages = [migratedImage];
      
      // Actualizar el producto con la migración
      await Product.findOneAndUpdate(
        { id: productId, storeId },
        { 
          $set: { 
            images: currentImages,
            primaryImageIndex: 0
          }
        }
      );
      
      console.log('✅ [API] Producto migrado exitosamente');
    }
    
    console.log('📊 [API] Imágenes actuales después de migración:', {
      count: currentImages.length,
      images: currentImages.map(img => ({ id: img.id, url: img.url }))
    });
    
    // Obtener archivos del FormData
    const files = formData.getAll('images') as File[];
    
    console.log('📁 [API] Archivos recibidos:', {
      count: files.length,
      names: files.map(f => f.name),
      sizes: files.map(f => f.size)
    });
    
    if (files.length === 0) {
      console.error('❌ [API] No se enviaron archivos');
      return NextResponse.json({ error: 'No se enviaron archivos' }, { status: 400 });
    }
    
    // Validar archivos
    for (const file of files) {
      if (file.size > UPLOAD_CONFIG.MAX_FILE_SIZE) {
        return NextResponse.json({ 
          error: `Archivo ${file.name} es demasiado grande (máximo 5MB)` 
        }, { status: 400 });
      }
      
      if (!UPLOAD_CONFIG.ALLOWED_TYPES.includes(file.type)) {
        return NextResponse.json({ 
          error: `Formato ${file.type} no soportado` 
        }, { status: 400 });
      }
    }
    
    // Subir archivos a Supabase
    console.log('🔄 [API] Subiendo archivos a Supabase Storage');
    
    console.log('📊 [API] Estado actual:', {
      currentImagesCount: currentImages.length,
      newFilesCount: files.length
    });
    
    let uploadedImages;
    try {
      uploadedImages = await uploadMultipleImages(files, productId, storeId);
      console.log('✅ [API] Imágenes subidas a Supabase:', uploadedImages);
    } catch (error) {
      console.error('❌ [API] Error subiendo a Supabase:', error);
      return NextResponse.json({ 
        error: `Error subiendo imágenes: ${error instanceof Error ? error.message : 'Error desconocido'}` 
      }, { status: 500 });
    }
    
    // Crear objetos de imagen para la base de datos
    const processedImages = uploadedImages.map((uploaded, index) => ({
      id: `img-${Date.now()}-${index}`,
      url: uploaded.url,
      thumbnailUrl: uploaded.url, // Usar la misma URL por ahora
      alt: uploaded.originalName.replace(/\.[^/.]+$/, ''), // Nombre sin extensión
      order: currentImages.length + index,
      uploadedAt: new Date().toISOString(),
      size: files[index].size,
      dimensions: {
        width: 800, // Valores por defecto
        height: 600
      },
      supabasePath: uploaded.path // Guardar el path para poder eliminar después
    }));
    
    console.log('📝 [API] Datos de imágenes creados:', processedImages);
    
    // Actualizar producto con nuevas imágenes
    const updatedImages = [...currentImages, ...processedImages];
    console.log('🔄 [API] Imágenes combinadas:', {
      previousCount: currentImages.length,
      newCount: processedImages.length,
      totalCount: updatedImages.length,
      currentImages: currentImages.map(img => ({ id: img.id, url: img.url })),
      processedImages: processedImages.map(img => ({ id: img.id, url: img.url })),
      updatedImages: updatedImages.map(img => ({ id: img.id, url: img.url }))
    });
    
    // Actualizar campos de compatibilidad si es la primera imagen
    const updateData: any = {
      images: updatedImages
    };
    
    if (currentImages.length === 0 && processedImages.length > 0) {
      updateData.imageUrl = processedImages[0].url;
      updateData.imageHint = processedImages[0].alt;
      updateData.primaryImageIndex = 0;
      console.log('🔄 [API] Actualizando campos de compatibilidad');
    }
    
    console.log('💾 [API] Actualizando producto en BD:', updateData);
    
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
    
    logDatabaseOperation('POST', 'product-images', { 
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
    
    console.log('📤 [API] Enviando respuesta:', {
      success: response.success,
      imagesAdded: response.imagesAdded,
      totalImages: response.totalImages,
      productImages: updatedProduct?.images?.map(img => ({ id: img.id, url: img.url })) || []
    });
    
    return NextResponse.json(response);
    
  } catch (error) {
    console.error('Error en POST /api/products/[id]/images:', error);
    return handleDatabaseError(error, 'POST product images');
  }
}

/**
 * PUT - Reordenar imágenes de un producto
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectToDatabase();
    
    const productId = params.id;
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
      .map(id => currentImages.find(img => img.id === id))
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
 * DELETE - Eliminar una imagen específica de un producto
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('🗑️ [API] DELETE imagen iniciado');
    
    await connectToDatabase();
    
    const productId = params.id;
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
    const imageToDelete = currentImages.find(img => img.id === imageId);
    if (!imageToDelete) {
      return NextResponse.json({ error: 'Imagen no encontrada' }, { status: 404 });
    }
    
    console.log('🖼️ [API] Imagen a eliminar:', imageToDelete);
    
    // Eliminar de Supabase si tiene supabasePath
    if (imageToDelete.supabasePath) {
      try {
        console.log('🗑️ [API] Eliminando de Supabase:', imageToDelete.supabasePath);
        await deleteImage(imageToDelete.supabasePath);
        console.log('✅ [API] Imagen eliminada de Supabase');
      } catch (supabaseError) {
        console.error('❌ [API] Error eliminando de Supabase:', supabaseError);
        // Continuar con la eliminación de la BD aunque falle Supabase
      }
    }
    
    const filteredImages = currentImages
      .filter(img => img.id !== imageId)
      .map((img, index) => ({ ...img, order: index }));
    
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
    
    logDatabaseOperation('DELETE', 'product-image', { 
      productId, 
      storeId, 
      imageId 
    });
    
    return NextResponse.json({
      success: true,
      product: updatedProduct
    });
    
  } catch (error) {
    return handleDatabaseError(error, 'DELETE product image');
  }
}