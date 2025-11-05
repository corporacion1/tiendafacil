// Stub replacement: Supabase client removed. Do not import this file.
// If any remaining code imports upload functions, they will receive functions that throw.

export function _supabaseRemoved() {
  throw new Error('Supabase integration has been removed. Use GridFS (/api/images and /api/upload/image) instead.');
}

export async function uploadImage(): Promise<{ url: string; path: string }> { throw _supabaseRemoved(); }
export async function deleteImage(): Promise<void> { throw _supabaseRemoved(); }
export async function uploadMultipleImages(): Promise<any[]> { throw _supabaseRemoved(); }
export async function uploadBase64Image(): Promise<any> { throw _supabaseRemoved(); }