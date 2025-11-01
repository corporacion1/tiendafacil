import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const getDisplayImageUrl = (url?: string): string => {
  // Debug logging para investigar problemas de URL - REDUCIDO para evitar spam
  const DEBUG_URLS = typeof window !== 'undefined' && window.location.search.includes('debug=urls');
  
  if (DEBUG_URLS) {
    console.log(`🔗 [getDisplayImageUrl] Input URL: ${url}`);
  }
  
  if (!url) {
    if (DEBUG_URLS) {
      console.warn(`🔗 [getDisplayImageUrl] Empty URL provided`);
    }
    return '';
  }
  
  // Handle base64 images (our current storage method)
  if (url.startsWith('data:image')) {
    if (DEBUG_URLS) {
      console.log(`🔗 [getDisplayImageUrl] Base64 image detected, returning as-is`);
    }
    // Base64 images can be used directly
    return url;
  }
  
  let processedUrl = url;
  
  // Handle legacy Dropbox URLs (if any still exist)
  if (url.includes('dropbox.com')) {
    processedUrl = url.replace('www.dropbox.com', 'dl.dropboxusercontent.com').replace('?dl=0', '');
    if (DEBUG_URLS) {
      console.log(`🔗 [getDisplayImageUrl] Legacy Dropbox URL transformed: ${url} → ${processedUrl}`);
    }
  }
  
  // Handle legacy Supabase URLs (if any still exist)
  if (url.includes('supabase')) {
    try {
      const urlObj = new URL(processedUrl);
      if (DEBUG_URLS) {
        console.log(`🔗 [getDisplayImageUrl] Legacy Supabase URL validated: ${processedUrl}`);
      }
    } catch (error) {
      console.error(`🔗 [getDisplayImageUrl] Invalid legacy Supabase URL: ${processedUrl}`, error);
      return '';
    }
  }
  
  // For non-base64 URLs, validate format
  if (!url.startsWith('data:image')) {
    try {
      new URL(processedUrl);
      if (DEBUG_URLS) {
        console.log(`🔗 [getDisplayImageUrl] External URL validated: ${processedUrl}`);
      }
    } catch (error) {
      console.error(`🔗 [getDisplayImageUrl] Invalid URL format: ${processedUrl}`, error);
      return '';
    }
  }
  
  if (DEBUG_URLS) {
    console.log(`🔗 [getDisplayImageUrl] Final URL: ${processedUrl.substring(0, 50)}${processedUrl.length > 50 ? '...' : ''}`);
  }
  
  return processedUrl;
};

/**
 * Funciones de compatibilidad para múltiples imágenes
 */

// Re-exportar funciones principales para fácil acceso
export { 
  getAllProductImages, 
  hasMultipleImages, 
  getImageCount, 
  getPrimaryImageUrl,
  getPrimaryThumbnailUrl 
} from './product-image-utils';

/**
 * Obtiene la URL de imagen para mostrar, con compatibilidad automática
 * Esta función mantiene la API existente pero usa el nuevo sistema internamente
 */
export function getProductDisplayImageUrl(product: any): string {
  // Importar dinámicamente para evitar dependencias circulares
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { getPrimaryImageUrl } = require('./product-image-utils');
  const primaryUrl = getPrimaryImageUrl(product);
  return getDisplayImageUrl(primaryUrl);
}

/**
 * Verifica si un producto tiene imagen para mostrar
 */
export function hasProductImage(product: any): boolean {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { getImageCount } = require('./product-image-utils');
  return getImageCount(product) > 0;
}

/**
 * Valida y corrige URLs de imagen para diferentes entornos
 * Actualizado para el sistema de almacenamiento en DB (base64)
 */
export function validateAndFixImageUrl(url: string): string {
  if (!url) return '';
  
  const DEBUG_URLS = typeof window !== 'undefined' && window.location.search.includes('debug=urls');
  
  // Detectar ambiente
  const isProduction = typeof window !== 'undefined' && 
                      !['localhost', '127.0.0.1'].includes(window.location.hostname) &&
                      !window.location.hostname.startsWith('192.168.');
  
  if (DEBUG_URLS) {
    const urlPreview = url.startsWith('data:image') ? 
      `data:image/... (${url.length} chars)` : url;
    console.log(`🌍 [validateAndFixImageUrl] Environment: ${isProduction ? 'production' : 'local'}, URL: ${urlPreview}`);
  }
  
  // Para imágenes base64, no necesitamos correcciones específicas del ambiente
  if (url.startsWith('data:image')) {
    // Validar que el base64 sea válido
    try {
      const parts = url.split(',');
      if (parts.length !== 2) {
        console.error(`🔗 [validateAndFixImageUrl] Invalid base64 format: missing comma separator`);
        return '';
      }
      
      const base64Data = parts[1];
      if (!base64Data || base64Data.length < 100) {
        console.error(`🔗 [validateAndFixImageUrl] Invalid base64 data: too short or empty`);
        return '';
      }
      
      if (DEBUG_URLS) {
        console.log(`🔗 [validateAndFixImageUrl] Valid base64 image (${base64Data.length} chars)`);
      }
      
      return url; // Base64 images are used as-is
    } catch (error) {
      console.error(`🔗 [validateAndFixImageUrl] Error validating base64 image:`, error);
      return '';
    }
  }
  
  // Para URLs legacy (si existen), aplicar correcciones
  let fixedUrl = url;
  
  if (isProduction) {
    // En producción, asegurar que las URLs legacy usen HTTPS
    if ((url.includes('supabase') || url.includes('dropbox')) && url.startsWith('http:')) {
      fixedUrl = url.replace('http:', 'https:');
      if (DEBUG_URLS) {
        console.log(`🔒 [validateAndFixImageUrl] Fixed HTTP to HTTPS: ${fixedUrl}`);
      }
    }
  }
  
  // Aplicar transformaciones estándar
  const displayUrl = getDisplayImageUrl(fixedUrl);
  
  if (DEBUG_URLS && displayUrl !== fixedUrl) {
    console.log(`🔧 [validateAndFixImageUrl] Applied transformations: ${fixedUrl} → ${displayUrl}`);
  }
  
  return displayUrl;
}

/**
 * Obtiene información básica de imagen de un producto (compatibilidad)
 */
export function getProductImageInfo(product: any) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { getAllProductImages, getPrimaryImageUrl, hasMultipleImages, getImageCount } = require('./product-image-utils');
  
  const primaryUrl = getPrimaryImageUrl(product);
  const displayUrl = validateAndFixImageUrl(primaryUrl);
  
  return {
    url: primaryUrl,
    displayUrl: displayUrl,
    hasImage: getImageCount(product) > 0,
    hasMultiple: hasMultipleImages(product),
    count: getImageCount(product),
    allImages: getAllProductImages(product).map((img: any) => ({
      ...img,
      displayUrl: validateAndFixImageUrl(img.url)
    }))
  };
}
