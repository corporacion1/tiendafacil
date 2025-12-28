import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ storeId: string }> }
) {
    const resolvedParams = await params;
    const storeId = resolvedParams.storeId;

    console.log('Fetching users for storeId:', storeId);

    if (!storeId) {
        return NextResponse.json({ error: 'Tienda no encontrada' }, { status: 404 });
    }

    try {
        // Obtener directamente los usuarios de esta tienda
        const { data: users, error } = await supabaseAdmin
            .from('users')
            .select(`
        uid,
        email,
        display_name,
        phone,
        status,
        role,
        created_at
      `)
            .eq('store_id', storeId)
            .order('created_at', { ascending: true });

        if (error) {
            console.error('Error fetching users:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        console.log(`Found ${users?.length || 0} users for store ${storeId}`);

        // Transformar los datos para que coincidan con el formato esperado en el frontend
        const transformedUsers = (users || []).map((user: any) => ({
            uid: user.uid,
            email: user.email,
            displayName: user.display_name,
            phone: user.phone,
            status: user.status,
            role: user.role,
            createdAt: user.created_at
        }));

        return NextResponse.json({ users: transformedUsers });

    } catch (error: any) {
        console.error('Error in users endpoint:', error);
        return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
    }
}
