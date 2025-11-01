import { Product } from './types';
import { getAllProductImages, hasMultipleImages, getImageCount, getPrimaryImageUrl } from './product-image-utils';
import { getDisplayImageUrl, validateAndFixImageUrl } from './utils';
import { detectEnvironment, generateImageDebugInfo } from './image-debug-utils';

export interface ConsistencyValidationResult {
  productId: string;
  productName: string;
  environment: string;
  isConsistent: boolean;
  issues: string[];
  warnings: string[];
  imageData: {
    imageCount: number;
    hasMultiple: boolean;
    primaryUrl: string | undefined;
    allUrls: string[];
    displayUrls: string[];
    validatedUrls: string[];
  };
}

/**
 * Valida la consistencia de las funciones de utilidad de imágenes para un producto
 */
export function validateImageUtilityConsistency(product: Product): ConsistencyValidationResult {
  const issues: string[] = [];
  const warnings: string[] = [];
  const environment = detectEnvironment();
  
  console.group(`🔍 [ConsistencyValidator] Validating ${product.name} in ${environment}`);
  
  try {
    // Test basic utility functions
    const images = getAllProductImages(product);
    const hasMultiple = hasMultipleImages(product);
    const imageCount = getImageCount(product);
    const primaryUrl = getPrimaryImageUrl(product);
    
    console.log('Basic utilities:', { imageCount, hasMultiple, primaryUrl });
    
    // Validate consistency between functions
    if (images.length !== imageCount) {
      issues.push(`Image count mismatch: getAllProductImages returned ${images.length} but getImageCount returned ${imageCount}`);
    }
    
    if ((images.length > 1) !== hasMultiple) {
      issues.push(`Multiple images detection mismatch: ${images.length} images but hasMultipleImages returned ${hasMultiple}`);
    }
    
    if (images.length > 0 && !primaryUrl) {
      issues.push('Product has images but no primary URL returned');
    }
    
    if (images.length === 0 && primaryUrl) {
      warnings.push('Product has primary URL but no images array');
    }
    
    // Test URL generation
    const allUrls = images.map(img => img.url);
    const displayUrls = allUrls.map(url => getDisplayImageUrl(url));
    const validatedUrls = allUrls.map(url => validateAndFixImageUrl(url));
    
    console.log('URL processing:', { allUrls, displayUrls, validatedUrls });
    
    // Check for empty URLs
    const emptyDisplayUrls = displayUrls.filter(url => !url).length;
    const emptyValidatedUrls = validatedUrls.filter(url => !url).length;
    
    if (emptyDisplayUrls > 0) {
      issues.push(`${emptyDisplayUrls} URLs became empty after getDisplayImageUrl processing`);
    }
    
    if (emptyValidatedUrls > 0) {
      issues.push(`${emptyValidatedUrls} URLs became empty after validateAndFixImageUrl processing`);
    }
    
    // Environment-specific checks
    if (environment === 'production') {
      // Check for HTTP URLs in production
      const httpUrls = validatedUrls.filter(url => url.startsWith('http:'));
      if (httpUrls.length > 0) {
        warnings.push(`${httpUrls.length} URLs still use HTTP in production: ${httpUrls.join(', ')}`);
      }
    }
    
    // Check for malformed URLs
    for (const url of validatedUrls) {
      if (url) {
        try {
          new URL(url);
        } catch (error) {
          issues.push(`Malformed URL: ${url}`);
        }
      }
    }
    
    const result: ConsistencyValidationResult = {
      productId: product.id,
      productName: product.name,
      environment,
      isConsistent: issues.length === 0,
      issues,
      warnings,
      imageData: {
        imageCount,
        hasMultiple,
        primaryUrl,
        allUrls,
        displayUrls,
        validatedUrls
      }
    };
    
    if (issues.length > 0) {
      console.error('❌ Consistency issues found:', issues);
    }
    
    if (warnings.length > 0) {
      console.warn('⚠️ Warnings:', warnings);
    }
    
    if (issues.length === 0) {
      console.log('✅ All consistency checks passed');
    }
    
    console.groupEnd();
    return result;
    
  } catch (error) {
    console.error('💥 Error during consistency validation:', error);
    console.groupEnd();
    
    return {
      productId: product.id,
      productName: product.name,
      environment,
      isConsistent: false,
      issues: [`Critical error during validation: ${error}`],
      warnings: [],
      imageData: {
        imageCount: 0,
        hasMultiple: false,
        primaryUrl: undefined,
        allUrls: [],
        displayUrls: [],
        validatedUrls: []
      }
    };
  }
}

