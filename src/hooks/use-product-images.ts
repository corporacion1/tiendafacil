import { useMemo } from 'react';
import { Product, ProductImage } from '@/lib/types';
import { 
  getAllProductImages, 
  hasMultipleImages, 
  getImageCount, 
  getPrimaryImageUrl,
  getPrimaryThumbnailUrl 
} from '@/lib/product-image-utils';

/**
 * Hook personalizado para manejar imágenes de productos con compatibilidad automática
 */
export function useProductImages(product: Product) {
  const images = useMemo(() => getAllProductImages(product), [product]);
  
  const primaryImageUrl = useMemo(() => getPrimaryImageUrl(product), [product]);
  
  const primaryThumbnailUrl = useMemo(() => getPrimaryThumbnailUrl(product), [product]);
  
  const hasMultiple = useMemo(() => hasMultipleImages(product), [product]);
  
  const imageCount = useMemo(() => getImageCount(product), [product]);
  
  const isEmpty = useMemo(() => images.length === 0, [images]);
  
  // Obtener imagen por índice con fallback
  const getImageByIndex = useMemo(() => {
    return (index: number): ProductImage | undefined => {
      return images[index] || images[0];
    };
  }, [images]);
  
  // Obtener URLs de todas las imágenes
  const imageUrls = useMemo(() => {
    return images.map(img => img.url);
  }, [images]);
  
  // Obtener URLs de todos los thumbnails
  const thumbnailUrls = useMemo(() => {
    return images.map(img => img.thumbnailUrl || img.url);
  }, [images]);
  
  return {
    // Datos básicos
    images,
    primaryImageUrl,
    primaryThumbnailUrl,
    imageCount,
    hasMultiple,
    isEmpty,
    
    // Funciones utilitarias
    getImageByIndex,
    imageUrls,
    thumbnailUrls,
    
    // Compatibilidad con código existente
    imageUrl: primaryImageUrl, // Alias para compatibilidad
    imageHint: images[0]?.alt || product.imageHint
  };
}

/**
 * Hook para manejar múltiples productos con imágenes
 */
export function useProductsImages(products: Product[]) {
  const productsWithImages = useMemo(() => {
    return products.map(product => ({
      ...product,
      ...useProductImages(product)
    }));
  }, [products]);
  
  const totalImages = useMemo(() => {
    return products.reduce((total, product) => total + getImageCount(product), 0);
  }, [products]);
  
  const productsWithMultipleImages = useMemo(() => {
    return products.filter(hasMultipleImages);
  }, [products]);
  
  const productsWithoutImages = useMemo(() => {
    return products.filter(product => getImageCount(product) === 0);
  }, [products]);
  
  return {
    productsWithImages,
    totalImages,
    productsWithMultipleImages,
    productsWithoutImages,
    hasProductsWithMultipleImages: productsWithMultipleImages.length > 0,
    hasProductsWithoutImages: productsWithoutImages.length > 0
  };
}

/**
 * Hook para precargar imágenes de productos
 */
export function usePreloadProductImages(products: Product[], priority: boolean = false) {
  useMemo(() => {
    if (typeof window === 'undefined') return;
    
    products.forEach(product => {
      const images = getAllProductImages(product);
      
      // Precargar imagen principal
      if (images.length > 0) {
        const img = new Image();
        img.src = images[0].url;
        
        // Precargar thumbnail si existe
        if (images[0].thumbnailUrl) {
          const thumb = new Image();
          thumb.src = images[0].thumbnailUrl;
        }
        
        // Si es prioritario, precargar todas las imágenes
        if (priority && images.length > 1) {
          images.slice(1).forEach(image => {
            const additionalImg = new Image();
            additionalImg.src = image.url;
          });
        }
      }
    });
  }, [products, priority]);
}

/**
 * Hook para optimizar la carga de imágenes según el viewport
 */
export function useOptimizedImageLoading(product: Product, isVisible: boolean = true) {
  const { images, primaryImageUrl, primaryThumbnailUrl } = useProductImages(product);
  
  // Determinar qué imagen cargar según la visibilidad y el dispositivo
  const optimizedImageUrl = useMemo(() => {
    if (!isVisible) return null;
    
    // En móviles, usar thumbnail si está disponible
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      return primaryThumbnailUrl || primaryImageUrl;
    }
    
    return primaryImageUrl;
  }, [isVisible, primaryImageUrl, primaryThumbnailUrl]);
  
  // Precargar imágenes adicionales cuando sea visible
  useMemo(() => {
    if (!isVisible || typeof window === 'undefined') return;
    
    // Precargar imágenes adicionales con delay
    if (images.length > 1) {
      setTimeout(() => {
        images.slice(1, 3).forEach(image => { // Solo las siguientes 2 imágenes
          const img = new Image();
          img.src = image.url;
        });
      }, 1000);
    }
  }, [isVisible, images]);
  
  return {
    optimizedImageUrl,
    shouldLoadAdditional: isVisible && images.length > 1
  };
}