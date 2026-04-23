// src/services/local-storage.ts
import fs from 'fs/promises';
import path from 'path';
import { STORAGE_CONFIG } from '@/lib/image-storage';

/**
 * Servicio para manejar el almacenamiento de archivos en el sistema de archivos local
 */
export class LocalStorageService {
  private static async ensureDir(dir: string) {
    try {
      await fs.access(dir);
    } catch {
      await fs.mkdir(dir, { recursive: true });
    }
  }

  /**
   * Guarda un archivo en el disco local
   */
  static async uploadFile(
    fileData: Buffer | Uint8Array,
    fileName: string,
    folder: string = 'products',
    contentType: string = 'image/jpeg'
  ): Promise<{ url: string; path: string }> {
    const publicDir = path.join(process.cwd(), 'public');
    const relativePath = path.join('uploads', folder, fileName);
    const absolutePath = path.join(publicDir, relativePath);

    // Asegurar que el directorio existe
    await this.ensureDir(path.dirname(absolutePath));

    // Guardar el archivo
    await fs.writeFile(absolutePath, fileData);

    // Devolver la URL relativa y el path
    return {
      url: `/${relativePath.replace(/\\/g, '/')}`,
      path: relativePath
    };
  }

  /**
   * Elimina un archivo del disco local
   */
  static async deleteFile(filePath: string): Promise<void> {
    const absolutePath = path.join(process.cwd(), 'public', filePath);
    try {
      await fs.unlink(absolutePath);
    } catch (error) {
      console.warn(`⚠️ [LocalStorage] Could not delete file ${filePath}:`, error);
    }
  }

  /**
   * Verifica si un archivo existe
   */
  static async fileExists(filePath: string): Promise<boolean> {
    const absolutePath = path.join(process.cwd(), 'public', filePath);
    try {
      await fs.access(absolutePath);
      return true;
    } catch {
      return false;
    }
  }
}
