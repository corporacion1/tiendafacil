import { NextResponse, NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

/**
 * GET - Obtener un producto por ID
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

        if (!storeId) {
            return NextResponse.json({ error: 'storeId requerido' }, { status: 400 });
        }

        console.log('📦 [Products API] GET product:', { productId, storeId });

        const { data: product, error } = await supabaseAdmin
            .from('products')
            .select('*')
            .eq('id', productId)
            .eq('store_id', storeId)
            .single();

        if (error) {
            console.error('❌ [Products API] Error fetching product:', error);
            return NextResponse.json({ error: error.message }, { status: 404 });
        }

        if (!product) {
            return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 });
        }

        // Transformar snake_case a camelCase
        const transformedProduct = {
            id: product.id,
            storeId: product.store_id,
            sku: product.sku,
            name: product.name,
            description: product.description,
            family: product.family,
            price: parseFloat(product.price) || 0,
            wholesalePrice: parseFloat(product.wholesale_price) || 0,
            cost: parseFloat(product.cost) || 0,
            stock: product.stock || 0,
            minStock: product.min_stock || 0,
            unit: product.unit,
            type: product.type,
            status: product.status,
            imageUrl: product.image_url,
            imageHint: product.image_hint,
            images: typeof product.images === 'string' ? JSON.parse(product.images) : (product.images || []),
            primaryImageIndex: product.primary_image_index || 0,
            createdAt: product.created_at,
            updatedAt: product.updated_at
        };

        return NextResponse.json(transformedProduct);

    } catch (error) {
        console.error('❌ [Products API] Error in GET:', error);
        return NextResponse.json({
            error: 'Error interno del servidor',
            details: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
    }
}

/**
 * PUT - Actualizar un producto
 */
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const resolvedParams = await params;
        const productId = resolvedParams.id;
        const { searchParams } = new URL(request.url);
        const storeId = searchParams.get('storeId');
        const data = await request.json();

        if (!storeId) {
            return NextResponse.json({ error: 'storeId requerido' }, { status: 400 });
        }

        console.log('📝 [Products API] PUT product:', { productId, storeId });

        // Transformar camelCase a snake_case para Supabase
        const updateData: any = {
            updated_at: new Date().toISOString()
        };

        if (data.sku !== undefined) updateData.sku = data.sku;
        if (data.name !== undefined) updateData.name = data.name;
        if (data.description !== undefined) updateData.description = data.description;
        if (data.family !== undefined) updateData.family = data.family;
        if (data.price !== undefined) updateData.price = data.price;
        if (data.wholesalePrice !== undefined) updateData.wholesale_price = data.wholesalePrice;
        if (data.cost !== undefined) updateData.cost = data.cost;
        if (data.stock !== undefined) updateData.stock = data.stock;
        if (data.minStock !== undefined) updateData.min_stock = data.minStock;
        if (data.unit !== undefined) updateData.unit = data.unit;
        if (data.type !== undefined) updateData.type = data.type;
        if (data.status !== undefined) updateData.status = data.status;
        if (data.imageUrl !== undefined) updateData.image_url = data.imageUrl;
        if (data.imageHint !== undefined) updateData.image_hint = data.imageHint;
        if (data.images !== undefined) updateData.images = data.images;
        if (data.primaryImageIndex !== undefined) updateData.primary_image_index = data.primaryImageIndex;

        const { data: updatedProduct, error } = await supabaseAdmin
            .from('products')
            .update(updateData)
            .eq('id', productId)
            .eq('store_id', storeId)
            .select()
            .single();

        if (error) {
            console.error('❌ [Products API] Error updating product:', error);
            return NextResponse.json({
                error: 'Error al actualizar producto',
                details: error.message
            }, { status: 500 });
        }

        if (!updatedProduct) {
            return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 });
        }

        // Transformar respuesta
        const transformedProduct = {
            id: updatedProduct.id,
            storeId: updatedProduct.store_id,
            sku: updatedProduct.sku,
            name: updatedProduct.name,
            description: updatedProduct.description,
            family: updatedProduct.family,
            price: parseFloat(updatedProduct.price) || 0,
            wholesalePrice: parseFloat(updatedProduct.wholesale_price) || 0,
            cost: parseFloat(updatedProduct.cost) || 0,
            stock: updatedProduct.stock || 0,
            minStock: updatedProduct.min_stock || 0,
            unit: updatedProduct.unit,
            type: updatedProduct.type,
            status: updatedProduct.status,
            imageUrl: updatedProduct.image_url,
            imageHint: updatedProduct.image_hint,
            images: typeof updatedProduct.images === 'string' ? JSON.parse(updatedProduct.images) : (updatedProduct.images || []),
            primaryImageIndex: updatedProduct.primary_image_index || 0,
            createdAt: updatedProduct.created_at,
            updatedAt: updatedProduct.updated_at
        };

        return NextResponse.json(transformedProduct);

    } catch (error) {
        console.error('❌ [Products API] Error in PUT:', error);
        return NextResponse.json({
            error: 'Error interno del servidor',
            details: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
    }
}

/**
 * DELETE - Eliminar un producto
 */
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const resolvedParams = await params;
        const productId = resolvedParams.id;
        const { searchParams } = new URL(request.url);
        const storeId = searchParams.get('storeId');

        if (!storeId) {
            return NextResponse.json({ error: 'storeId requerido' }, { status: 400 });
        }

        console.log('🗑️ [Products API] DELETE product:', { productId, storeId });

        const { error } = await supabaseAdmin
            .from('products')
            .delete()
            .eq('id', productId)
            .eq('store_id', storeId);

        if (error) {
            console.error('❌ [Products API] Error deleting product:', error);
            return NextResponse.json({
                error: 'Error al eliminar producto',
                details: error.message
            }, { status: 500 });
        }

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('❌ [Products API] Error in DELETE:', error);
        return NextResponse.json({
            error: 'Error interno del servidor',
            details: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
    }
}
