import { supabaseAdmin } from '@/lib/supabase';

/**
 * Ensure that the Supabase Storage bucket for product images exists.
 * If it does not exist, it will be created automatically.
 * This function can be called during app initialization (e.g., in a useEffect
 * in a top‑level component) to guarantee the bucket is ready before any upload.
 */
export async function ensureProductsBucket() {
    try {
        // List buckets and check if 'products' exists
        const { data: buckets, error: listError } = await supabaseAdmin.storage.listBuckets();
        if (listError) {
            console.error('❌ [Supabase Storage] Error listing buckets:', listError);
            return false;
        }

        const exists = buckets?.some((b) => b.name === 'products');
        if (exists) {
            console.log('✅ [Supabase Storage] Bucket "products" already exists');
            return true;
        }

        // Create the bucket if it does not exist
        const { data: created, error: createError } = await supabaseAdmin.storage.createBucket('products', {
            public: true,
            // Optional: set allowed mime types, size limits, etc.
        });
        if (createError) {
            console.error('❌ [Supabase Storage] Error creating bucket "products":', createError);
            return false;
        }
        console.log('✅ [Supabase Storage] Bucket "products" created successfully');
        return true;
    } catch (e) {
        console.error('❌ [Supabase Storage] Unexpected error in ensureProductsBucket:', e);
        return false;
    }
}
