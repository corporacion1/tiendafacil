/**
 * Utilidades para debuggear imágenes en la base de datos
 */

export interface DatabaseImageDebugResult {
  productId: string;
  productName: string;
  storeId: string;
  databaseData: {
    hasLegacyImageUrl: boolean;
    legacyImageUrl: string | undefined;
    hasImagesArray: boolean;
    imagesArrayLength: number;
    primaryImageIndex: number | undefined;
    rawImagesData: any[];
  };
  issues: string[];
  recommendations: string[];
}

/**
 * Verifica el estado de las imágenes de un producto directamente en la base de datos
 */
export async function debugProductImagesInDatabase(productId: string, storeId: string): Promise<DatabaseImageDebugResult> {
  const issues: string[] = [];
  const recommendations: string[] = [];
  
  try {
    console.group(`🔍 [DB Debug] Checking product ${productId} in database`);
    
    // Hacer consulta directa a la base de datos
    const response = await fetch(`/api/products/${productId}/debug?storeId=${storeId}`);
    
    if (!response.ok) {
      issues.push(`Failed to fetch product debug info: ${response.status}`);
      console.error('❌ Failed to fetch debug info');
      console.groupEnd();
      
      return {
        productId,
        productName: 'Unknown',
        storeId,
        databaseData: {
          hasLegacyImageUrl: false,
          legacyImageUrl: undefined,
          hasImagesArray: false,
          imagesArrayLength: 0,
          primaryImageIndex: undefined,
          rawImagesData: []
        },
        issues,
        recommendations
      };
    }
    
    const debugData = await response.json();
    console.log('📊 Database debug data:', debugData);
    
    const databaseData = {
      hasLegacyImageUrl: !!debugData.imageUrl,
      legacyImageUrl: debugData.imageUrl,
      hasImagesArray: debugData.hasImagesArray,
      imagesArrayLength: debugData.imagesCount,
      primaryImageIndex: debugData.primaryImageIndex,
      rawImagesData: debugData.images || []
    };
    
    // Análisis de problemas
    if (!databaseData.hasImagesArray && !databaseData.hasLegacyImageUrl) {
      issues.push('Product has no images in database (neither legacy imageUrl nor images array)');
      recommendations.push('Add images to this product');
    }
    
    if (databaseData.hasLegacyImageUrl && !databaseData.hasImagesArray) {
      issues.push('Product still uses legacy imageUrl format');
      recommendations.push('Migrate this product to use images array format');
    }
    
    if (databaseData.hasImagesArray && databaseData.imagesArrayLength === 0) {
      issues.push('Product has images array but it is empty');
      recommendations.push('Remove empty images array or add images');
    }
    
    if (databaseData.hasImagesArray && databaseData.imagesArrayLength > 1 && databaseData.primaryImageIndex === undefined) {
      issues.push('Product has multiple images but no primary image index set');
      recommendations.push('Set primaryImageIndex for this product');
    }
    
    // Validar URLs de imágenes (ahora esperamos base64)
    for (let i = 0; i < databaseData.rawImagesData.length; i++) {
      const image = databaseData.rawImagesData[i];
      if (!image.url) {
        issues.push(`Image ${i} has no URL`);
      } else if (!image.url.startsWith('data:image')) {
        issues.push(`Image ${i} is not base64 encoded (expected format for DB storage)`);
        recommendations.push('Images should be stored as base64 in database');
      } else {
        // Validar que el base64 sea válido
        try {
          const base64Data = image.url.split(',')[1];
          if (!base64Data || base64Data.length < 100) {
            issues.push(`Image ${i} has invalid or too short base64 data`);
          }
        } catch (error) {
          issues.push(`Image ${i} has malformed base64 data`);
        }
      }
    }
    
    console.log('Issues found:', issues);
    console.log('Recommendations:', recommendations);
    console.groupEnd();
    
    return {
      productId,
      productName: debugData.name || 'Unknown',
      storeId,
      databaseData,
      issues,
      recommendations
    };
    
  } catch (error) {
    console.error('❌ Error debugging product images in database:', error);
    issues.push(`Error fetching database info: ${error}`);
    console.groupEnd();
    
    return {
      productId,
      productName: 'Unknown',
      storeId,
      databaseData: {
        hasLegacyImageUrl: false,
        legacyImageUrl: undefined,
        hasImagesArray: false,
        imagesArrayLength: 0,
        primaryImageIndex: undefined,
        rawImagesData: []
      },
      issues,
      recommendations
    };
  }
}

