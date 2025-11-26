import { NextResponse, NextRequest } from 'next/server';
import { supabaseAdmin, uploadImage, deleteImage } from '@/lib/supabase';

/**
 * POST - Subir múltiples imágenes a Supabase Storage
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log('🚀 [API] POST /api/products/[id]/images iniciado (Supabase)');

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

    // Verificar que el producto existe en Supabase
    console.log('🔍 [API] Buscando producto:', { id: productId, storeId });
    const { data: product, error: productError } = await supabaseAdmin
      .from('products')
      .select('*')
      .eq('id', productId)
      .eq('store_id', storeId)
      .single();

    if (productError || !product) {
      console.error('❌ [API] Producto no encontrado:', productError);
      return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 });
    }

    console.log('✅ [API] Producto encontrado:', product.name);

    // Obtener imágenes actuales
    let currentImages = typeof product.images === 'string'
      ? JSON.parse(product.images)
      : (product.images || []);

    console.log('📊 [API] Imágenes actuales:', currentImages.length);

    // Obtener archivos del FormData
    const files = formData.getAll('images') as File[];
    console.log('📁 [API] Archivos recibidos:', files.length);

    if (files.length === 0) {
      console.error('❌ [API] No se enviaron archivos');
      return NextResponse.json({ error: 'No se enviaron archivos' }, { status: 400 });
    }

    // Subir archivos a Supabase Storage (carpeta 'products')
    const uploadedImages = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      console.log(`📷 [API] Procesando archivo ${i + 1}: ${file.name} (${file.size} bytes)`);

      // Validar tamaño (máximo 5MB para Supabase Storage)
      if (file.size > 5 * 1024 * 1024) {
        console.warn(`⚠️ [API] Archivo muy grande: ${file.name}`);
        return NextResponse.json({
          error: `Archivo ${file.name} es demasiado grande (máximo 5MB)`
        }, { status: 400 });
      }

      // Validar formato
      if (!['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type)) {
        return NextResponse.json({
          error: `Formato ${file.type} no soportado`
        }, { status: 400 });
      }

      try {
        // Subir a Supabase Storage en carpeta 'products'
        const { url, path } = await uploadImage(file, 'products');

        const newImage = {
          id: `img-${Date.now()}-${i}`,
          url: url,
          thumbnailUrl: url, // En futuro podemos generar thumbnail
          alt: file.name.replace(/\.[^/.]+$/, ''),
          order: currentImages.length + i,
          uploadedAt: new Date().toISOString(),
          size: file.size,
          storagePath: path // Guardar path para poder eliminar después
        };

        uploadedImages.push(newImage);
        console.log(`✅ [API] Imagen ${i + 1} subida:`, url);
      } catch (uploadError) {
        console.error(`❌ [API] Error subiendo imagen ${file.name}:`, uploadError);
        return NextResponse.json({
          error: `Error al subir ${file.name}`
        }, { status: 500 });
      }
    }

    // Actualizar producto con nuevas imágenes
    const updatedImages = [...currentImages, ...uploadedImages];

    const { data: updatedProduct, error: updateError } = await supabaseAdmin
      .from('products')
      .update({
        images: JSON.stringify(updatedImages),
        updated_at: new Date().toISOString()
      })
      .eq('id', productId)
      .eq('store_id', storeId)
      .select()
      .single();

    if (updateError) {
      console.error('❌ [API] Error actualizando producto:', updateError);
      return NextResponse.json({
        error: 'Error al actualizar producto con nuevas imágenes'
      }, { status: 500 });
    }

    console.log('✅ [API] Producto actualizado con', uploadedImages.length, 'nuevas imágenes');

    // Transformar respuesta a camelCase
    const response = {
      id: updatedProduct.id,
      storeId: updatedProduct.store_id,
      images: typeof updatedProduct.images === 'string'
        ? JSON.parse(updatedProduct.images)
        : updatedProduct.images,
      name: updatedProduct.name
    };

    return NextResponse.json({
      success: true,
      product: response,
      uploadedCount: uploadedImages.length
    });

  } catch (error: any) {
    console.error('❌ [API] Error inesperado:', error);
    return NextResponse.json({
      error: 'Error interno del servidor'
    }, { status: 500 });
  }
}

/**
 * DELETE - Eliminar una imagen de Supabase Storage
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const productId = resolvedParams.id;

    const { searchParams } = new URL(request.url);
    const imageId = searchParams.get('imageId');
    const storeId = searchParams.get('storeId');

    console.log('🗑️ [API] DELETE image:', { productId, imageId, storeId });

    if (!imageId || !storeId) {
      return NextResponse.json({
        error: 'imageId y storeId son requeridos'
      }, { status: 400 });
    }

    // Obtener producto
    const { data: product, error: productError } = await supabaseAdmin
      .from('products')
      .select('*')
      .eq('id', productId)
      .eq('store_id', storeId)
      .single();

    if (productError || !product) {
      console.error('❌ [API] Producto no encontrado');
      return NextResponse.json({
        error: 'Producto no encontrado'
      }, { status: 404 });
    }

    // Obtener imágenes actuales
    let currentImages = typeof product.images === 'string'
      ? JSON.parse(product.images)
      : (product.images || []);

    // Encontrar la imagen a eliminar
    const imageToDelete = currentImages.find((img: any) =>
      img.id === imageId || img._id === imageId
    );

    if (!imageToDelete) {
      return NextResponse.json({
        error: 'Imagen no encontrada'
      }, { status: 404 });
    }

    // Eliminar de Supabase Storage si tiene storagePath
    if (imageToDelete.storagePath) {
      try {
        await deleteImage(imageToDelete.storagePath);
        console.log('✅ [API] Imagen eliminada de Storage:', imageToDelete.storagePath);
      } catch (storageError) {
        console.warn('⚠️ [API] Error eliminando de Storage (continuando):', storageError);
      }
    }

    // Actualizar array de imágenes
    const updatedImages = currentImages.filter((img: any) =>
      img.id !== imageId && img._id !== imageId
    );

    const { data: updatedProduct, error: updateError } = await supabaseAdmin
      .from('products')
      .update({
        images: JSON.stringify(updatedImages),
        updated_at: new Date().toISOString()
      })
      .eq('id', productId)
      .eq('store_id', storeId)
      .select()
      .single();

    if (updateError) {
      console.error('❌ [API] Error actualizando producto:', updateError);
      return NextResponse.json({
        error: 'Error al actualizar producto'
      }, { status: 500 });
    }

    console.log('✅ [API] Imagen eliminada exitosamente');

    const response = {
      id: updatedProduct.id,
      images: typeof updatedProduct.images === 'string'
        ? JSON.parse(updatedProduct.images)
        : updatedProduct.images
    };

    return NextResponse.json({
      success: true,
      product: response
    });

  } catch (error: any) {
    console.error('❌ [API] Error inesperado:', error);
    return NextResponse.json({
      error: 'Error interno del servidor'
    }, { status: 500 });
  }
}

/**
 * PUT - Reordenar imágenes
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const productId = resolvedParams.id;

    const body = await request.json();
    const { imageIds, storeId } = body;

    console.log('🔄 [API] PUT reorder images:', { productId, imageIds, storeId });

    if (!imageIds || !Array.isArray(imageIds) || !storeId) {
      return NextResponse.json({
        error: 'imageIds (array) y storeId son requeridos'
      }, { status: 400 });
    }

    // Obtener producto
    const { data: product, error: productError } = await supabaseAdmin
      .from('products')
      .select('*')
      .eq('id', productId)
      .eq('store_id', storeId)
      .single();

    if (productError || !product) {
      return NextResponse.json({
        error: 'Producto no encontrado'
      }, { status: 404 });
    }

    // Obtener imágenes actuales
    let currentImages = typeof product.images === 'string'
      ? JSON.parse(product.images)
      : (product.images || []);

    // Reordenar según el array de IDs
    const reorderedImages = imageIds.map((imgId: string, index: number) => {
      const img = currentImages.find((i: any) =>
        (i.id === imgId || i._id === imgId)
      );
      if (img) {
        return { ...img, order: index };
      }
      return null;
    }).filter((img: any) => img !== null);

    const { data: updatedProduct, error: updateError } = await supabaseAdmin
      .from('products')
      .update({
        images: JSON.stringify(reorderedImages),
        updated_at: new Date().toISOString()
      })
      .eq('id', productId)
      .eq('store_id', storeId)
      .select()
      .single();

    if (updateError) {
      console.error('❌ [API] Error actualizando orden:', updateError);
      return NextResponse.json({
        error: 'Error al actualizar orden de imágenes'
      }, { status: 500 });
    }

    console.log('✅ [API] Imágenes reordenadas exitosamente');

    const response = {
      id: updatedProduct.id,
      images: typeof updatedProduct.images === 'string'
        ? JSON.parse(updatedProduct.images)
        : updatedProduct.images
    };

    return NextResponse.json({
      success: true,
      product: response
    });

  } catch (error: any) {
    console.error('❌ [API] Error inesperado:', error);
    return NextResponse.json({
      error: 'Error interno del servidor'
    }, { status: 500 });
  }
}