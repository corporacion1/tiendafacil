/**
 * Utilidades específicas para verificar el almacenamiento de imágenes en la base de datos
 */

export interface DbImageVerificationResult {
  productId: string;
  productName: string;
  storeId: string;
  verification: {
    hasImagesInDb: boolean;
    imageCount: number;
    allImagesAreBase64: boolean;
    imagesHaveValidFormat: boolean;
    primaryImageIndexValid: boolean;
  };
  imageDetails: Array<{
    index: number;
    id: string;
    isBase64: boolean;
    isValid: boolean;
    size: number;
    format: string;
    error?: string;
  }>;
  issues: string[];
  recommendations: string[];
}

/**
 * Verifica que las imágenes se estén guardando correctamente en la base de datos
 */
export async function verifyImagesInDatabase(productId: string, storeId: string): Promise<DbImageVerificationResult> {
  const issues: string[] = [];
  const recommendations: string[] = [];
  const imageDetails: Array<{
    index: number;
    id: string;
    isBase64: boolean;
    isValid: boolean;
    size: number;
    format: string;
    error?: string;
  }> = [];

  try {
    console.group(`🔍 [DB Verification] Checking images for product ${productId}`);
    
    // Obtener datos directamente de la API de debug
    const response = await fetch(`/api/products/${productId}/debug?storeId=${storeId}`);
    
    if (!response.ok) {
      issues.push(`Failed to fetch product from database: ${response.status}`);
      console.error('❌ Failed to fetch product');
      console.groupEnd();
      
      return {
        productId,
        productName: 'Unknown',
        storeId,
        verification: {
          hasImagesInDb: false,
          imageCount: 0,
          allImagesAreBase64: false,
          imagesHaveValidFormat: false,
          primaryImageIndexValid: false
        },
        imageDetails: [],
        issues,
        recommendations
      };
    }
    
    const productData = await response.json();
    console.log('📊 Raw product data from DB:', productData);
    
    const hasImagesInDb = !!(productData.images && productData.images.length > 0);
    const imageCount = productData.images ? productData.images.length : 0;
    
    console.log(`📊 Product has ${imageCount} images in database`);
    
    if (!hasImagesInDb) {
      issues.push('Product has no images array in database');
      recommendations.push('Add images to this product using the image upload functionality');
    }
    
    let allImagesAreBase64 = true;
    let imagesHaveValidFormat = true;
    
    // Verificar cada imagen
    if (productData.images) {
      for (let i = 0; i < productData.images.length; i++) {
        const image = productData.images[i];
        const imageDetail = {
          index: i,
          id: image.id || `unknown-${i}`,
          isBase64: false,
          isValid: false,
          size: 0,
          format: 'unknown',
          error: undefined as string | undefined
        };
        
        try {
          if (!image.url) {
            imageDetail.error = 'No URL provided';
            allImagesAreBase64 = false;
            imagesHaveValidFormat = false;
          } else if (image.url.startsWith('data:image')) {
            imageDetail.isBase64 = true;
            imageDetail.size = image.url.length;
            
            // Extraer formato
            const formatMatch = image.url.match(/data:image\/([^;]+)/);
            if (formatMatch) {
              imageDetail.format = formatMatch[1];
            }
            
            // Validar base64
            const parts = image.url.split(',');
            if (parts.length === 2 && parts[1].length > 100) {
              imageDetail.isValid = true;
            } else {
              imageDetail.error = 'Invalid base64 format or too short';
              imagesHaveValidFormat = false;
            }
          } else {
            imageDetail.error = 'Not a base64 image (unexpected for DB storage)';
            allImagesAreBase64 = false;
            imagesHaveValidFormat = false;
          }
        } catch (error) {
          imageDetail.error = `Error processing image: ${error}`;
          imagesHaveValidFormat = false;
        }
        
        imageDetails.push(imageDetail);
        console.log(`📊 Image ${i}:`, imageDetail);
      }
    }
    
    // Verificar índice de imagen principal
    const primaryImageIndexValid = productData.primaryImageIndex !== undefined && 
                                  productData.primaryImageIndex >= 0 && 
                                  productData.primaryImageIndex < imageCount;
    
    if (imageCount > 1 && !primaryImageIndexValid) {
      issues.push('Primary image index is invalid for multiple images');
      recommendations.push('Set a valid primaryImageIndex');
    }
    
    // Generar issues y recomendaciones
    if (!allImagesAreBase64) {
      issues.push('Not all images are stored as base64 in database');
      recommendations.push('Ensure all images are converted to base64 before saving');
    }
    
    if (!imagesHaveValidFormat) {
      issues.push('Some images have invalid format or data');
      recommendations.push('Validate image data before saving to database');
    }
    
    const verification = {
      hasImagesInDb,
      imageCount,
      allImagesAreBase64,
      imagesHaveValidFormat,
      primaryImageIndexValid
    };
    
    console.log('✅ Verification complete:', verification);
    console.log('Issues:', issues);
    console.log('Recommendations:', recommendations);
    console.groupEnd();
    
    return {
      productId,
      productName: productData.name || 'Unknown',
      storeId,
      verification,
      imageDetails,
      issues,
      recommendations
    };
    
  } catch (error) {
    console.error('❌ Error verifying images in database:', error);
    issues.push(`Error during verification: ${error}`);
    console.groupEnd();
    
    return {
      productId,
      productName: 'Unknown',
      storeId,
      verification: {
        hasImagesInDb: false,
        imageCount: 0,
        allImagesAreBase64: false,
        imagesHaveValidFormat: false,
        primaryImageIndexValid: false
      },
      imageDetails: [],
      issues,
      recommendations
    };
  }
}

/**
 * Función para verificar múltiples productos
 */
export async function verifyMultipleProductsInDatabase(products: any[], storeId: string): Promise<{
  results: DbImageVerificationResult[];
  summary: {
    totalProducts: number;
    productsWithImages: number;
    productsWithValidImages: number;
    productsWithMultipleImages: number;
    totalIssues: number;
    commonIssues: string[];
  };
}> {
  console.group(`🔍 [DB Verification] Checking ${products.length} products`);
  
  const results: DbImageVerificationResult[] = [];
  
  for (const product of products) {
    const result = await verifyImagesInDatabase(product.id, storeId);
    results.push(result);
  }
  
  const summary = {
    totalProducts: results.length,
    productsWithImages: results.filter(r => r.verification.hasImagesInDb).length,
    productsWithValidImages: results.filter(r => r.verification.hasImagesInDb && r.verification.imagesHaveValidFormat).length,
    productsWithMultipleImages: results.filter(r => r.verification.imageCount > 1).length,
    totalIssues: results.reduce((sum, r) => sum + r.issues.length, 0),
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
  
  console.log('Database verification summary:', summary);
  console.groupEnd();
  
  return { results, summary };
}