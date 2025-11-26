import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function inspectStore() {
    const { data, error } = await supabase
        .from('stores')
        .select('*')
        .limit(1)
        .single();

    if (error) {
        console.error('Error:', error);
    } else {
        console.log('Raw Store Data Keys:', Object.keys(data));
        console.log('Raw Store Data:', data);
    }
}

inspectStore();
