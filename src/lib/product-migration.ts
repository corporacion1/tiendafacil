import { Product, ProductImage } from './types';
import { migrateProductToMultipleImages } from './product-image-utils';

/**
 * Configuración de migración
 */
export const MIGRATION_CONFIG = {
  BATCH_SIZE: 50, // Procesar productos en lotes
  DELAY_BETWEEN_BATCHES: 1000, // 1 segundo entre lotes
  MAX_RETRIES: 3
};

/**
 * Resultado de migración
 */
export interface MigrationResult {
  success: boolean;
  totalProducts: number;
  migratedProducts: number;
  skippedProducts: number;
  failedProducts: number;
  errors: Array<{
    productId: string;
    error: string;
  }>;
  duration: number;
}

/**
 * Estado de migración para seguimiento
 */
export interface MigrationProgress {
  phase: 'preparing' | 'migrating' | 'completed' | 'failed';
  currentBatch: number;
  totalBatches: number;
  processedProducts: number;
  totalProducts: number;
  currentProduct?: string;
  errors: string[];
}

/**
 * Verifica si un producto necesita migración
 */
export function needsMigration(product: Product): boolean {
  // Si ya tiene array de imágenes, no necesita migración
  if (product.images && product.images.length > 0) {
    return false;
  }
  
  // Si tiene imageUrl pero no array de imágenes, necesita migración
  if (product.imageUrl && (!product.images || product.images.length === 0)) {
    return true;
  }
  
  return false;
}

/**
 * Migra un producto individual al nuevo formato
 */
export function migrateProduct(product: Product): Product {
  if (!needsMigration(product)) {
    return product;
  }
  
  return migrateProductToMultipleImages(product);
}

/**
 * Migra múltiples productos
 */
export async function migrateProducts(
  products: Product[],
  onProgress?: (progress: MigrationProgress) => void,
  onProductMigrated?: (product: Product) => Promise<void>
): Promise<MigrationResult> {
  const startTime = Date.now();
  const result: MigrationResult = {
    success: false,
    totalProducts: products.length,
    migratedProducts: 0,
    skippedProducts: 0,
    failedProducts: 0,
    errors: [],
    duration: 0
  };
  
  try {
    // Filtrar productos que necesitan migración
    const productsToMigrate = products.filter(needsMigration);
    const totalBatches = Math.ceil(productsToMigrate.length / MIGRATION_CONFIG.BATCH_SIZE);
    
    result.skippedProducts = products.length - productsToMigrate.length;
    
    if (onProgress) {
      onProgress({
        phase: 'preparing',
        currentBatch: 0,
        totalBatches,
        processedProducts: 0,
        totalProducts: productsToMigrate.length,
        errors: []
      });
    }
    
    // Procesar en lotes
    for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
      const startIndex = batchIndex * MIGRATION_CONFIG.BATCH_SIZE;
      const endIndex = Math.min(startIndex + MIGRATION_CONFIG.BATCH_SIZE, productsToMigrate.length);
      const batch = productsToMigrate.slice(startIndex, endIndex);
      
      if (onProgress) {
        onProgress({
          phase: 'migrating',
          currentBatch: batchIndex + 1,
          totalBatches,
          processedProducts: startIndex,
          totalProducts: productsToMigrate.length,
          errors: result.errors.map(e => e.error)
        });
      }
      
      // Procesar productos del lote
      for (const product of batch) {
        try {
          if (onProgress) {
            onProgress({
              phase: 'migrating',
              currentBatch: batchIndex + 1,
              totalBatches,
              processedProducts: result.migratedProducts + result.failedProducts,
              totalProducts: productsToMigrate.length,
              currentProduct: product.name,
              errors: result.errors.map(e => e.error)
            });
          }
          
          const migratedProduct = migrateProduct(product);
          
          // Guardar producto migrado si se proporciona callback
          if (onProductMigrated) {
            await onProductMigrated(migratedProduct);
          }
          
          result.migratedProducts++;
        } catch (error) {
          console.error(`Error migrando producto ${product.id}:`, error);
          result.failedProducts++;
          result.errors.push({
            productId: product.id,
            error: error instanceof Error ? error.message : 'Error desconocido'
          });
        }
      }
      
      // Pausa entre lotes para no sobrecargar el sistema
      if (batchIndex < totalBatches - 1) {
        await new Promise(resolve => setTimeout(resolve, MIGRATION_CONFIG.DELAY_BETWEEN_BATCHES));
      }
    }
    
    result.success = result.failedProducts === 0;
    result.duration = Date.now() - startTime;
    
    if (onProgress) {
      onProgress({
        phase: result.success ? 'completed' : 'failed',
        currentBatch: totalBatches,
        totalBatches,
        processedProducts: result.migratedProducts + result.failedProducts,
        totalProducts: productsToMigrate.length,
        errors: result.errors.map(e => e.error)
      });
    }
    
  } catch (error) {
    console.error('Error durante la migración:', error);
    result.success = false;
    result.duration = Date.now() - startTime;
    result.errors.push({
      productId: 'MIGRATION_PROCESS',
      error: error instanceof Error ? error.message : 'Error crítico durante la migración'
    });
    
    if (onProgress) {
      onProgress({
        phase: 'failed',
        currentBatch: 0,
        totalBatches: 0,
        processedProducts: 0,
        totalProducts: 0,
        errors: result.errors.map(e => e.error)
      });
    }
  }
  
  return result;
}

