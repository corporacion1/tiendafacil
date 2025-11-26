/**
 * Configuración y utilidades para almacenamiento de imágenes
 */

export const STORAGE_CONFIG = {
  // Configuración de archivos
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  ALLOWED_EXTENSIONS: ['.jpg', '.jpeg', '.png', '.webp'],
  
  // Configuración de procesamiento
  THUMBNAIL_SIZE: 150,
  COMPRESSED_MAX_WIDTH: 1200,
  COMPRESSED_MAX_HEIGHT: 1200,
  QUALITY: 85,
  THUMBNAIL_QUALITY: 80,
  
  // Configuración de directorios
  UPLOAD_BASE_DIR: 'public/uploads/products',
  URL_BASE_PATH: '/uploads/products'
};

/**
 * Genera la estructura de directorios para un producto
 */
export function getProductDirectories(storeId: string, productId: string) {
  const baseDir = `${STORAGE_CONFIG.UPLOAD_BASE_DIR}/${storeId}/${productId}`;
  const baseUrl = `${STORAGE_CONFIG.URL_BASE_PATH}/${storeId}/${productId}`;
  
  return {
    directories: {
      base: baseDir,
      original: `${baseDir}/original`,
      thumbnails: `${baseDir}/thumbnails`,
      compressed: `${baseDir}/compressed`
    },
    urls: {
      base: baseUrl,
      original: `${baseUrl}/original`,
      thumbnails: `${baseUrl}/thumbnails`,
      compressed: `${baseUrl}/compressed`
    }
  };
}

/**
 * Genera un nombre único para archivo
 */
export function generateUniqueFilename(originalName: string, productId: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const baseName = originalName.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9]/g, '-');
  
  return `${productId}-${baseName}-${timestamp}-${random}`;
}

/**
 * Valida un archivo de imagen
 */
export function validateImageFile(file: File): { isValid: boolean; error?: string } {
  // Validar tamaño
  if (file.size > STORAGE_CONFIG.MAX_FILE_SIZE) {
    const maxSizeMB = STORAGE_CONFIG.MAX_FILE_SIZE / (1024 * 1024);
    return {
      isValid: false,
      error: `Archivo demasiado grande. Máximo permitido: ${maxSizeMB}MB`
    };
  }
  
  // Validar tipo MIME
  if (!STORAGE_CONFIG.ALLOWED_TYPES.includes(file.type)) {
    return {
      isValid: false,
      error: `Formato no soportado. Formatos permitidos: JPG, PNG, WebP`
    };
  }
  
  // Validar extensión
  const extension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
  if (!STORAGE_CONFIG.ALLOWED_EXTENSIONS.includes(extension)) {
    return {
      isValid: false,
      error: `Extensión no válida. Extensiones permitidas: .jpg, .jpeg, .png, .webp`
    };
  }
  
  return { isValid: true };
}

/**
 * Convierte bytes a formato legible
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

/**
 * Obtiene la URL completa de una imagen
 */
export function getFullImageUrl(relativePath: string, baseUrl?: string): string {
  if (relativePath.startsWith('http')) {
    return relativePath; // Ya es una URL completa
  }
  
  const base = baseUrl || (typeof window !== 'undefined' ? window.location.origin : '');
  return `${base}${relativePath.startsWith('/') ? '' : '/'}${relativePath}`;
}

/**
 * Limpia archivos huérfanos (sin implementar - para futuro)
 */
export async function cleanupOrphanedFiles(storeId: string, productId: string): Promise<void> {
  // TODO: Implementar limpieza de archivos huérfanos
  // Esta función se puede usar para limpiar archivos que ya no están referenciados
  console.log(`Cleanup pendiente para producto ${productId} en tienda ${storeId}`);
}