import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Resuelve la URL de una imagen, priorizando almacenamiento local
 * y usando un placeholder para imágenes de DB que ya no son accesibles.
 */
export const getDisplayImageUrl = (url?: string, type: 'product' | 'ad' | 'store' | 'user' = 'product'): string => {
  if (!url || url === '' || url === '/placeholder.svg') {
    return '/placeholder.svg';
  }
  
  // 1. Si es un data URI o una ruta local absoluta (interna), devolver tal cual
  if (url.startsWith('data:')) return url;
  if (url.startsWith('/')) return url;

  // 2. Si es una URL completa de Database o externa, devolverla tal cual para que el navegador la cargue
  // Esto permite que las imágenes migradas de Database sigan funcionando si no se han descargado localmente
  if (url.startsWith('http')) {
    return url;
  }

  // 3. Extraer el nombre del archivo si es una ruta local con directorios
  let fileName = '';
  try {
    const parts = url.split(/[\\/]/);
    fileName = parts[parts.length - 1];
  } catch (e) {
    fileName = url;
  }

  // 4. Si no tenemos un nombre de archivo válido con extensión, usar placeholder
  if (!fileName || !fileName.includes('.')) return '/placeholder.svg';

  // 5. Intentar adivinar la carpeta local según el contexto original o el tipo
  const lowerUrl = url.toLowerCase();
  
  if (type === 'ad' || lowerUrl.includes('ads')) {
    return `/uploads/ads/${fileName}`;
  }
  
  if (type === 'user' || lowerUrl.includes('users')) return `/uploads/users/${fileName}`;
  if (type === 'store' || lowerUrl.includes('stores')) return `/uploads/stores/${fileName}`;

  // Por defecto, buscar en la carpeta de productos
  return `/uploads/products/${fileName}`;
};

export { 
  getAllProductImages, 
  hasMultipleImages, 
  getImageCount, 
  getPrimaryImageUrl,
  getPrimaryThumbnailUrl 
} from './product-image-utils';

export function getProductDisplayImageUrl(product: any): string {
  const { getPrimaryImageUrl } = require('./product-image-utils');
  const primaryUrl = getPrimaryImageUrl(product);
  return getDisplayImageUrl(primaryUrl);
}

export function hasProductImage(product: any): boolean {
  const { getImageCount } = require('./product-image-utils');
  return getImageCount(product) > 0;
}

export function validateAndFixImageUrl(url: string | undefined): string {
  return getDisplayImageUrl(url);
}

export function getProductImageInfo(product: any) {
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