/**
 * Migra productos de una tienda específica
 */
export async function migrateStoreProducts(
  storeId: string,
  onProgress?: (progress: MigrationProgress) => void
): Promise<MigrationResult> {
  try {
    // Obtener productos de la tienda
    const response = await fetch(`/api/products?storeId=${storeId}&includeAll=true`);
    if (!response.ok) {
      throw new Error('Error al obtener productos de la tienda');
    }
    
    const products: Product[] = await response.json();
    
    // Migrar productos con callback para guardar cambios
    return await migrateProducts(
      products,
      onProgress,
      async (migratedProduct) => {
        // Guardar producto migrado en la base de datos
        const updateResponse = await fetch(`/api/products/${migratedProduct.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(migratedProduct)
        });
        
        if (!updateResponse.ok) {
          throw new Error(`Error al actualizar producto ${migratedProduct.id}`);
        }
      }
    );
  } catch (error) {
    console.error('Error migrando productos de la tienda:', error);
    throw error;
  }
}

/**
 * Verifica el estado de migración de una tienda
 */
export async function checkMigrationStatus(storeId: string): Promise<{
  totalProducts: number;
  migratedProducts: number;
  pendingProducts: number;
  migrationComplete: boolean;
}> {
  try {
    const response = await fetch(`/api/products?storeId=${storeId}&includeAll=true`);
    if (!response.ok) {
      throw new Error('Error al obtener productos');
    }
    
    const products: Product[] = await response.json();
    
    const totalProducts = products.length;
    const pendingProducts = products.filter(needsMigration).length;
    const migratedProducts = totalProducts - pendingProducts;
    
    return {
      totalProducts,
      migratedProducts,
      pendingProducts,
      migrationComplete: pendingProducts === 0
    };
  } catch (error) {
    console.error('Error verificando estado de migración:', error);
    throw error;
  }
}

/**
 * Rollback de migración (volver al formato anterior)
 */
export function rollbackProduct(product: Product): Product {
  // Si no tiene imágenes, no hay nada que hacer
  if (!product.images || product.images.length === 0) {
    return product;
  }
  
  // Obtener la imagen principal
  const primaryIndex = product.primaryImageIndex || 0;
  const primaryImage = product.images[primaryIndex] || product.images[0];
  
  // Crear producto con formato anterior
  return {
    ...product,
    imageUrl: primaryImage.url,
    imageHint: primaryImage.alt,
    images: undefined,
    primaryImageIndex: undefined
  };
}

/**
 * Rollback de múltiples productos
 */
export async function rollbackProducts(
  products: Product[],
  onProgress?: (progress: MigrationProgress) => void,
  onProductRolledBack?: (product: Product) => Promise<void>
): Promise<MigrationResult> {
  const startTime = Date.now();
  const result: MigrationResult = {
    success: false,
    totalProducts: products.length,
    migratedProducts: 0,
    skippedProducts: 0,
    failedProducts: 0,
    errors: [],
    duration: 0
  };
  
  try {
    // Filtrar productos que tienen el nuevo formato
    const productsToRollback = products.filter(p => p.images && p.images.length > 0);
    const totalBatches = Math.ceil(productsToRollback.length / MIGRATION_CONFIG.BATCH_SIZE);
    
    result.skippedProducts = products.length - productsToRollback.length;
    
    // Procesar en lotes
    for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
      const startIndex = batchIndex * MIGRATION_CONFIG.BATCH_SIZE;
      const endIndex = Math.min(startIndex + MIGRATION_CONFIG.BATCH_SIZE, productsToRollback.length);
      const batch = productsToRollback.slice(startIndex, endIndex);
      
      if (onProgress) {
        onProgress({
          phase: 'migrating',
          currentBatch: batchIndex + 1,
          totalBatches,
          processedProducts: startIndex,
          totalProducts: productsToRollback.length,
          errors: result.errors.map(e => e.error)
        });
      }
      
      // Procesar productos del lote
      for (const product of batch) {
        try {
          const rolledBackProduct = rollbackProduct(product);
          
          if (onProductRolledBack) {
            await onProductRolledBack(rolledBackProduct);
          }
          
          result.migratedProducts++;
        } catch (error) {
          console.error(`Error en rollback del producto ${product.id}:`, error);
          result.failedProducts++;
          result.errors.push({
            productId: product.id,
            error: error instanceof Error ? error.message : 'Error desconocido'
          });
        }
      }
      
      // Pausa entre lotes
      if (batchIndex < totalBatches - 1) {
        await new Promise(resolve => setTimeout(resolve, MIGRATION_CONFIG.DELAY_BETWEEN_BATCHES));
      }
    }
    
    result.success = result.failedProducts === 0;
    result.duration = Date.now() - startTime;
    
    if (onProgress) {
      onProgress({
        phase: result.success ? 'completed' : 'failed',
        currentBatch: totalBatches,
        totalBatches,
        processedProducts: result.migratedProducts + result.failedProducts,
        totalProducts: productsToRollback.length,
        errors: result.errors.map(e => e.error)
      });
    }
    
  } catch (error) {
    console.error('Error durante el rollback:', error);
    result.success = false;
    result.duration = Date.now() - startTime;
  }
  
  return result;
}