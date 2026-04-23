// src/lib/db.ts
import { dbBridge } from './db-bridge';
import { LocalStorageService } from '@/services/local-storage';

/**
 * Proxy para mantener compatibilidad con el código existente mientras
 * se migra a PostgreSQL local.
 */
export const db = dbBridge;
export const dbAdmin = dbBridge;

/**
 * Mapeo de funciones de imagen de DB a almacenamiento local
 */
export async function uploadImage(file: File, bucket: string = 'products') {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const fileName = `${Date.now()}-${file.name.replace(/\s+/g, '-')}`;
  
  const result = await LocalStorageService.uploadFile(
    buffer,
    fileName,
    bucket,
    file.type
  );
  
  return {
    url: result.url,
    path: result.path
  };
}

export async function deleteImage(path: string) {
  return await LocalStorageService.deleteFile(path);
}

export async function uploadBase64Image(base64: string, fileName: string, folder: string = 'products') {
  // Eliminar prefijo data:image/...;base64, si existe
  const base64Data = base64.replace(/^data:image\/\w+;base64,/, "");
  const buffer = Buffer.from(base64Data, 'base64');
  
  const result = await LocalStorageService.uploadFile(
    buffer,
    fileName,
    folder,
    'image/jpeg'
  );
  
  return {
    url: result.url,
    path: result.path
  };
}

// Si alguna parte del código usa la clase predeterminada
export default dbBridge;
