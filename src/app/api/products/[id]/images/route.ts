import { NextResponse, NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

// Configuración de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const BUCKET_NAME = 'product-images';

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

        const formData = await request.formData();
        const storeId = formData.get('storeId') as string;
        const files = formData.getAll('images') as File[];

        console.log('📦 [API] Upload request:', { productId, storeId, filesCount: files.length });

        if (!storeId) {
            return NextResponse.json({ error: 'storeId requerido' }, { status: 400 });
        }

        if (!files || files.length === 0) {
            return NextResponse.json({ error: 'No se proporcionaron imágenes' }, { status: 400 });
        }

        // 1. Obtener producto actual para ver imágenes existentes
        const { data: product, error: fetchError } = await supabase
            .from('products')
            .select('images, primary_image_index')
            .eq('id', productId)
            .eq('store_id', storeId)
            .single();

        if (fetchError || !product) {
            console.error('❌ [API] Error al buscar producto:', fetchError);
            return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 });
        }

        let currentImages = product.images || [];
        if (typeof currentImages === 'string') {
            try {
                currentImages = JSON.parse(currentImages);
            } catch (e) {
                console.error('❌ [API] Error parsing images JSON:', e);
                currentImages = [];
            }
        }
        if (!Array.isArray(currentImages)) {
            currentImages = [];
        }

        // 2. Subir imágenes a Storage
        const newImages = [];

        for (const file of files) {
            const fileExt = file.name.split('.').pop();
            const fileName = `${uuidv4()}.${fileExt}`;
            const filePath = `${storeId}/${productId}/${fileName}`;

            console.log('📤 [API] Subiendo archivo:', filePath);

            const { data: uploadData, error: uploadError } = await supabase
                .storage
                .from(BUCKET_NAME)
                .upload(filePath, file, {
                    contentType: file.type,
                    upsert: false
                });

            if (uploadError) {
                console.error('❌ [API] Error subiendo archivo:', uploadError);
                continue; // Intentar con la siguiente
            }

            // Obtener URL pública
            const { data: { publicUrl } } = supabase
                .storage
                .from(BUCKET_NAME)
                .getPublicUrl(filePath);

            newImages.push({
                id: uuidv4(),
                url: publicUrl,
                supabasePath: filePath,
                alt: file.name,
                order: currentImages.length + newImages.length,
                uploadedAt: new Date().toISOString()
            });
        }

        if (newImages.length === 0) {
            return NextResponse.json({ error: 'No se pudo subir ninguna imagen' }, { status: 500 });
        }

        // 3. Actualizar array de imágenes en base de datos
        const updatedImages = [...currentImages, ...newImages];

        // Si es la primera imagen, establecer como primaria
        let primaryIndex = product.primary_image_index;
        if (primaryIndex === undefined || primaryIndex === null || primaryIndex === -1) {
            if (updatedImages.length > 0) {
                primaryIndex = 0;
            }
        }

        const { data: updatedProduct, error: updateError } = await supabase
            .from('products')
            .update({
                images: updatedImages,
                primary_image_index: primaryIndex,
                // Actualizar también campos legacy para compatibilidad
                image_url: updatedImages[primaryIndex]?.url,
                updated_at: new Date().toISOString()
            })
            .eq('id', productId)
            .eq('store_id', storeId)
            .select()
            .single();

        if (updateError) {
            console.error('❌ [API] Error actualizando producto:', updateError);
            return NextResponse.json({ error: 'Error al actualizar base de datos' }, { status: 500 });
        }

        console.log('✅ [API] Imágenes subidas exitosamente');

        // Transformar respuesta para que coincida con lo que espera el frontend
        return NextResponse.json({
            success: true,
            product: {
                images: updatedProduct.images,
                primaryImageIndex: updatedProduct.primary_image_index
            }
        });

    } catch (error) {
        console.error('❌ [API] Error en POST images:', error);
        return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
    }
}

