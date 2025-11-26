import { NextResponse, NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Configuración de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * GET - Debug: Ver estado actual de un producto
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const resolvedParams = await params;
        const productId = resolvedParams.id;
        const { searchParams } = new URL(request.url);
        const storeId = searchParams.get('storeId');

        console.log('🔍 [Debug] Consultando producto (Supabase):', { productId, storeId });

        if (!storeId) {
            return NextResponse.json({ error: 'storeId requerido' }, { status: 400 });
        }

        // Consultar producto en Supabase
        const { data: product, error } = await supabase
            .from('products')
            .select('*')
            .eq('id', productId)
            .eq('store_id', storeId)
            .single();

        if (error) {
            console.error('❌ [Debug] Error Supabase:', error);
            return NextResponse.json({ error: 'Error al buscar producto' }, { status: 500 });
        }

        if (!product) {
            return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 });
        }

        const debugInfo = {
            productId: product.id,
            productName: product.name,
            storeId: product.store_id,

            // Información de imágenes
            hasImageUrl: !!product.image_url,
            imageUrl: product.image_url,
            imageHint: product.image_hint,

            // Información de múltiples imágenes
            hasImagesArray: !!product.images,
            imagesCount: product.images?.length || 0,
            primaryImageIndex: product.primary_image_index,

            // Detalles de cada imagen
            images: product.images?.map((img: any, index: number) => ({
                index,
                id: img.id,
                url: img.url,
                alt: img.alt,
                order: img.order,
                supabasePath: img.supabasePath,
                isPrimary: index === (product.primary_image_index || 0)
            })) || [],

            // Documento completo (para debug)
            fullDocument: product
        };

        console.log('📊 [Debug] Info del producto:', debugInfo);

        return NextResponse.json(debugInfo);

    } catch (error) {
        console.error('❌ [Debug] Error:', error);
        return NextResponse.json({
            error: error instanceof Error ? error.message : 'Error desconocido'
        }, { status: 500 });
    }
}
