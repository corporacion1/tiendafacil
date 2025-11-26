import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const email = searchParams.get('email');

        if (email) {
            // Buscar usuario específico
            const { data: user, error } = await supabase
                .from('users')
                .select('uid, email, role, status, store_id, created_at, password')
                .eq('email', email.toLowerCase())
                .single();

            if (error) {
                return NextResponse.json({
                    error: error.message,
                    details: error
                }, { status: 500 });
            }

            return NextResponse.json({
                user: user ? {
                    ...user,
                    passwordFormat: user.password ? {
                        length: user.password.length,
                        startsWith: user.password.substring(0, 10),
                        isBcrypt: user.password.startsWith('$2')
                    } : null
                } : null
            });
        }

        // Listar todos los usuarios
        const { data: users, error } = await supabase
            .from('users')
            .select('uid, email, role, status, store_id, created_at')
            .order('created_at', { ascending: false })
            .limit(20);

        if (error) {
            return NextResponse.json({
                error: error.message,
                details: error
            }, { status: 500 });
        }

        return NextResponse.json({
            count: users?.length || 0,
            users: users || []
        });

    } catch (error: any) {
        return NextResponse.json({
            error: error.message
        }, { status: 500 });
    }
}
