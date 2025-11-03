import { Product, ProductImage, ImageDebugInfo } from './types';
import { getAllProductImages, hasMultipleImages, getImageCount, getPrimaryImageUrl } from './product-image-utils';
import { getDisplayImageUrl } from './utils';

/**
 * Detecta si estamos en ambiente local o producción
 */
export function detectEnvironment(): 'local' | 'production' {
  if (typeof window === 'undefined') return 'production'; // SSR
  
  const hostname = window.location.hostname;
  const isLocal = hostname === 'localhost' || 
                  hostname === '127.0.0.1' || 
                  hostname.startsWith('192.168.') ||
                  hostname.endsWith('.local');
  
  return isLocal ? 'local' : 'production';
}

/**
 * Genera información de debug completa para un producto
 */
export function generateImageDebugInfo(product: Product): ImageDebugInfo {
  const errors: string[] = [];
  
  try {
    const images = getAllProductImages(product);
    const primaryImageUrl = getPrimaryImageUrl(product);
    const allImageUrls = images.map(img => img.url);
    const displayUrls: string[] = [];
    
    // Generar URLs de display y capturar errores
    for (const imageUrl of allImageUrls) {
      try {
        const displayUrl = getDisplayImageUrl(imageUrl);
        displayUrls.push(displayUrl || '');
        if (!displayUrl) {
          errors.push(`Failed to generate display URL for: ${imageUrl}`);
        }
      } catch (error) {
        errors.push(`Error generating display URL for ${imageUrl}: ${error}`);
        displayUrls.push('');
      }
    }
    
    // Validaciones adicionales
    if (product.images && product.images.length > 0 && !primaryImageUrl) {
      errors.push('Product has images array but no primary image URL');
    }
    
    if (product.imageUrl && !product.images) {
      errors.push('Product has legacy imageUrl but no images array');
    }
    
    return {
      productId: product.id,
      productName: product.name,
      environment: detectEnvironment(),
      issues: errors,
      details: {
        imageCount: getImageCount(product),
        primaryImageUrl,
        allImageUrls,
        displayUrls,
        hasMultipleImages: hasMultipleImages(product),
      },
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    errors.push(`Critical error generating debug info: ${error}`);
    
    return {
      productId: product.id,
      productName: product.name,
      environment: detectEnvironment(),
      issues: errors,
      details: {
        imageCount: 0,
        primaryImageUrl: undefined,
        allImageUrls: [],
        displayUrls: [],
        hasMultipleImages: false,
      },
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Log detallado de información de imágenes de un producto
 */
export function logProductImageDebug(product: Product, context: string = 'Unknown'): ImageDebugInfo {
  const debugInfo = generateImageDebugInfo(product);
  
  console.group(`🖼️ [${context}] Image Debug - ${product.name} (${debugInfo.environment})`);
  console.log('Product ID:', debugInfo.productId);
  console.log('Environment:', debugInfo.environment);
  console.log('Image Count:', debugInfo.details.imageCount);
  console.log('Has Multiple:', debugInfo.details.hasMultipleImages);
  console.log('Primary URL:', debugInfo.details.primaryImageUrl);
  console.log('All URLs:', debugInfo.details.allImageUrls);
  console.log('Display URLs:', debugInfo.details.displayUrls);
  
  if (debugInfo.issues.length > 0) {
    console.warn('Errors:', debugInfo.issues);
  }
  
  // Log del producto completo para debugging
  console.log('Full Product Data:', {
    id: product.id,
    name: product.name,
    imageUrl: product.imageUrl,
    imageHint: product.imageHint,
    images: product.images,
    primaryImageIndex: product.primaryImageIndex
  });
  
  console.groupEnd();
  
  return debugInfo;
}

/**
 * Valida la accesibilidad de una URL de imagen
 * Actualizado para manejar imágenes base64 almacenadas en DB
 */
export async function validateImageUrl(url: string): Promise<boolean> {
  if (!url) return false;
  
  // Para imágenes base64, validar el formato
  if (url.startsWith('data:image')) {
    try {
      const parts = url.split(',');
      if (parts.length !== 2) return false;
      
      const base64Data = parts[1];
      if (!base64Data || base64Data.length < 100) return false;
      
      // Intentar crear una imagen para validar que el base64 sea válido
      return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve(true);
        img.onerror = () => resolve(false);
        img.src = url;
      });
    } catch (error) {
      console.warn(`Base64 image validation failed:`, error);
      return false;
    }
  }
  
  // Para URLs externas (legacy), usar fetch
  try {
    const response = await fetch(url, { method: 'HEAD' });
    return response.ok;
  } catch (error) {
    console.warn(`External URL validation failed for ${url}:`, error);
    return false;
  }
}

/**
 * Valida todas las URLs de imágenes de un producto
 */
export async function validateProductImages(product: Product): Promise<{
  valid: string[];
  invalid: string[];
  errors: string[];
}> {
  const debugInfo = generateImageDebugInfo(product);
  const valid: string[] = [];
  const invalid: string[] = [];
  const errors: string[] = [...debugInfo.issues];
  
  for (const url of debugInfo.details.displayUrls) {
    if (!url) {
      invalid.push('(empty URL)');
      continue;
    }
    
    try {
      const isValid = await validateImageUrl(url);
      if (isValid) {
        valid.push(url);
      } else {
        invalid.push(url);
      }
    } catch (error) {
      invalid.push(url);
      errors.push(`Validation error for ${url}: ${error}`);
    }
  }
  
  return { valid, invalid, errors };
}

/**
 * Compara el comportamiento de imágenes entre dos productos (útil para debugging)
 */
export function compareProductImages(product1: Product, product2: Product): {
  differences: string[];
  similarities: string[];
} {
  const debug1 = generateImageDebugInfo(product1);
  const debug2 = generateImageDebugInfo(product2);
  
  const differences: string[] = [];
  const similarities: string[] = [];
  
  if (debug1.details.imageCount !== debug2.details.imageCount) {
    differences.push(`Image count: ${debug1.productName}(${debug1.details.imageCount}) vs ${debug2.productName}(${debug2.details.imageCount})`);
  } else {
    similarities.push(`Both have ${debug1.details.imageCount} images`);
  }
  
  if (debug1.details.hasMultipleImages !== debug2.details.hasMultipleImages) {
    differences.push(`Multiple images: ${debug1.productName}(${debug1.details.hasMultipleImages}) vs ${debug2.productName}(${debug2.details.hasMultipleImages})`);
  } else {
    similarities.push(`Both have multiple images: ${debug1.details.hasMultipleImages}`);
  }
  
  if (debug1.issues.length !== debug2.issues.length) {
    differences.push(`Error count: ${debug1.productName}(${debug1.issues.length}) vs ${debug2.productName}(${debug2.issues.length})`);
  }
  
  return { differences, similarities };
}