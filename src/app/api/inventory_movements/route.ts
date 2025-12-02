import { NextResponse } from 'next/server';
import { MovementService, MovementType, ReferenceType } from '@/services/MovementService';

export async function POST(request: Request) {
    try {
        const data = await request.json();

        // Validar datos mínimos
        if (!data.product_id || !data.quantity || !data.type || !data.store_id) {
            return NextResponse.json(
                { error: 'Faltan campos requeridos (product_id, quantity, type, store_id)' },
                { status: 400 }
            );
        }

        // Map legacy/simple payload to MovementService request
        // Note: quantity should be negative for sales if using recordMovement directly, 
        // but if we want to be explicit about the type, we can handle it.
        // However, MovementService.recordMovement expects the signed quantity.
        // For a sale, we usually pass a negative quantity if we use MovementType.SALE.

        // Let's assume the frontend sends the quantity as positive for the item count, 
        // and we negate it if it's a sale.

        let quantity = Number(data.quantity);
        let movementType = MovementType.ADJUSTMENT;
        let referenceType = ReferenceType.MANUAL_ADJUSTMENT;

        if (data.type === 'sale') {
            movementType = MovementType.SALE;
            referenceType = ReferenceType.SALE_TRANSACTION;
            // Ensure quantity is negative for sales (stock reduction)
            quantity = quantity > 0 ? -quantity : quantity;
        } else if (data.type === 'purchase') {
            movementType = MovementType.PURCHASE;
            referenceType = ReferenceType.PURCHASE_ORDER;
            quantity = Math.abs(quantity);
        }

        const result = await MovementService.recordMovement({
            productId: data.product_id,
            warehouseId: 'main', // Default to main warehouse
            movementType,
            quantity,
            referenceType,
            referenceId: data.sale_id || `mov_${Date.now()}`,
            userId: 'system', // TODO: Get from session if possible, or pass in payload
            storeId: data.store_id,
            notes: 'Movimiento registrado desde POS'
        });

        if (!result) {
            throw new Error('No se pudo registrar el movimiento');
        }

        return NextResponse.json({ success: true, movement: result }, { status: 201 });
    } catch (e: any) {
        console.error('❌ Inventory movement error:', e);
        return NextResponse.json({ error: e.message || 'Error interno del servidor' }, { status: 500 });
    }
}