/**
 * DELETE - Eliminar una imagen
 */
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const resolvedParams = await params;
        const productId = resolvedParams.id;

        // Leer parámetros de la URL (query params)
        const { searchParams } = new URL(request.url);
        const imageId = searchParams.get('imageId');
        const storeId = searchParams.get('storeId');
        const supabasePath = searchParams.get('supabasePath');

        console.log('🗑️ [API] DELETE image:', { productId, imageId, supabasePath });

        if (!storeId || !imageId) {
            return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 });
        }

        // 1. Obtener producto
        const { data: product, error: fetchError } = await supabase
            .from('products')
            .select('images, primary_image_index')
            .eq('id', productId)
            .eq('store_id', storeId)
            .single();

        if (fetchError || !product) {
            console.error('❌ [API] Error al buscar producto:', fetchError);
            return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 });
        }

        // 2. Encontrar la imagen y obtener su supabasePath
        // IMPORTANTE: images puede venir como string JSON de Supabase
        let currentImages = product.images || [];
        if (typeof currentImages === 'string') {
            try {
                currentImages = JSON.parse(currentImages);
            } catch (e) {
                console.error('❌ [API] Error parsing images JSON:', e);
                currentImages = [];
            }
        }
        if (!Array.isArray(currentImages)) {
            currentImages = [];
        }

        const imageToDelete = currentImages.find((img: any) => img.id === imageId);

        if (!imageToDelete) {
            console.error('❌ [API] Imagen no encontrada en el producto');
            return NextResponse.json({ error: 'Imagen no encontrada' }, { status: 404 });
        }

        // 3. Eliminar de Storage (si tiene path)
        const pathToDelete = imageToDelete.supabasePath || supabasePath;
        if (pathToDelete) {
            console.log('🗑️ [API] Eliminando de Storage:', pathToDelete);
            const { error: storageError } = await supabase
                .storage
                .from(BUCKET_NAME)
                .remove([pathToDelete]);

            if (storageError) {
                console.error('⚠️ [API] Error eliminando archivo de Storage:', storageError);
                // Continuamos para eliminar la referencia en BD
            }
        } else {
            console.log('⚠️ [API] No se encontró supabasePath, solo eliminando referencia en BD');
        }

        // 4. Actualizar array en BD
        const updatedImages = currentImages.filter((img: any) => img.id !== imageId);

        // Reajustar índice primario
        let newPrimaryIndex = product.primary_image_index;
        if (newPrimaryIndex >= updatedImages.length) {
            newPrimaryIndex = updatedImages.length > 0 ? 0 : -1;
        }

        // Reordenar índices
        updatedImages.forEach((img: any, index: number) => {
            img.order = index;
        });

        const { data: updatedProduct, error: updateError } = await supabase
            .from('products')
            .update({
                images: updatedImages,
                primary_image_index: newPrimaryIndex,
                image_url: updatedImages.length > 0 ? updatedImages[newPrimaryIndex]?.url : null,
                updated_at: new Date().toISOString()
            })
            .eq('id', productId)
            .eq('store_id', storeId)
            .select()
            .single();

        if (updateError) {
            console.error('❌ [API] Error actualizando producto:', updateError);
            return NextResponse.json({
                error: 'Error al actualizar producto',
                details: updateError.message
            }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            product: {
                images: updatedProduct.images
            }
        });

    } catch (error) {
        console.error('❌ [API] Error en DELETE image:', error);
        console.error('❌ [API] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
        console.error('❌ [API] Error details:', JSON.stringify(error, null, 2));
        return NextResponse.json({
            error: 'Error interno del servidor',
            details: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
    }
}

/**
 * PUT - Reordenar o establecer imagen principal
 */
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const resolvedParams = await params;
        const productId = resolvedParams.id;
        const { storeId, images, primaryImageIndex } = await request.json();

        if (!storeId || !images) {
            return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 });
        }

        console.log('🔄 [API] PUT images (reorder/primary):', { productId, primaryImageIndex });

        // Actualizar imágenes y primary index
        const { data: updatedProduct, error: updateError } = await supabase
            .from('products')
            .update({
                images: images,
                primary_image_index: primaryImageIndex,
                image_url: images[primaryImageIndex]?.url,
                updated_at: new Date().toISOString()
            })
            .eq('id', productId)
            .eq('store_id', storeId)
            .select()
            .single();

        if (updateError) {
            console.error('❌ [API] Error actualizando orden:', updateError);
            return NextResponse.json({ error: 'Error al actualizar producto' }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            product: {
                images: updatedProduct.images,
                primaryImageIndex: updatedProduct.primary_image_index
            }
        });

    } catch (error) {
        console.error('❌ [API] Error en PUT images:', error);
        return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
    }
}
