import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// Helper to generate recipient ID
const generateRecipientId = () => `REC-${Date.now().toString().slice(-8)}`;

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const storeId = searchParams.get('storeId');

        if (!storeId) {
            return NextResponse.json({ error: 'storeId is required' }, { status: 400 });
        }

        const { data: recipients, error } = await supabaseAdmin
            .from('payment_recipients')
            .select('*')
            .eq('store_id', storeId)
            .order('name', { ascending: true });

        if (error) {
            console.error('Error fetching payment recipients:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Map database fields to camelCase
        const formattedRecipients = recipients.map(r => ({
            id: r.id,
            storeId: r.store_id,
            name: r.name,
            taxId: r.tax_id,
            phone: r.phone,
            email: r.email,
            address: r.address,
            notes: r.notes,
            createdAt: r.created_at,
            updatedAt: r.updated_at
        }));

        return NextResponse.json(formattedRecipients);
    } catch (error: any) {
        console.error('Error in GET /api/payment-recipients:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { storeId, name, taxId, phone, email, address, notes } = body;

        // Validation
        if (!storeId || !name) {
            return NextResponse.json(
                { error: 'Missing required fields: storeId, name' },
                { status: 400 }
            );
        }

        const recipientId = generateRecipientId();

        const { data: recipient, error } = await supabaseAdmin
            .from('payment_recipients')
            .insert({
                id: recipientId,
                store_id: storeId,
                name,
                tax_id: taxId,
                phone,
                email,
                address,
                notes,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            })
            .select()
            .single();

        if (error) {
            console.error('Error creating payment recipient:', error);

            // Check for unique constraint violation
            if (error.code === '23505') {
                return NextResponse.json(
                    { error: 'A recipient with this name already exists for this store' },
                    { status: 409 }
                );
            }

            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Format response
        const formattedRecipient = {
            id: recipient.id,
            storeId: recipient.store_id,
            name: recipient.name,
            taxId: recipient.tax_id,
            phone: recipient.phone,
            email: recipient.email,
            address: recipient.address,
            notes: recipient.notes,
            createdAt: recipient.created_at,
            updatedAt: recipient.updated_at
        };

        return NextResponse.json(formattedRecipient, { status: 201 });
    } catch (error: any) {
        console.error('Error in POST /api/payment-recipients:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    try {
        const body = await request.json();
        const { id, ...updates } = body;

        if (!id) {
            return NextResponse.json({ error: 'Recipient ID is required' }, { status: 400 });
        }

        // Map camelCase to snake_case for database
        const dbUpdates: any = {
            updated_at: new Date().toISOString()
        };

        if (updates.name) dbUpdates.name = updates.name;
        if (updates.taxId !== undefined) dbUpdates.tax_id = updates.taxId;
        if (updates.phone !== undefined) dbUpdates.phone = updates.phone;
        if (updates.email !== undefined) dbUpdates.email = updates.email;
        if (updates.address !== undefined) dbUpdates.address = updates.address;
        if (updates.notes !== undefined) dbUpdates.notes = updates.notes;

        const { data: recipient, error } = await supabaseAdmin
            .from('payment_recipients')
            .update(dbUpdates)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Error updating payment recipient:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Format response
        const formattedRecipient = {
            id: recipient.id,
            storeId: recipient.store_id,
            name: recipient.name,
            taxId: recipient.tax_id,
            phone: recipient.phone,
            email: recipient.email,
            address: recipient.address,
            notes: recipient.notes,
            createdAt: recipient.created_at,
            updatedAt: recipient.updated_at
        };

        return NextResponse.json(formattedRecipient);
    } catch (error: any) {
        console.error('Error in PUT /api/payment-recipients:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'Recipient ID is required' }, { status: 400 });
        }

        // Check if recipient is used in any payments
        const { data: payments, error: checkError } = await supabaseAdmin
            .from('payments')
            .select('id')
            .eq('recipient_name', id)
            .limit(1);

        if (checkError) {
            console.error('Error checking recipient usage:', checkError);
        }

        if (payments && payments.length > 0) {
            return NextResponse.json(
                { error: 'Cannot delete recipient that is used in existing payments' },
                { status: 409 }
            );
        }

        const { error } = await supabaseAdmin
            .from('payment_recipients')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting payment recipient:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, message: 'Recipient deleted successfully' });
    } catch (error: any) {
        console.error('Error in DELETE /api/payment-recipients:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
