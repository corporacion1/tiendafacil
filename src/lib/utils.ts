import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const getDisplayImageUrl = (url?: string): string => {
  const DEBUG_URLS = typeof window !== 'undefined' && window.location.search.includes('debug=urls');
  
  if (DEBUG_URLS) {
    console.log(`🔗 [getDisplayImageUrl] Input URL: ${url}`);
  }
  
  if (!url) {
    if (DEBUG_URLS) {
      console.warn(`🔗 [getDisplayImageUrl] Empty URL provided`);
    }
    return '/placeholder-image.jpg'; // Fallback to placeholder
  }
  
  let processedUrl = url;
  
  // Handle Supabase URLs (add token if missing)
  if (processedUrl.includes(process.env.NEXT_PUBLIC_SUPABASE_URL as string) && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    if (!processedUrl.includes('token=')) {
      processedUrl = `${processedUrl}?token=${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`;
      if (DEBUG_URLS) {
        console.log(`🔗 [getDisplayImageUrl] Supabase URL: added token`);
      }
    }
  }
  
  // Validate format for external URLs
  try {
    new URL(processedUrl);
    if (DEBUG_URLS) {
      console.log(`🔗 [getDisplayImageUrl] External URL validated: ${processedUrl}`);
    }
  } catch (error) {
    console.error(`🔗 [getDisplayImageUrl] Invalid URL format: ${processedUrl}`, error);
    return '/placeholder-image.jpg'; // Fallback to placeholder for invalid format
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

export function validateAndFixImageUrl(url: string | undefined): string {
  const DEBUG_URLS = typeof window !== 'undefined' && window.location.search.includes('debug=urls');
  
  if (!url) {
    if (DEBUG_URLS) {
      console.warn(`🔗 [validateAndFixImageUrl] Empty URL provided`);
    }
    return '/placeholder-image.jpg'; // Fallback to placeholder
  }
  
  let fixedUrl = url;
  
  // Handle Supabase URLs (add token if missing)
  if (fixedUrl.includes(process.env.NEXT_PUBLIC_SUPABASE_URL as string) && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    if (!fixedUrl.includes('token=')) {
      fixedUrl = `${fixedUrl}?token=${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`;
      if (DEBUG_URLS) {
        console.log(`🔗 [validateAndFixImageUrl] Supabase URL: added token`);
      }
    }
  }
  
  // Validate format for external URLs
  try {
    new URL(fixedUrl);
    if (DEBUG_URLS) {
      console.log(`🔗 [validateAndFixImageUrl] External URL validated: ${fixedUrl}`);
    }
  } catch (error) {
    console.error(`🔗 [validateAndFixImageUrl] Invalid URL format: ${fixedUrl}`, error);
    return '/placeholder-image.jpg'; // Fallback to placeholder for invalid format
  }
  
  if (DEBUG_URLS) {
    console.log(`🔗 [validateAndFixImageUrl] Final URL: ${fixedUrl.substring(0, 50)}${fixedUrl.length > 50 ? '...' : ''}`);
  }
  
  return fixedUrl;
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
