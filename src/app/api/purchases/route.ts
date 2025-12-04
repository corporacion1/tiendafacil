import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { IDGenerator } from '@/lib/id-generator';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('storeId');

    if (!storeId) {
      return NextResponse.json({ error: 'storeId requerido' }, { status: 400 });
    }

    console.log('📦 [Purchases API] GET purchases for store:', storeId);

    const { data: purchases, error } = await supabaseAdmin
      .from('purchases')
      .select('*')
      .eq('store_id', storeId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('⚠️ [Purchases API] Error fetching purchases:', error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Transform to camelCase
    const formattedPurchases = purchases?.map(purchase => ({
      id: purchase.id,
      supplierId: purchase.supplier_id,
      supplierName: purchase.supplier_name,
      items: purchase.items,
      total: purchase.total,
      date: purchase.created_at,
      documentNumber: purchase.document_number,
      responsible: purchase.responsible,
      storeId: purchase.store_id,
      createdAt: purchase.created_at,
      updatedAt: purchase.updated_at
    })) || [];

    console.log(`✅ [Purchases API] Returned ${formattedPurchases.length} purchases`);
    return NextResponse.json(formattedPurchases);
  } catch (error: any) {
    console.error('❌ [Purchases API] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    console.log('📥 [Purchases API] Creating purchase:', {
      supplierId: data.supplierId,
      storeId: data.storeId,
      itemsCount: data.items?.length
    });

    if (!data.storeId || !data.supplierId || !data.items) {
      return NextResponse.json({
        error: 'storeId, supplierId, and items are required'
      }, { status: 400 });
    }

    const purchaseId = data.id || IDGenerator.generate('purchase');

    // Prepare purchase data
    const purchaseData = {
      id: purchaseId,
      supplier_id: data.supplierId,
      supplier_name: data.supplierName || 'Unknown Supplier',
      items: data.items,
      total: data.total || 0,
      document_number: data.documentNumber || null,
      responsible: data.responsible || 'system',
      store_id: data.storeId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    console.log('📦 [Purchases API] Inserting purchase:', purchaseId);

    // Insert purchase
    const { data: createdPurchase, error: purchaseError } = await supabaseAdmin
      .from('purchases')
      .insert([purchaseData])
      .select()
      .single();

    if (purchaseError) {
      console.error('❌ [Purchases API] Error creating purchase:', purchaseError);
      return NextResponse.json({ error: purchaseError.message }, { status: 500 });
    }

    console.log('✅ [Purchases API] Purchase created:', purchaseId);

    // Create inventory movements for each item
    if (data.items && Array.isArray(data.items) && data.items.length > 0) {
      console.log('📦 [Purchases API] Creating inventory movements...');

      for (const item of data.items) {
        try {
          // Get current product stock
          const { data: product } = await supabaseAdmin
            .from('products')
            .select('stock, cost')
            .eq('id', item.productId)
            .eq('store_id', data.storeId)
            .single();

          if (product) {
            const previousStock = product.stock || 0;
            const newStock = previousStock + item.quantity;

            // Update product stock and cost
            await supabaseAdmin
              .from('products')
              .update({
                stock: newStock,
                cost: item.cost || product.cost,
                updated_at: new Date().toISOString()
              })
              .eq('id', item.productId)
              .eq('store_id', data.storeId);

            // Create movement record with correct Supabase column names (user provided schema)
            const movementData = {
              id: IDGenerator.generate('movement'),
              product_id: item.productId,
              store_id: data.storeId,
              watrhouse_id: null, // User typo
              movement_type: 'purchase',
              quantily: item.quantity, // User typo
              previous_stock: previousStock,
              new_stock: newStock,
              reference_type: purchaseId,
              user_id: data.userId || 'system',
              notes: `Purchase ${purchaseId} from ${data.supplierName || 'supplier'}`,
              unit_cost: item.cost || product.cost || 0,
              total_value: (item.cost || product.cost || 0) * item.quantity,
              batch_id: null,
              created_id: new Date().toISOString(), // User naming
              updated_at: new Date().toISOString()
            };

            const { error: movementError } = await supabaseAdmin
              .from('inventory_movements')
              .insert(movementData);

            if (movementError) {
              console.error(`❌ [Purchases API] Movement error for ${item.productId}:`, movementError);
            } else {
              console.log(`✅ [Purchases API] Movement created for product ${item.productId}`);
            }
          }
        } catch (movementError: any) {
          console.warn(`⚠️ [Purchases API] Error creating movement for ${item.productId}:`, movementError.message);
        }
      }

      console.log('✅ [Purchases API] Inventory movements completed');
    }

    // Format response
    const formattedResponse = {
      id: createdPurchase.id,
      supplierId: createdPurchase.supplier_id,
      supplierName: createdPurchase.supplier_name,
      items: createdPurchase.items,
      total: createdPurchase.total,
      date: createdPurchase.created_at,
      documentNumber: createdPurchase.document_number,
      responsible: createdPurchase.responsible,
      storeId: createdPurchase.store_id,
      createdAt: createdPurchase.created_at,
      updatedAt: createdPurchase.updated_at
    };

    return NextResponse.json(formattedResponse);

  } catch (error: any) {
    console.error('❌ [Purchases API] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const data = await request.json();

    if (!data.id || !data.storeId) {
      return NextResponse.json({ error: 'id and storeId are required' }, { status: 400 });
    }

    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    if (data.supplierId !== undefined) updateData.supplier_id = data.supplierId;
    if (data.supplierName !== undefined) updateData.supplier_name = data.supplierName;
    if (data.items !== undefined) updateData.items = data.items;
    if (data.total !== undefined) updateData.total = data.total;
    if (data.documentNumber !== undefined) updateData.document_number = data.documentNumber;
    if (data.responsible !== undefined) updateData.responsible = data.responsible;

    const { data: updatedPurchase, error } = await supabaseAdmin
      .from('purchases')
      .update(updateData)
      .eq('id', data.id)
      .eq('store_id', data.storeId)
      .select()
      .single();

    if (error) {
      console.error('❌ [Purchases API] Error updating purchase:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!updatedPurchase) {
      return NextResponse.json({ error: 'Purchase not found' }, { status: 404 });
    }

    const formattedResponse = {
      id: updatedPurchase.id,
      supplierId: updatedPurchase.supplier_id,
      supplierName: updatedPurchase.supplier_name,
      items: updatedPurchase.items,
      total: updatedPurchase.total,
      date: updatedPurchase.created_at,
      documentNumber: updatedPurchase.document_number,
      responsible: updatedPurchase.responsible,
      storeId: updatedPurchase.store_id,
      createdAt: updatedPurchase.created_at,
      updatedAt: updatedPurchase.updated_at
    };

    return NextResponse.json(formattedResponse);

  } catch (error: any) {
    console.error('❌ [Purchases API] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const storeId = searchParams.get('storeId');

    if (!id || !storeId) {
      return NextResponse.json({ error: 'id and storeId are required' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('purchases')
      .delete()
      .eq('id', id)
      .eq('store_id', storeId);

    if (error) {
      console.error('❌ [Purchases API] Error deleting purchase:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: 'Purchase deleted successfully' });

  } catch (error: any) {
    console.error('❌ [Purchases API] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
