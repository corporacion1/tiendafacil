import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const getDisplayImageUrl = (url?: string): string => {
  const DEBUG_URLS = typeof window !== 'undefined' && window.location.search.includes('debug=urls');

  // Simple in-memory cache to avoid re-processing the same URLs repeatedly
  // and optional persistence to localStorage to speed up subsequent page loads.
  // Keep at module-level to survive multiple calls during a single session.
  try {
    // `__urlCache` is attached to global/window for single shared instance in dev HMR
    if (typeof globalThis !== 'undefined' && !(globalThis as any).__tf_url_cache) {
      (globalThis as any).__tf_url_cache = new Map<string, string>();
    }
  } catch (e) {
    // ignore
  }
  const urlCache: Map<string, string> | undefined = (typeof globalThis !== 'undefined') ? (globalThis as any).__tf_url_cache : undefined;
  
  if (DEBUG_URLS) {
    console.log(`🔗 [getDisplayImageUrl] Input URL: ${url}`);
  }
  
  if (!url) {
    if (DEBUG_URLS) {
      console.warn(`🔗 [getDisplayImageUrl] Empty URL provided`);
    }
    return '/api/images/placeholder'; // Fallback to placeholder
  }
  
  let processedUrl = url;

  // Return from cache if available
  try {
    if (urlCache && urlCache.has(url)) {
      const cached = urlCache.get(url)!;
      if (DEBUG_URLS) console.log(`🔗 [getDisplayImageUrl] Cache HIT for URL: ${url}`);
      return cached;
    }
  } catch (e) {
    // ignore cache errors
  }
  
  // Do not rely on Supabase tokens anymore; assume images are served from local API or valid external URLs.
  
  // Si es un data URI o una ruta local absoluta (interna), devolver tal cual
  if (processedUrl.startsWith('data:')) {
    if (DEBUG_URLS) console.log(`🔗 [getDisplayImageUrl] Data URI detected, returning as-is`);
    return processedUrl;
  }

  // Aceptar rutas locales que comiencen con / (assets públicos) incluidas nuestras rutas /api/images/
  if (processedUrl.startsWith('/')) {
    if (DEBUG_URLS) console.log(`🔗 [getDisplayImageUrl] Local path detected: ${processedUrl}`);
    return processedUrl;
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

  // Store in cache (best-effort)
  try {
    if (urlCache) {
      urlCache.set(url, processedUrl);

      // Persist a small cache snapshot to localStorage to improve reloads
      try {
        const maxEntries = 200;
        const arr: [string, string][] = Array.from(urlCache.entries()).slice(-maxEntries);
        localStorage.setItem('tf_image_url_cache', JSON.stringify(arr));
      } catch (e) {
        // ignore storage errors
      }
    }
  } catch (e) {
    // ignore
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
    return '/api/images/placeholder'; // Fallback to placeholder
  }
  
  let fixedUrl = url;
  
  // No longer append Supabase tokens; prefer local API images or valid external URLs.
  
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
