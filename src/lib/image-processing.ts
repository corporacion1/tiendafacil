/**
 * Configuración de procesamiento de imágenes
 */
export const IMAGE_PROCESSING_CONFIG = {
  // Configuración de compresión
  COMPRESSION_QUALITY: 0.85, // 85% de calidad para JPEG
  MAX_COMPRESSED_WIDTH: 1200,
  MAX_COMPRESSED_HEIGHT: 1200,
  
  // Configuración de thumbnails
  THUMBNAIL_SIZE: 150,
  THUMBNAIL_QUALITY: 0.8,
  
  // Configuración de imágenes responsivas
  RESPONSIVE_SIZES: [
    { name: 'small', width: 300, height: 300 },
    { name: 'medium', width: 600, height: 600 },
    { name: 'large', width: 1200, height: 1200 }
  ]
};

/**
 * Resultado del procesamiento de imagen
 */
export interface ProcessedImage {
  original: File;
  compressed?: File;
  thumbnail?: File;
  responsiveImages?: { [key: string]: File };
  dimensions: { width: number; height: number };
}

/**
 * Redimensiona una imagen manteniendo la proporción
 */
function calculateResizeDimensions(
  originalWidth: number,
  originalHeight: number,
  maxWidth: number,
  maxHeight: number
): { width: number; height: number } {
  let { width, height } = { width: originalWidth, height: originalHeight };
  
  // Si la imagen es más pequeña que el máximo, no redimensionar
  if (width <= maxWidth && height <= maxHeight) {
    return { width, height };
  }
  
  // Calcular la proporción
  const aspectRatio = width / height;
  
  if (width > height) {
    // Imagen horizontal
    width = Math.min(width, maxWidth);
    height = width / aspectRatio;
    
    if (height > maxHeight) {
      height = maxHeight;
      width = height * aspectRatio;
    }
  } else {
    // Imagen vertical o cuadrada
    height = Math.min(height, maxHeight);
    width = height * aspectRatio;
    
    if (width > maxWidth) {
      width = maxWidth;
      height = width / aspectRatio;
    }
  }
  
  return {
    width: Math.round(width),
    height: Math.round(height)
  };
}

/**
 * Redimensiona una imagen usando Canvas
 */
function resizeImageWithCanvas(
  file: File,
  targetWidth: number,
  targetHeight: number,
  quality: number = 0.85
): Promise<File> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    if (!ctx) {
      reject(new Error('No se pudo crear el contexto del canvas'));
      return;
    }
    
    img.onload = () => {
      // Configurar el canvas con las nuevas dimensiones
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      
      // Dibujar la imagen redimensionada
      ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
      
      // Convertir a blob
      canvas.toBlob(
        (blob) => {
          if (blob) {
            const extension = file.name.substring(file.name.lastIndexOf('.'));
            const baseName = file.name.substring(0, file.name.lastIndexOf('.'));
            const newFile = new File([blob], `${baseName}_resized${extension}`, {
              type: blob.type,
              lastModified: Date.now()
            });
            resolve(newFile);
          } else {
            reject(new Error('Error al generar la imagen redimensionada'));
          }
        },
        file.type === 'image/png' ? 'image/png' : 'image/jpeg',
        quality
      );
    };
    
    img.onerror = () => {
      reject(new Error('Error al cargar la imagen'));
    };
    
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Comprime una imagen reduciendo su tamaño y calidad
 */
export async function compressImage(file: File): Promise<File> {
  try {
    // Obtener dimensiones originales
    const img = new Image();
    const originalDimensions = await new Promise<{ width: number; height: number }>((resolve, reject) => {
      img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
      img.onerror = () => reject(new Error('Error al cargar la imagen'));
      img.src = URL.createObjectURL(file);
    });
    
    // Calcular nuevas dimensiones
    const newDimensions = calculateResizeDimensions(
      originalDimensions.width,
      originalDimensions.height,
      IMAGE_PROCESSING_CONFIG.MAX_COMPRESSED_WIDTH,
      IMAGE_PROCESSING_CONFIG.MAX_COMPRESSED_HEIGHT
    );
    
    // Si no necesita redimensionamiento y el archivo ya es pequeño, devolverlo tal como está
    if (
      newDimensions.width === originalDimensions.width &&
      newDimensions.height === originalDimensions.height &&
      file.size <= 1024 * 1024 // 1MB
    ) {
      return file;
    }
    
    // Redimensionar y comprimir
    const compressedFile = await resizeImageWithCanvas(
      file,
      newDimensions.width,
      newDimensions.height,
      IMAGE_PROCESSING_CONFIG.COMPRESSION_QUALITY
    );
    
    return compressedFile;
  } catch (error) {
    console.error('Error comprimiendo imagen:', error);
    // Si hay error, devolver el archivo original
    return file;
  }
}

/**
 * Genera un thumbnail de una imagen
 */
export async function generateThumbnail(file: File): Promise<File> {
  try {
    const thumbnailFile = await resizeImageWithCanvas(
      file,
      IMAGE_PROCESSING_CONFIG.THUMBNAIL_SIZE,
      IMAGE_PROCESSING_CONFIG.THUMBNAIL_SIZE,
      IMAGE_PROCESSING_CONFIG.THUMBNAIL_QUALITY
    );
    
    // Cambiar el nombre del archivo para indicar que es un thumbnail
    const extension = file.name.substring(file.name.lastIndexOf('.'));
    const baseName = file.name.substring(0, file.name.lastIndexOf('.'));
    
    return new File([thumbnailFile], `${baseName}_thumb${extension}`, {
      type: thumbnailFile.type,
      lastModified: Date.now()
    });
  } catch (error) {
    console.error('Error generando thumbnail:', error);
    throw error;
  }
}