/**
 * Valida la consistencia para múltiples productos
 */
export function validateMultipleProductsConsistency(products: Product[]): {
  results: ConsistencyValidationResult[];
  summary: {
    totalProducts: number;
    consistentProducts: number;
    inconsistentProducts: number;
    totalIssues: number;
    totalWarnings: number;
    commonIssues: string[];
    environmentStats: Record<string, number>;
  };
} {
  console.group(`🔍 [ConsistencyValidator] Validating ${products.length} products`);
  
  const results = products.map(product => validateImageUtilityConsistency(product));
  
  const summary = {
    totalProducts: products.length,
    consistentProducts: results.filter(r => r.isConsistent).length,
    inconsistentProducts: results.filter(r => !r.isConsistent).length,
    totalIssues: results.reduce((sum, r) => sum + r.issues.length, 0),
    totalWarnings: results.reduce((sum, r) => sum + r.warnings.length, 0),
    commonIssues: [] as string[],
    environmentStats: {} as Record<string, number>
  };
  
  // Count common issues
  const issueCount = new Map<string, number>();
  results.forEach(result => {
    result.issues.forEach(issue => {
      issueCount.set(issue, (issueCount.get(issue) || 0) + 1);
    });
    
    // Environment stats
    summary.environmentStats[result.environment] = 
      (summary.environmentStats[result.environment] || 0) + 1;
  });
  
  // Get most common issues
  summary.commonIssues = Array.from(issueCount.entries())
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([issue]) => issue);
  
  console.log('Validation Summary:', summary);
  console.groupEnd();
  
  return { results, summary };
}

/**
 * Compara la consistencia entre dos ambientes (útil para debugging)
 */
export function compareEnvironmentConsistency(
  localResults: ConsistencyValidationResult[],
  productionResults: ConsistencyValidationResult[]
): {
  differences: string[];
  similarities: string[];
  onlyInLocal: string[];
  onlyInProduction: string[];
} {
  const differences: string[] = [];
  const similarities: string[] = [];
  const onlyInLocal: string[] = [];
  const onlyInProduction: string[] = [];
  
  // Create maps for easy lookup
  const localMap = new Map(localResults.map(r => [r.productId, r]));
  const prodMap = new Map(productionResults.map(r => [r.productId, r]));
  
  // Compare products that exist in both environments
  for (const [productId, localResult] of localMap) {
    const prodResult = prodMap.get(productId);
    
    if (!prodResult) {
      onlyInLocal.push(`Product ${localResult.productName} (${productId})`);
      continue;
    }
    
    // Compare image counts
    if (localResult.imageData.imageCount !== prodResult.imageData.imageCount) {
      differences.push(
        `${localResult.productName}: Image count differs (local: ${localResult.imageData.imageCount}, prod: ${prodResult.imageData.imageCount})`
      );
    } else {
      similarities.push(`${localResult.productName}: Same image count (${localResult.imageData.imageCount})`);
    }
    
    // Compare consistency status
    if (localResult.isConsistent !== prodResult.isConsistent) {
      differences.push(
        `${localResult.productName}: Consistency differs (local: ${localResult.isConsistent}, prod: ${prodResult.isConsistent})`
      );
    }
  }
  
  // Find products only in production
  for (const [productId, prodResult] of prodMap) {
    if (!localMap.has(productId)) {
      onlyInProduction.push(`Product ${prodResult.productName} (${productId})`);
    }
  }
  
  return { differences, similarities, onlyInLocal, onlyInProduction };
}