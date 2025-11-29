import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
    try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        console.log('🔍 Testing Supabase connection...');
        console.log('URL exists:', !!supabaseUrl);
        console.log('Key exists:', !!supabaseServiceKey);

        if (!supabaseUrl || !supabaseServiceKey) {
            return NextResponse.json({
                success: false,
                error: 'Missing environment variables',
                details: {
                    hasUrl: !!supabaseUrl,
                    hasKey: !!supabaseServiceKey
                }
            });
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // Try to query the customers table
        const { data, error } = await supabase
            .from('customers')
            .select('count')
            .limit(1);

        if (error) {
            console.error('❌ Supabase query error:', error);
            return NextResponse.json({
                success: false,
                error: 'Supabase query failed',
                details: error
            });
        }

        console.log('✅ Supabase connection successful!');
        return NextResponse.json({
            success: true,
            message: 'Supabase connection working',
            data
        });

    } catch (error: any) {
        console.error('❌ Test failed:', error);
        return NextResponse.json({
            success: false,
            error: error.message
        });
    }
}