/**
 * Genera múltiples tamaños de una imagen para uso responsivo
 */
export async function generateResponsiveImages(file: File): Promise<{ [key: string]: File }> {
  const responsiveImages: { [key: string]: File } = {};
  
  try {
    // Obtener dimensiones originales
    const img = new Image();
    const originalDimensions = await new Promise<{ width: number; height: number }>((resolve, reject) => {
      img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
      img.onerror = () => reject(new Error('Error al cargar la imagen'));
      img.src = URL.createObjectURL(file);
    });
    
    // Generar cada tamaño
    for (const size of IMAGE_PROCESSING_CONFIG.RESPONSIVE_SIZES) {
      const newDimensions = calculateResizeDimensions(
        originalDimensions.width,
        originalDimensions.height,
        size.width,
        size.height
      );
      
      // Solo generar si es diferente del original
      if (
        newDimensions.width !== originalDimensions.width ||
        newDimensions.height !== originalDimensions.height
      ) {
        const resizedFile = await resizeImageWithCanvas(
          file,
          newDimensions.width,
          newDimensions.height,
          IMAGE_PROCESSING_CONFIG.COMPRESSION_QUALITY
        );
        
        const extension = file.name.substring(file.name.lastIndexOf('.'));
        const baseName = file.name.substring(0, file.name.lastIndexOf('.'));
        
        responsiveImages[size.name] = new File(
          [resizedFile],
          `${baseName}_${size.name}${extension}`,
          {
            type: resizedFile.type,
            lastModified: Date.now()
          }
        );
      }
    }
    
    return responsiveImages;
  } catch (error) {
    console.error('Error generando imágenes responsivas:', error);
    return {};
  }
}

/**
 * Procesa una imagen completa: compresión, thumbnail y versiones responsivas
 */
export async function processImage(file: File): Promise<ProcessedImage> {
  try {
    // Obtener dimensiones originales
    const img = new Image();
    const dimensions = await new Promise<{ width: number; height: number }>((resolve, reject) => {
      img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
      img.onerror = () => reject(new Error('Error al cargar la imagen'));
      img.src = URL.createObjectURL(file);
    });
    
    // Procesar en paralelo
    const [compressed, thumbnail, responsiveImages] = await Promise.all([
      compressImage(file).catch(() => undefined),
      generateThumbnail(file).catch(() => undefined),
      generateResponsiveImages(file).catch(() => ({}))
    ]);
    
    return {
      original: file,
      compressed,
      thumbnail,
      responsiveImages,
      dimensions
    };
  } catch (error) {
    console.error('Error procesando imagen:', error);
    throw error;
  }
}

/**
 * Procesa múltiples imágenes
 */
export async function processMultipleImages(
  files: File[],
  onProgress?: (processed: number, total: number) => void
): Promise<ProcessedImage[]> {
  const results: ProcessedImage[] = [];
  
  for (let i = 0; i < files.length; i++) {
    try {
      const processed = await processImage(files[i]);
      results.push(processed);
      
      if (onProgress) {
        onProgress(i + 1, files.length);
      }
    } catch (error) {
      console.error(`Error procesando imagen ${files[i].name}:`, error);
      // Continuar con las demás imágenes
    }
  }
  
  return results;
}

/**
 * Convierte un File a base64 para preview
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Error al convertir archivo a base64'));
      }
    };
    reader.onerror = () => reject(new Error('Error al leer el archivo'));
    reader.readAsDataURL(file);
  });
}

/**
 * Optimiza una imagen para web (combina compresión y formato)
 */
export async function optimizeImageForWeb(file: File): Promise<File> {
  try {
    // Si es PNG y es grande, convertir a JPEG para mejor compresión
    if (file.type === 'image/png' && file.size > 2 * 1024 * 1024) { // 2MB
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      return new Promise((resolve, reject) => {
        img.onload = () => {
          if (!ctx) {
            reject(new Error('No se pudo crear contexto de canvas'));
            return;
          }
          
          canvas.width = img.naturalWidth;
          canvas.height = img.naturalHeight;
          
          // Fondo blanco para PNG con transparencia
          ctx.fillStyle = 'white';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0);
          
          canvas.toBlob(
            (blob) => {
              if (blob) {
                const baseName = file.name.substring(0, file.name.lastIndexOf('.'));
                const optimizedFile = new File([blob], `${baseName}.jpg`, {
                  type: 'image/jpeg',
                  lastModified: Date.now()
                });
                resolve(optimizedFile);
              } else {
                reject(new Error('Error al optimizar imagen'));
              }
            },
            'image/jpeg',
            IMAGE_PROCESSING_CONFIG.COMPRESSION_QUALITY
          );
        };
        
        img.onerror = () => reject(new Error('Error al cargar imagen'));
        img.src = URL.createObjectURL(file);
      });
    }
    
    // Para otros casos, solo comprimir
    return await compressImage(file);
  } catch (error) {
    console.error('Error optimizando imagen:', error);
    return file;
  }
}