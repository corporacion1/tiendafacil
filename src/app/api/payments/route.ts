import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// Helper to generate payment ID
const generatePaymentId = () => `PAY-${Date.now().toString().slice(-8)}`;

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const storeId = searchParams.get('storeId');

        if (!storeId) {
            return NextResponse.json({ error: 'storeId is required' }, { status: 400 });
        }

        const { data: payments, error } = await supabaseAdmin
            .from('payments')
            .select('*')
            .eq('store_id', storeId)
            .order('payment_date', { ascending: false });

        if (error) {
            console.error('Error fetching payments:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Map database fields to camelCase
        const formattedPayments = payments.map((p: any) => ({
            id: p.id,
            storeId: p.store_id,
            recipientName: p.recipient_name,
            recipientId: p.recipient_id,
            recipientPhone: p.recipient_phone,
            category: p.category,
            amount: parseFloat(p.amount),
            currency: p.currency,
            documentNumber: p.document_number,
            paymentMethod: p.payment_method,
            notes: p.notes,
            responsible: p.responsible,
            paymentDate: p.payment_date,
            createdAt: p.created_at,
            updatedAt: p.updated_at
        }));

        return NextResponse.json(formattedPayments);
    } catch (error: any) {
        console.error('Error in GET /api/payments:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const {
            storeId,
            recipientName,
            recipientId,
            recipientPhone,
            category,
            amount,
            currency = 'primary',
            documentNumber,
            paymentMethod,
            notes,
            responsible,
            paymentDate
        } = body;

        // Validation
        if (!storeId || !recipientName || !category || !amount || !responsible || !paymentDate) {
            return NextResponse.json(
                { error: 'Missing required fields: storeId, recipientName, category, amount, responsible, paymentDate' },
                { status: 400 }
            );
        }

        if (amount <= 0) {
            return NextResponse.json({ error: 'Amount must be greater than 0' }, { status: 400 });
        }

        const paymentId = generatePaymentId();

        const { data: payment, error } = await supabaseAdmin
            .from('payments')
            .insert({
                id: paymentId,
                store_id: storeId,
                recipient_name: recipientName,
                recipient_id: recipientId,
                recipient_phone: recipientPhone,
                category,
                amount,
                currency,
                document_number: documentNumber,
                payment_method: paymentMethod,
                notes,
                responsible,
                payment_date: paymentDate,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            })
            .select()
            .single();

        if (error) {
            console.error('Error creating payment:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Format response
        const formattedPayment = {
            id: payment.id,
            storeId: payment.store_id,
            recipientName: payment.recipient_name,
            recipientId: payment.recipient_id,
            recipientPhone: payment.recipient_phone,
            category: payment.category,
            amount: parseFloat(payment.amount),
            currency: payment.currency,
            documentNumber: payment.document_number,
            paymentMethod: payment.payment_method,
            notes: payment.notes,
            responsible: payment.responsible,
            paymentDate: payment.payment_date,
            createdAt: payment.created_at,
            updatedAt: payment.updated_at
        };

        return NextResponse.json(formattedPayment, { status: 201 });
    } catch (error: any) {
        console.error('Error in POST /api/payments:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    try {
        const body = await request.json();
        const { id, ...updates } = body;

        if (!id) {
            return NextResponse.json({ error: 'Payment ID is required' }, { status: 400 });
        }

        // Map camelCase to snake_case for database
        const dbUpdates: any = {
            updated_at: new Date().toISOString()
        };

        if (updates.recipientName) dbUpdates.recipient_name = updates.recipientName;
        if (updates.recipientId !== undefined) dbUpdates.recipient_id = updates.recipientId;
        if (updates.recipientPhone !== undefined) dbUpdates.recipient_phone = updates.recipientPhone;
        if (updates.category) dbUpdates.category = updates.category;
        if (updates.amount !== undefined) dbUpdates.amount = updates.amount;
        if (updates.currency !== undefined) dbUpdates.currency = updates.currency;
        if (updates.documentNumber !== undefined) dbUpdates.document_number = updates.documentNumber;
        if (updates.paymentMethod !== undefined) dbUpdates.payment_method = updates.paymentMethod;
        if (updates.notes !== undefined) dbUpdates.notes = updates.notes;
        if (updates.responsible) dbUpdates.responsible = updates.responsible;
        if (updates.paymentDate) dbUpdates.payment_date = updates.paymentDate;

        const { data: payment, error } = await supabaseAdmin
            .from('payments')
            .update(dbUpdates)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Error updating payment:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Format response
        const formattedPayment = {
            id: payment.id,
            storeId: payment.store_id,
            recipientName: payment.recipient_name,
            recipientId: payment.recipient_id,
            recipientPhone: payment.recipient_phone,
            category: payment.category,
            amount: parseFloat(payment.amount),
            currency: payment.currency,
            documentNumber: payment.document_number,
            paymentMethod: payment.payment_method,
            notes: payment.notes,
            responsible: payment.responsible,
            paymentDate: payment.payment_date,
            createdAt: payment.created_at,
            updatedAt: payment.updated_at
        };

        return NextResponse.json(formattedPayment);
    } catch (error: any) {
        console.error('Error in PUT /api/payments:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'Payment ID is required' }, { status: 400 });
        }

        const { error } = await supabaseAdmin
            .from('payments')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting payment:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, message: 'Payment deleted successfully' });
    } catch (error: any) {
        console.error('Error in DELETE /api/payments:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
