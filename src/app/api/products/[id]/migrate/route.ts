import { NextResponse, NextRequest } from 'next/server';
import { supabaseAdmin as supabase } from '@/lib/supabase';
import { v4 as uuidv4 } from 'uuid';

/**
 * POST - Migrar un producto específico de imagen única a múltiples imágenes
 */
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const resolvedParams = await params;
        const productId = resolvedParams.id;
        const { storeId } = await request.json();

        console.log('🔄 [Migrate] Iniciando migración del producto (Supabase):', { productId, storeId });

        if (!storeId) {
            return NextResponse.json({ error: 'storeId requerido' }, { status: 400 });
        }

        // Buscar el producto
        const { data: product, error: fetchError } = await supabase
            .from('products')
            .select('*')
            .eq('id', productId)
            .eq('store_id', storeId)
            .single();

        if (fetchError || !product) {
            return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 });
        }

        console.log('📦 [Migrate] Producto encontrado:', product.name);

        // Verificar si ya está migrado
        if (product.images && product.images.length > 0) {
            console.log('✅ [Migrate] Producto ya está migrado');
            return NextResponse.json({
                success: true,
                message: 'Producto ya está migrado',
                alreadyMigrated: true,
                imagesCount: product.images.length,
                product: product
            });
        }

        // Verificar si tiene imageUrl para migrar
        if (!product.image_url) {
            console.log('⚠️ [Migrate] Producto no tiene imageUrl para migrar');
            return NextResponse.json({
                success: true,
                message: 'Producto no tiene imagen para migrar',
                noImageToMigrate: true,
                product: product
            });
        }

        // Crear imagen migrada
        const migratedImage = {
            id: `migrated-${Date.now()}`,
            url: product.image_url,
            thumbnailUrl: product.image_url,
            alt: product.image_hint || product.name,
            order: 0,
            uploadedAt: new Date().toISOString(),
            size: 0, // Tamaño desconocido para imágenes migradas
            dimensions: {
                width: 800,
                height: 600
            }
            // No tiene supabasePath porque es una imagen legacy
        };

        console.log('🖼️ [Migrate] Imagen migrada creada:', migratedImage);

        // Actualizar producto
        const { data: updatedProduct, error: updateError } = await supabase
            .from('products')
            .update({
                images: [migratedImage],
                primary_image_index: 0
            })
            .eq('id', productId)
            .eq('store_id', storeId)
            .select()
            .single();

        if (updateError) {
            console.error('❌ [Migrate] Error actualizando producto:', updateError);
            return NextResponse.json({ error: 'Error al actualizar producto' }, { status: 500 });
        }

        console.log('✅ [Migrate] Migración completada exitosamente');

        return NextResponse.json({
            success: true,
            message: 'Producto migrado exitosamente',
            migrated: true,
            imagesCount: updatedProduct.images?.length || 0,
            product: updatedProduct
        });

    } catch (error) {
        console.error('❌ [Migrate] Error en migración:', error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Error desconocido'
        }, { status: 500 });
    }
}
