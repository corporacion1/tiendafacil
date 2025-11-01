/**
 * Configuración de validación de imágenes
 */
export const IMAGE_VALIDATION_CONFIG = {
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB en bytes
  MAX_IMAGES_PER_PRODUCT: 4,
  ALLOWED_FORMATS: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  ALLOWED_EXTENSIONS: ['.jpg', '.jpeg', '.png', '.webp'],
  MIN_DIMENSIONS: { width: 100, height: 100 },
  MAX_DIMENSIONS: { width: 4000, height: 4000 }
};

/**
 * Resultado de validación de imagen
 */
export interface ImageValidationResult {
  isValid: boolean;
  errors: string[];
  warnings?: string[];
}

/**
 * Información de imagen extraída del archivo
 */
export interface ImageInfo {
  file: File;
  dimensions?: { width: number; height: number };
  size: number;
  type: string;
  name: string;
}

/**
 * Valida el tamaño de un archivo de imagen
 */
export function validateFileSize(file: File): ImageValidationResult {
  const errors: string[] = [];
  
  if (file.size > IMAGE_VALIDATION_CONFIG.MAX_FILE_SIZE) {
    const maxSizeMB = IMAGE_VALIDATION_CONFIG.MAX_FILE_SIZE / (1024 * 1024);
    const fileSizeMB = (file.size / (1024 * 1024)).toFixed(1);
    errors.push(`El archivo es demasiado grande (${fileSizeMB}MB). El tamaño máximo permitido es ${maxSizeMB}MB.`);
  }
  
  if (file.size === 0) {
    errors.push('El archivo está vacío.');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Valida el formato de un archivo de imagen
 */
export function validateImageFormat(file: File): ImageValidationResult {
  const errors: string[] = [];
  
  // Validar MIME type
  if (!IMAGE_VALIDATION_CONFIG.ALLOWED_FORMATS.includes(file.type)) {
    errors.push(`Formato no soportado (${file.type}). Formatos permitidos: JPG, PNG, WebP.`);
  }
  
  // Validar extensión del archivo
  const extension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
  if (!IMAGE_VALIDATION_CONFIG.ALLOWED_EXTENSIONS.includes(extension)) {
    errors.push(`Extensión no válida (${extension}). Extensiones permitidas: .jpg, .jpeg, .png, .webp.`);
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Obtiene las dimensiones de una imagen desde un archivo
 */
export function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({
        width: img.naturalWidth,
        height: img.naturalHeight
      });
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('No se pudo cargar la imagen para obtener sus dimensiones'));
    };
    
    img.src = url;
  });
}

/**
 * Valida las dimensiones de una imagen
 */
export function validateImageDimensions(dimensions: { width: number; height: number }): ImageValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  const { MIN_DIMENSIONS, MAX_DIMENSIONS } = IMAGE_VALIDATION_CONFIG;
  
  // Validar dimensiones mínimas
  if (dimensions.width < MIN_DIMENSIONS.width || dimensions.height < MIN_DIMENSIONS.height) {
    errors.push(`La imagen es demasiado pequeña (${dimensions.width}x${dimensions.height}). Tamaño mínimo: ${MIN_DIMENSIONS.width}x${MIN_DIMENSIONS.height}px.`);
  }
  
  // Validar dimensiones máximas
  if (dimensions.width > MAX_DIMENSIONS.width || dimensions.height > MAX_DIMENSIONS.height) {
    errors.push(`La imagen es demasiado grande (${dimensions.width}x${dimensions.height}). Tamaño máximo: ${MAX_DIMENSIONS.width}x${MAX_DIMENSIONS.height}px.`);
  }
  
  // Advertencias para imágenes muy pequeñas o con proporciones extrañas
  if (dimensions.width < 300 || dimensions.height < 300) {
    warnings.push('La imagen es pequeña. Se recomienda usar imágenes de al menos 300x300px para mejor calidad.');
  }
  
  const aspectRatio = dimensions.width / dimensions.height;
  if (aspectRatio > 3 || aspectRatio < 0.33) {
    warnings.push('La imagen tiene una proporción inusual. Se recomienda usar imágenes más cuadradas para mejor visualización.');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Valida un archivo de imagen completo
 */
export async function validateImageFile(file: File): Promise<ImageValidationResult> {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Validar tamaño del archivo
  const sizeValidation = validateFileSize(file);
  errors.push(...sizeValidation.errors);
  
  // Validar formato
  const formatValidation = validateImageFormat(file);
  errors.push(...formatValidation.errors);
  
  // Si hay errores básicos, no continuar con validaciones más complejas
  if (errors.length > 0) {
    return { isValid: false, errors, warnings };
  }
  
  try {
    // Validar dimensiones
    const dimensions = await getImageDimensions(file);
    const dimensionsValidation = validateImageDimensions(dimensions);
    errors.push(...dimensionsValidation.errors);
    if (dimensionsValidation.warnings) {
      warnings.push(...dimensionsValidation.warnings);
    }
  } catch (error) {
    errors.push('No se pudo procesar la imagen. Asegúrate de que sea un archivo de imagen válido.');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Valida múltiples archivos de imagen
 */
export async function validateMultipleImageFiles(files: File[], existingImagesCount: number = 0): Promise<{
  validFiles: File[];
  invalidFiles: { file: File; errors: string[] }[];
  warnings: string[];
}> {
  const validFiles: File[] = [];
  const invalidFiles: { file: File; errors: string[] }[] = [];
  const warnings: string[] = [];
  
  // Validar número total de imágenes
  const totalImages = files.length + existingImagesCount;
  if (totalImages > IMAGE_VALIDATION_CONFIG.MAX_IMAGES_PER_PRODUCT) {
    const excess = totalImages - IMAGE_VALIDATION_CONFIG.MAX_IMAGES_PER_PRODUCT;
    warnings.push(`Solo se pueden agregar ${IMAGE_VALIDATION_CONFIG.MAX_IMAGES_PER_PRODUCT} imágenes por producto. Se ignorarán ${excess} imagen(es).`);
  }
  
  // Validar cada archivo individualmente
  const filesToProcess = files.slice(0, IMAGE_VALIDATION_CONFIG.MAX_IMAGES_PER_PRODUCT - existingImagesCount);
  
  for (const file of filesToProcess) {
    try {
      const validation = await validateImageFile(file);
      
      if (validation.isValid) {
        validFiles.push(file);
        if (validation.warnings) {
          warnings.push(...validation.warnings.map(w => `${file.name}: ${w}`));
        }
      } else {
        invalidFiles.push({
          file,
          errors: validation.errors
        });
      }
    } catch (error) {
      invalidFiles.push({
        file,
        errors: [`Error procesando ${file.name}: ${error instanceof Error ? error.message : 'Error desconocido'}`]
      });
    }
  }
  
  return {
    validFiles,
    invalidFiles,
    warnings
  };
}

/**
 * Formatea el tamaño de archivo en formato legible
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

/**
 * Genera un nombre de archivo único para evitar conflictos
 */
export function generateUniqueFileName(originalName: string, productId: string): string {
  const timestamp = Date.now();
  const extension = originalName.substring(originalName.lastIndexOf('.'));
  const baseName = originalName.substring(0, originalName.lastIndexOf('.')).replace(/[^a-zA-Z0-9]/g, '-');
  
  return `${productId}-${baseName}-${timestamp}${extension}`;
}