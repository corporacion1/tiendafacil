import { NextResponse } from 'next/server';
import { dbAdmin as db } from '@/lib/db-client';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const productId = searchParams.get('productId');
        const storeId = searchParams.get('storeId');

        if (!productId || !storeId) {
            return NextResponse.json({ error: 'productId and storeId required' }, { status: 400 });
        }

        // Obtener producto
        const { data: product, error } = await db
            .from('products')
            .select('*')
            .eq('id', productId)
            .eq('store_id', storeId)
            .single();

        if (error) {
            return NextResponse.json({
                error: 'Error fetching product',
                details: error.message,
                DBError: error
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
