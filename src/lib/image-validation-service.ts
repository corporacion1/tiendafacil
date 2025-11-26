import { Product, ImageDebugInfo } from './types';
import { generateImageDebugInfo, validateImageUrl } from './image-debug-utils';

export interface ImageValidationResult {
  isValid: boolean;
  validUrls: string[];
  invalidUrls: string[];
  errors: string[];
  debugInfo: ImageDebugInfo;
  loadingStates: Record<string, 'loading' | 'loaded' | 'error'>;
}

export interface ImageLoadingState {
  url: string;
  status: 'loading' | 'loaded' | 'error';
  error?: string;
  loadTime?: number;
}

export class ImageValidationService {
  private loadingStates: Map<string, ImageLoadingState> = new Map();
  private validationCache: Map<string, boolean> = new Map();
  
  /**
   * Valida todas las imágenes de un producto
   */
  async validateProductImages(product: Product): Promise<ImageValidationResult> {
    const debugInfo = generateImageDebugInfo(product);
    const validUrls: string[] = [];
    const invalidUrls: string[] = [];
    const errors: string[] = [...debugInfo.issues];
    const loadingStates: Record<string, 'loading' | 'loaded' | 'error'> = {};
    
    console.group(`🔍 [ImageValidation] Validating images for ${product.name}`);
    console.log('Environment:', debugInfo.environment);
    console.log('URLs to validate:', debugInfo.details.displayUrls);
    
    // Validar cada URL
    for (const url of debugInfo.details.displayUrls) {
      if (!url) {
        invalidUrls.push('(empty URL)');
        loadingStates[url] = 'error';
        errors.push('Empty URL found');
        continue;
      }
      
      try {
        loadingStates[url] = 'loading';
        const startTime = Date.now();
        
        // Usar caché si está disponible
        let isValid = this.validationCache.get(url);
        if (isValid === undefined) {
          isValid = await this.validateUrlWithTimeout(url, 5000);
          this.validationCache.set(url, isValid);
        }
        
        const loadTime = Date.now() - startTime;
        
        if (isValid) {
          validUrls.push(url);
          loadingStates[url] = 'loaded';
          console.log(`✅ Valid: ${url} (${loadTime}ms)`);
        } else {
          invalidUrls.push(url);
          loadingStates[url] = 'error';
          errors.push(`URL not accessible: ${url}`);
          console.warn(`❌ Invalid: ${url} (${loadTime}ms)`);
        }
        
        // Actualizar estado de carga
        this.loadingStates.set(url, {
          url,
          status: isValid ? 'loaded' : 'error',
          loadTime,
          error: isValid ? undefined : 'URL not accessible'
        });
        
      } catch (error) {
        invalidUrls.push(url);
        loadingStates[url] = 'error';
        const errorMessage = `Validation error for ${url}: ${error}`;
        errors.push(errorMessage);
        console.error(`💥 Error: ${errorMessage}`);
        
        this.loadingStates.set(url, {
          url,
          status: 'error',
          error: String(error)
        });
      }
    }
    
    const isValid = validUrls.length > 0 && invalidUrls.length === 0;
    
    console.log(`Validation complete: ${validUrls.length} valid, ${invalidUrls.length} invalid`);
    console.groupEnd();
    
    return {
      isValid,
      validUrls,
      invalidUrls,
      errors,
      debugInfo,
      loadingStates
    };
  }
  
  /**
   * Valida una URL con timeout
   */
  private async validateUrlWithTimeout(url: string, timeout: number = 5000): Promise<boolean> {
    return Promise.race([
      validateImageUrl(url),
      new Promise<boolean>((_, reject) => 
        setTimeout(() => reject(new Error('Timeout')), timeout)
      )
    ]).catch(() => false);
  }
  
  /**
   * Obtiene el estado de carga de una URL
   */
  getLoadingState(url: string): ImageLoadingState | undefined {
    return this.loadingStates.get(url);
  }
  
  /**
   * Limpia la caché de validación
   */
  clearCache(): void {
    this.validationCache.clear();
    this.loadingStates.clear();
  }
  
  /**
   * Prevalida las imágenes de múltiples productos
   */
  async prevalidateProducts(products: Product[]): Promise<Map<string, ImageValidationResult>> {
    const results = new Map<string, ImageValidationResult>();
    
    console.group(`🚀 [ImageValidation] Prevalidating ${products.length} products`);
    
    for (const product of products) {
      try {
        const result = await this.validateProductImages(product);
        results.set(product.id, result);
      } catch (error) {
        console.error(`Error prevalidating product ${product.name}:`, error);
      }
    }
    
    console.groupEnd();
    return results;
  }
  
  /**
   * Genera un reporte de validación para debugging
   */
  generateValidationReport(results: Map<string, ImageValidationResult>): {
    totalProducts: number;
    validProducts: number;
    invalidProducts: number;
    totalErrors: number;
    environmentStats: Record<string, number>;
    commonErrors: string[];
  } {
    const report = {
      totalProducts: results.size,
      validProducts: 0,
      invalidProducts: 0,
      totalErrors: 0,
      environmentStats: {} as Record<string, number>,
      commonErrors: [] as string[]
    };
    
    const errorCounts = new Map<string, number>();
    
    for (const [productId, result] of results) {
      if (result.isValid) {
        report.validProducts++;
      } else {
        report.invalidProducts++;
      }
      
      report.totalErrors += result.errors.length;
      
      // Estadísticas por ambiente
      const env = result.debugInfo.environment;
      report.environmentStats[env] = (report.environmentStats[env] || 0) + 1;
      
      // Contar errores comunes
      for (const error of result.errors) {
        errorCounts.set(error, (errorCounts.get(error) || 0) + 1);
      }
    }
    
    // Obtener errores más comunes
    report.commonErrors = Array.from(errorCounts.entries())
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([error]) => error);
    
    return report;
  }
}

// Instancia singleton del servicio
export const imageValidationService = new ImageValidationService();