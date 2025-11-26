// src/lib/supabase.ts - Supabase Client Configuration
import { createClient } from '@supabase/supabase-js';

function getSupabaseUrl() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) throw new Error('NEXT_PUBLIC_SUPABASE_URL no está definida');
  return url;
}

function getSupabaseAnonKey() {
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!key) throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY no está definida');
  return key;
}

function getSupabaseServiceKey() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error('SUPABASE_SERVICE_ROLE_KEY no está definida');
  return key;
}

// Cliente para operaciones del lado del cliente (usa anon key)
// Lazy initialization para permitir que dotenv cargue primero
let _supabase: any;
export const supabase = new Proxy({} as any, {
  get: (target, prop) => {
    if (!_supabase) {
      _supabase = createClient(getSupabaseUrl(), getSupabaseAnonKey());
    }
    return _supabase[prop];
  }
});

// Cliente para operaciones del servidor (usa service role - acceso total)
let _supabaseAdmin: any;
export const supabaseAdmin = new Proxy({} as any, {
  get: (target, prop) => {
    if (!_supabaseAdmin) {
      _supabaseAdmin = createClient(getSupabaseUrl(), getSupabaseServiceKey(), {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      });
    }
    return _supabaseAdmin[prop];
  }
});

// Utilidades para Storage
export async function uploadImage(
  file: File, 
  folder: 'products' | 'ads' | 'stores' | 'users' = 'products',
  bucket: string = 'product-images'
): Promise<{ url: string; path: string }> {
  const fileExt = file.name.split('.').pop();
  const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
  const filePath = `${folder}/${fileName}`;

  const { data, error } = await supabaseAdmin.storage
    .from(bucket)
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false
    });

  if (error) throw error;

  const { data: { publicUrl } } = supabaseAdmin.storage
    .from(bucket)
    .getPublicUrl(filePath);

  return { url: publicUrl, path: filePath };
}

export async function uploadBase64Image(
  base64: string, 
  fileName: string,
  folder: 'products' | 'ads' | 'stores' | 'users' = 'products',
  bucket: string = 'product-images'
): Promise<{ url: string; path: string }> {
  // Extraer tipo MIME y datos
  const matches = base64.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
  if (!matches || matches.length !== 3) {
    throw new Error('Invalid base64 string');
  }

  const contentType = matches[1];
  const base64Data = matches[2];
  const buffer = Buffer.from(base64Data, 'base64');

  const fileExt = contentType.split('/')[1];
  const filePath = `${folder}/${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;

  const { data, error } = await supabaseAdmin.storage
    .from(bucket)
    .upload(filePath, buffer, {
      contentType,
      cacheControl: '3600',
      upsert: false
    });

  if (error) throw error;

  const { data: { publicUrl } } = supabaseAdmin.storage
    .from(bucket)
    .getPublicUrl(filePath);

  return { url: publicUrl, path: filePath };
}

export async function deleteImage(path: string, bucket: string = 'product-images'): Promise<void> {
  const { error } = await supabaseAdmin.storage
    .from(bucket)
    .remove([path]);

  if (error) throw error;
}

export async function uploadMultipleImages(
  files: File[], 
  folder: 'products' | 'ads' | 'stores' | 'users' = 'products',
  bucket: string = 'product-images'
): Promise<Array<{ url: string; path: string }>> {
  const uploads = files.map(file => uploadImage(file, folder, bucket));
  return Promise.all(uploads);
}