import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const productId = searchParams.get('productId');
        const storeId = searchParams.get('storeId');

        if (!productId || !storeId) {
            return NextResponse.json({ error: 'productId and storeId required' }, { status: 400 });
        }

        // Obtener producto
        const { data: product, error } = await supabase
            .from('products')
            .select('*')
            .eq('id', productId)
            .eq('store_id', storeId)
            .single();

        if (error) {
            return NextResponse.json({
                error: 'Error fetching product',
                details: error.message,
                supabaseError: error
            }, { status: 500 });
        }

        if (!product) {
            return NextResponse.json({ error: 'Product not found' }, { status: 404 });
        }

        return NextResponse.json({
            product,
            images: product.images,
            imagesType: typeof product.images,
            imagesIsArray: Array.isArray(product.images),
            imagesLength: product.images?.length,
            firstImage: product.images?.[0]
        });

    } catch (error) {
        return NextResponse.json({
            error: 'Internal server error',
            details: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined
        }, { status: 500 });
    }
}