/**
 * Compara los datos de la base de datos con lo que se muestra en el frontend
 */
export async function compareDbWithFrontend(product: any, storeId: string): Promise<{
  databaseResult: DatabaseImageDebugResult;
  frontendData: {
    imageUrl: string | undefined;
    images: any[];
    primaryImageIndex: number | undefined;
  };
  discrepancies: string[];
}> {
  const databaseResult = await debugProductImagesInDatabase(product.id, storeId);
  
  const frontendData = {
    imageUrl: product.imageUrl,
    images: product.images || [],
    primaryImageIndex: product.primaryImageIndex
  };
  
  const discrepancies: string[] = [];
  
  // Comparar datos
  if (databaseResult.databaseData.hasLegacyImageUrl !== !!frontendData.imageUrl) {
    discrepancies.push(`Legacy imageUrl mismatch: DB=${databaseResult.databaseData.hasLegacyImageUrl}, Frontend=${!!frontendData.imageUrl}`);
  }
  
  if (databaseResult.databaseData.imagesArrayLength !== frontendData.images.length) {
    discrepancies.push(`Images array length mismatch: DB=${databaseResult.databaseData.imagesArrayLength}, Frontend=${frontendData.images.length}`);
  }
  
  if (databaseResult.databaseData.primaryImageIndex !== frontendData.primaryImageIndex) {
    discrepancies.push(`Primary image index mismatch: DB=${databaseResult.databaseData.primaryImageIndex}, Frontend=${frontendData.primaryImageIndex}`);
  }
  
  console.group(`🔍 [DB vs Frontend] Comparison for ${product.name}`);
  console.log('Database data:', databaseResult.databaseData);
  console.log('Frontend data:', frontendData);
  console.log('Discrepancies:', discrepancies);
  console.groupEnd();
  
  return {
    databaseResult,
    frontendData,
    discrepancies
  };
}

/**
 * Función para debuggear múltiples productos
 */
export async function debugMultipleProductsInDatabase(products: any[], storeId: string): Promise<{
  results: DatabaseImageDebugResult[];
  summary: {
    totalProducts: number;
    productsWithIssues: number;
    productsWithLegacyImages: number;
    productsWithMultipleImages: number;
    productsWithoutImages: number;
    commonIssues: string[];
  };
}> {
  console.group(`🔍 [DB Debug] Checking ${products.length} products in database`);
  
  const results: DatabaseImageDebugResult[] = [];
  
  for (const product of products) {
    const result = await debugProductImagesInDatabase(product.id, storeId);
    results.push(result);
  }
  
  const summary = {
    totalProducts: results.length,
    productsWithIssues: results.filter(r => r.issues.length > 0).length,
    productsWithLegacyImages: results.filter(r => r.databaseData.hasLegacyImageUrl && !r.databaseData.hasImagesArray).length,
    productsWithMultipleImages: results.filter(r => r.databaseData.imagesArrayLength > 1).length,
    productsWithoutImages: results.filter(r => !r.databaseData.hasLegacyImageUrl && !r.databaseData.hasImagesArray).length,
    commonIssues: [] as string[]
  };
  
  // Encontrar problemas comunes
  const issueCount = new Map<string, number>();
  results.forEach(result => {
    result.issues.forEach(issue => {
      issueCount.set(issue, (issueCount.get(issue) || 0) + 1);
    });
  });
  
  summary.commonIssues = Array.from(issueCount.entries())
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([issue]) => issue);
  
  console.log('Database debug summary:', summary);
  console.groupEnd();
  
  return { results, summary };
}