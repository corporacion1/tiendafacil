import { Product, ProductImage } from './types';
// Supabase dependency removed: images will be stored/served from MongoDB GridFS

// Flag para habilitar/deshabilitar logging de debug - REDUCIDO para evitar spam
const DEBUG_IMAGES = typeof window !== 'undefined' && window.location.search.includes('debug=images');

/**
 * Log de debug para utilidades de imágenes - REDUCIDO
 */
function debugLog(message: string, data?: any) {
  if (DEBUG_IMAGES) {
    console.log(`🖼️ [ImageUtils] ${message}`, data || '');
  }
}

/**
 * Obtiene la URL de la imagen principal de un producto
 * Mantiene compatibilidad con productos que solo tienen imageUrl
 */
export function getPrimaryImageUrl(product: Product): string | undefined {
  debugLog(`Getting primary image URL for product: ${product.name} (${product.id})`);
  
  // Si tiene array de imágenes, usar la imagen principal
  if (product.images && product.images.length > 0) {
    const primaryIndex = product.primaryImageIndex || 0;
    const primaryImage = product.images[primaryIndex] || product.images[0];
    debugLog(`Using images array - Primary index: ${primaryIndex}, URL: ${primaryImage.url}`);
    return primaryImage.url;
  }
  
  // Fallback a imageUrl para compatibilidad
  debugLog(`Using legacy imageUrl: ${product.imageUrl}`);
  return product.imageUrl;
}

/**
 * Obtiene la URL del thumbnail de la imagen principal
 */
export function getPrimaryThumbnailUrl(product: Product): string | undefined {
  if (product.images && product.images.length > 0) {
    const primaryIndex = product.primaryImageIndex || 0;
    const primaryImage = product.images[primaryIndex] || product.images[0];
    return primaryImage.thumbnailUrl || primaryImage.url;
  }
  
  return product.imageUrl;
}

/**
 * Obtiene todas las imágenes de un producto como array
 * Convierte imageUrl a formato de array si es necesario
 */
export function getAllProductImages(product: Product): ProductImage[] {
  debugLog(`Getting all images for product: ${product.name} (${product.id})`);
  
  // Si ya tiene array de imágenes, devolverlo
  if (product.images && product.images.length > 0) {
    debugLog(`Found ${product.images.length} images in images array`);
    return product.images;
  }
  
  // Si solo tiene imageUrl, convertirlo a formato de array
  if (product.imageUrl) {
    debugLog(`Converting legacy imageUrl to array format: ${product.imageUrl}`);
    return [{
      id: `legacy-${product.id}`,
      url: product.imageUrl,
      alt: product.imageHint || product.name,
      order: 0,
      uploadedAt: product.createdAt
    }];
  }
  
  debugLog(`No images found for product`);
  return [];
}

/**
 * Verifica si un producto tiene múltiples imágenes
 */
export function hasMultipleImages(product: Product): boolean {
  const images = getAllProductImages(product);
  const hasMultiple = images.length > 1;
  debugLog(`Product ${product.name} has multiple images: ${hasMultiple} (${images.length} total)`);
  return hasMultiple;
}

/**
 * Obtiene el número total de imágenes de un producto
 */
export function getImageCount(product: Product): number {
  const count = getAllProductImages(product).length;
  debugLog(`Product ${product.name} image count: ${count}`);
  return count;
}

/**
 * Convierte un producto con imageUrl a formato de múltiples imágenes
 */
export async function migrateProductToMultipleImages(product: Product): Promise<Product> {
  // Si ya tiene array de imágenes, no hacer nada
  if (product.images && product.images.length > 0) {
    return product;
  }
  
  // Si tiene imageUrl, convertirlo
  if (product.imageUrl) {
    // Convert legacy imageUrl into images array without external uploads.
    const migratedProduct: Product = {
      ...product,
      images: [{
        id: `migrated-${Date.now()}`,
        url: product.imageUrl,
        alt: product.imageHint || product.name,
        order: 0,
        uploadedAt: new Date().toISOString(),
        size: 0
      }],
      primaryImageIndex: 0,
      imageUrl: undefined,
      imageHint: undefined
    };
    return migratedProduct;
  }
  
  return product;
}

/**
 * Actualiza la imagen principal de un producto
 */
export function setPrimaryImage(product: Product, imageId: string): Product {
  if (!product.images) return product;
  
  const imageIndex = product.images.findIndex(img => img.id === imageId);
  if (imageIndex === -1) return product;
  
  return {
    ...product,
    primaryImageIndex: imageIndex,
    // Actualizar imageUrl para compatibilidad
    imageUrl: product.images[imageIndex].url,
    imageHint: product.images[imageIndex].alt
  };
}

/**
 * Reordena las imágenes de un producto
 */
export function reorderProductImages(product: Product, newOrder: string[]): Product {
  if (!product.images) return product;
  
  const reorderedImages = newOrder
    .map(id => product.images!.find(img => img.id === id))
    .filter((img): img is ProductImage => img !== undefined)
    .map((img, index) => ({ ...img, order: index }));
  
  // Actualizar índice de imagen principal si es necesario
  const currentPrimaryId = product.images[product.primaryImageIndex || 0]?.id;
  const newPrimaryIndex = reorderedImages.findIndex(img => img.id === currentPrimaryId);
  
  return {
    ...product,
    images: reorderedImages,
    primaryImageIndex: newPrimaryIndex >= 0 ? newPrimaryIndex : 0,
    // Actualizar imageUrl para compatibilidad
    imageUrl: reorderedImages[newPrimaryIndex >= 0 ? newPrimaryIndex : 0]?.url,
    imageHint: reorderedImages[newPrimaryIndex >= 0 ? newPrimaryIndex : 0]?.alt
  };
}

/**
 * Elimina una imagen de un producto
 */
export function removeProductImage(product: Product, imageId: string): Product {
  if (!product.images) return product;
  
  const filteredImages = product.images
    .filter(img => img.id !== imageId)
    .map((img, index) => ({ ...img, order: index }));
  
  if (filteredImages.length === 0) {
    return {
      ...product,
      images: [],
      primaryImageIndex: 0,
      imageUrl: undefined,
      imageHint: undefined
    };
  }
  
  // Ajustar índice de imagen principal si es necesario
  let newPrimaryIndex = product.primaryImageIndex || 0;
  if (newPrimaryIndex >= filteredImages.length) {
    newPrimaryIndex = 0;
  }
  
  return {
    ...product,
    images: filteredImages,
    primaryImageIndex: newPrimaryIndex,
    // Actualizar imageUrl para compatibilidad
    imageUrl: filteredImages[newPrimaryIndex]?.url,
    imageHint: filteredImages[newPrimaryIndex]?.alt
  };
}