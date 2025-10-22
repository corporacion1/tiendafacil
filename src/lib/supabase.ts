import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Función para subir imagen
export async function uploadImage(file: File): Promise<{ url: string; path: string }> {
  const fileExt = file.name.split('.').pop();
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
  const filePath = `products/${fileName}`;

  const { data, error } = await supabase.storage
    .from('images')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false
    });

  if (error) {
    throw new Error(`Error uploading image: ${error.message}`);
  }

  // Obtener URL pública
  const { data: { publicUrl } } = supabase.storage
    .from('images')
    .getPublicUrl(filePath);

  return {
    url: publicUrl,
    path: filePath
  };
}

// Función para eliminar imagen
export async function deleteImage(path: string): Promise<void> {
  const { error } = await supabase.storage
    .from('images')
    .remove([path]);

  if (error) {
    throw new Error(`Error deleting image: ${error.message}`);
  }
}