import { NextResponse, NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('storeId');
    const deliveryProviderId = searchParams.get('deliveryProviderId');
    const status = searchParams.get('status');

    if (!storeId) {
      return NextResponse.json({ error: 'storeId requerido' }, { status: 400 });
    }

    let query = supabaseAdmin
      .from('delivery_payments')
      .select('*')
      .eq('store_id', storeId);

    if (deliveryProviderId) {
      query = query.eq('delivery_provider_id', deliveryProviderId);
    }

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query.order('payment_date', { ascending: false });

    if (error) throw error;

    const payments = data?.map((p: any) => ({
      id: p.id,
      storeId: p.store_id,
      deliveryProviderId: p.delivery_provider_id,
      deliveryAssignmentIds: p.delivery_assignment_ids,
      totalAssignments: p.total_assignments,
      totalCommissionAmount: p.total_commission_amount,
      paymentAmount: p.payment_amount,
      paymentDate: p.payment_date,
      paymentMethod: p.payment_method,
      bankName: p.bank_name,
      accountNumber: p.account_number,
      referenceNumber: p.reference_number,
      status: p.status,
      notes: p.notes,
      createdBy: p.created_by,
      createdAt: p.created_at,
      updatedAt: p.updated_at,
    })) || [];

    return NextResponse.json(payments);
  } catch (error: any) {
    console.error('❌ Error fetching delivery payments:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      storeId, deliveryProviderId, deliveryAssignmentIds,
      paymentMethod, bankName, accountNumber, referenceNumber,
      notes, createdBy
    } = body;

    if (!storeId || !deliveryProviderId || !deliveryAssignmentIds || !paymentMethod || !body.paymentAmount) {
      return NextResponse.json({
        error: 'Campos requeridos: storeId, deliveryProviderId, deliveryAssignmentIds, paymentMethod, paymentAmount'
      }, { status: 400 });
    }

    const id = `PAY-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const { data, error } = await supabaseAdmin
      .from('delivery_payments')
      .insert([{
        id,
        store_id: storeId,
        delivery_provider_id: deliveryProviderId,
        delivery_assignment_ids: deliveryAssignmentIds,
        total_assignments: deliveryAssignmentIds.length,
        total_commission_amount: body.totalCommissionAmount || 0,
        payment_amount: body.paymentAmount,
        payment_date: new Date().toISOString(),
        payment_method: paymentMethod,
        bank_name: bankName,
        account_number: accountNumber,
        reference_number: referenceNumber,
        status: body.status || 'completed',
        notes,
        created_by: createdBy
      }])
      .select()
      .single();

    if (error) throw error;

    // Marcar asignaciones como pagadas
    if (deliveryAssignmentIds && deliveryAssignmentIds.length > 0) {
      await supabaseAdmin
        .from('delivery_assignments')
        .update({
          provider_payment_status: 'paid',
          provider_payment_date: new Date().toISOString(),
          provider_payment_method: paymentMethod,
          provider_payment_reference: referenceNumber
        })
        .in('id', deliveryAssignmentIds);
    }

    return NextResponse.json({
      id: data.id,
      storeId: data.store_id,
      deliveryProviderId: data.delivery_provider_id,
      deliveryAssignmentIds: data.delivery_assignment_ids,
      totalAssignments: data.total_assignments,
      totalCommissionAmount: data.total_commission_amount,
      paymentAmount: data.payment_amount,
      paymentDate: data.payment_date,
      paymentMethod: data.payment_method,
      bankName: data.bank_name,
      accountNumber: data.account_number,
      referenceNumber: data.reference_number,
      status: data.status,
      notes: data.notes,
      createdBy: data.created_by,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    });
  } catch (error: any) {
    console.error('❌ Error creating delivery payment:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
