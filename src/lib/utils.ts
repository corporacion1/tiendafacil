import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const getDisplayImageUrl = (url?: string): string => {
  if (!url) return '';
  // This function is no longer strictly necessary for dropbox but kept for potential future url transformations
  if (url.includes('dropbox.com')) {
    return url.replace('www.dropbox.com', 'dl.dropboxusercontent.com').replace('?dl=0', '');
  }
  return url;
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
  const { getPrimaryImageUrl } = require('./product-image-utils');
  const primaryUrl = getPrimaryImageUrl(product);
  return getDisplayImageUrl(primaryUrl);
}

/**
 * Verifica si un producto tiene imagen para mostrar
 */
export function hasProductImage(product: any): boolean {
  const { getImageCount } = require('./product-image-utils');
  return getImageCount(product) > 0;
}

/**
 * Obtiene información básica de imagen de un producto (compatibilidad)
 */
export function getProductImageInfo(product: any) {
  const { getAllProductImages, getPrimaryImageUrl, hasMultipleImages, getImageCount } = require('./product-image-utils');
  
  return {
    url: getPrimaryImageUrl(product),
    displayUrl: getDisplayImageUrl(getPrimaryImageUrl(product)),
    hasImage: getImageCount(product) > 0,
    hasMultiple: hasMultipleImages(product),
    count: getImageCount(product),
    allImages: getAllProductImages(product)
  };
}
