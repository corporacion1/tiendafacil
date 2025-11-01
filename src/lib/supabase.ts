import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Solo crear el cliente si las variables están disponibles
export const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Función para subir imagen
export async function uploadImage(file: File): Promise<{ url: string; path: string }> {
  if (!supabase) {
    throw new Error('Supabase client not initialized. Check environment variables.');
  }

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
  if (!supabase) {
    throw new Error('Supabase client not initialized. Check environment variables.');
  }

  const { error } = await supabase.storage
    .from('images')
    .remove([path]);

  if (error) {
    throw new Error(`Error deleting image: ${error.message}`);
  }
}

// Función para subir múltiples imágenes
export async function uploadMultipleImages(
  files: File[], 
  productId: string, 
  storeId: string
): Promise<Array<{ url: string; path: string; originalName: string }>> {
  if (!supabase) {
    throw new Error('Supabase client not initialized. Check environment variables.');
  }

  const results = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const fileExt = file.name.split('.').pop();
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    const fileName = `${productId}-${timestamp}-${i}-${random}.${fileExt}`;
    const filePath = `products/${storeId}/${productId}/${fileName}`;

    console.log(`📤 [Supabase] Subiendo imagen ${i + 1}/${files.length}: ${fileName}`);

    const { data, error } = await supabase.storage
      .from('images')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error(`❌ [Supabase] Error subiendo ${fileName}:`, error);
      throw new Error(`Error uploading image ${file.name}: ${error.message}`);
    }

    // Obtener URL pública
    const { data: { publicUrl } } = supabase.storage
      .from('images')
      .getPublicUrl(filePath);

    console.log(`✅ [Supabase] Imagen subida: ${publicUrl}`);

    results.push({
      url: publicUrl,
      path: filePath,
      originalName: file.name
    });
  }

  return results;
}

// Función para eliminar múltiples imágenes
export async function deleteMultipleImages(paths: string[]): Promise<void> {
  if (!supabase) {
    throw new Error('Supabase client not initialized. Check environment variables.');
  }

  if (paths.length === 0) return;

  console.log('🗑️ [Supabase] Eliminando imágenes:', paths);

  const { error } = await supabase.storage
    .from('images')
    .remove(paths);

  if (error) {
    console.error('❌ [Supabase] Error eliminando imágenes:', error);
    throw new Error(`Error deleting images: ${error.message}`);
  }

  console.log('✅ [Supabase] Imágenes eliminadas exitosamente');
}