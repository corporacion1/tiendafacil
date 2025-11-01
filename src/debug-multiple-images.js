// Script de debug para múltiples imágenes
// Ejecutar en la consola del navegador para diagnosticar problemas

console.log('🔍 [DEBUG] Iniciando diagnóstico de múltiples imágenes...');

// 1. Verificar que las utilidades están disponibles
try {
  const utils = require('@/lib/product-image-utils');
  console.log('✅ [DEBUG] Utilidades de imagen disponibles:', Object.keys(utils));
} catch (error) {
  console.error('❌ [DEBUG] Error cargando utilidades:', error);
}

// 2. Verificar un producto de ejemplo
async function testProduct() {
  try {
    // Obtener productos de la API
    const response = await fetch('/api/products');
    const products = await response.json();
    
    console.log('📦 [DEBUG] Productos encontrados:', products.length);
    
    if (products.length > 0) {
      const firstProduct = products[0];
      console.log('🔍 [DEBUG] Primer producto:', {
        id: firstProduct.id,
        name: firstProduct.name,
        imageUrl: firstProduct.imageUrl,
        images: firstProduct.images,
        hasImages: !!firstProduct.images,
        imagesCount: firstProduct.images?.length || 0
      });
      
      // Probar las utilidades
      if (typeof getAllProductImages !== 'undefined') {
        const allImages = getAllProductImages(firstProduct);
        console.log('🖼️ [DEBUG] getAllProductImages result:', allImages);
        
        const hasMultiple = hasMultipleImages(firstProduct);
        console.log('🔢 [DEBUG] hasMultipleImages result:', hasMultiple);
        
        const imageCount = getImageCount(firstProduct);
        console.log('📊 [DEBUG] getImageCount result:', imageCount);
      }
    }
  } catch (error) {
    console.error('❌ [DEBUG] Error en test:', error);
  }
}

// 3. Verificar el endpoint de API
async function testAPI() {
  try {
    console.log('🌐 [DEBUG] Probando endpoint de API...');
    
    // Crear FormData de prueba
    const formData = new FormData();
    formData.append('storeId', 'ST-1234567890123'); // ID de tienda por defecto
    
    // Crear un archivo de prueba (1x1 pixel PNG)
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'red';
    ctx.fillRect(0, 0, 1, 1);
    
    canvas.toBlob(async (blob) => {
      if (blob) {
        const testFile = new File([blob], 'test.png', { type: 'image/png' });
        formData.append('images', testFile);
        
        // Probar con un producto existente
        const productsResponse = await fetch('/api/products');
        const products = await productsResponse.json();
        
        if (products.length > 0) {
          const productId = products[0].id;
          console.log('📤 [DEBUG] Probando subida a producto:', productId);
          
          const uploadResponse = await fetch(`/api/products/${productId}/images`, {
            method: 'POST',
            body: formData
          });
          
          console.log('📥 [DEBUG] Respuesta de subida:', {
            status: uploadResponse.status,
            statusText: uploadResponse.statusText,
            ok: uploadResponse.ok
          });
          
          if (uploadResponse.ok) {
            const result = await uploadResponse.json();
            console.log('✅ [DEBUG] Resultado exitoso:', result);
          } else {
            const errorText = await uploadResponse.text();
            console.error('❌ [DEBUG] Error en subida:', errorText);
          }
        }
      }
    }, 'image/png');
    
  } catch (error) {
    console.error('❌ [DEBUG] Error en test de API:', error);
  }
}

// Ejecutar tests
console.log('🚀 [DEBUG] Ejecutando tests...');
testProduct();
// testAPI(); // Descomenta para probar la API (cuidado, sube archivos reales)

console.log('📋 [DEBUG] Para probar la API, ejecuta: testAPI()');