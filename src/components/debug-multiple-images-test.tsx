"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { MultiImageUpload } from '@/components/multi-image-upload';
import { ProductImageGallery } from '@/components/product-image-gallery';
import { useSettings } from '@/contexts/settings-context';
import { Product, ProductImage } from '@/lib/types';
import { 
  getAllProductImages, 
  hasMultipleImages, 
  getImageCount, 
  getPrimaryImageUrl 
} from '@/lib/product-image-utils';

export function DebugMultipleImagesTest() {
  const { activeStoreId, products } = useSettings();
  const [testProduct, setTestProduct] = useState<Product | null>(null);
  const [testResults, setTestResults] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Seleccionar el primer producto para pruebas
  useEffect(() => {
    if (products && products.length > 0) {
      setTestProduct(products[0]);
      addTestResult(`✅ Producto de prueba seleccionado: ${products[0].name} (ID: ${products[0].id})`);
    }
  }, [products]);

  const addTestResult = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const clearResults = () => {
    setTestResults([]);
  };

  // Test 1: Verificar utilidades de imagen
  const testImageUtils = () => {
    if (!testProduct) {
      addTestResult('❌ No hay producto de prueba');
      return;
    }

    addTestResult('🔍 Probando utilidades de imagen...');
    
    try {
      const allImages = getAllProductImages(testProduct);
      addTestResult(`📊 getAllProductImages: ${allImages.length} imágenes encontradas`);
      
      const hasMultiple = hasMultipleImages(testProduct);
      addTestResult(`🔢 hasMultipleImages: ${hasMultiple}`);
      
      const imageCount = getImageCount(testProduct);
      addTestResult(`📈 getImageCount: ${imageCount}`);
      
      const primaryUrl = getPrimaryImageUrl(testProduct);
      addTestResult(`🖼️ getPrimaryImageUrl: ${primaryUrl ? 'URL encontrada' : 'Sin URL'}`);
      
      // Mostrar estructura del producto
      addTestResult(`📦 Estructura del producto:`);
      addTestResult(`   - imageUrl: ${testProduct.imageUrl ? 'Sí' : 'No'}`);
      addTestResult(`   - images array: ${testProduct.images ? `${testProduct.images.length} elementos` : 'No definido'}`);
      addTestResult(`   - primaryImageIndex: ${testProduct.primaryImageIndex ?? 'No definido'}`);
      
      addTestResult('✅ Test de utilidades completado');
    } catch (error) {
      addTestResult(`❌ Error en utilidades: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  };

  // Test 2: Probar subida de imagen
  const testImageUpload = async () => {
    if (!testProduct || !activeStoreId) {
      addTestResult('❌ Falta producto de prueba o storeId');
      return;
    }

    setIsLoading(true);
    addTestResult('📤 Probando subida de imagen...');

    try {
      // Crear una imagen de prueba (1x1 pixel rojo)
      const canvas = document.createElement('canvas');
      canvas.width = 100;
      canvas.height = 100;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = 'red';
        ctx.fillRect(0, 0, 100, 100);
      }

      // Convertir a blob y luego a File
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((blob) => {
          if (blob) resolve(blob);
        }, 'image/png');
      });

      const testFile = new File([blob], 'test-image.png', { type: 'image/png' });
      addTestResult(`📁 Archivo de prueba creado: ${testFile.name} (${testFile.size} bytes)`);

      // Crear FormData
      const formData = new FormData();
      formData.append('images', testFile);
      formData.append('storeId', activeStoreId);

      addTestResult(`📤 Enviando a: /api/products/${testProduct.id}/images`);

      // Hacer la petición
      const response = await fetch(`/api/products/${testProduct.id}/images`, {
        method: 'POST',
        body: formData
      });

      addTestResult(`📥 Respuesta recibida: ${response.status} ${response.statusText}`);

      if (response.ok) {
        const result = await response.json();
        addTestResult(`✅ Subida exitosa: ${result.imagesAdded} imagen(es) agregada(s)`);
        addTestResult(`📊 Total de imágenes: ${result.totalImages}`);
        
        // Actualizar el producto de prueba con los nuevos datos
        if (result.product) {
          setTestProduct(result.product);
          addTestResult('🔄 Producto actualizado con nuevas imágenes');
        }
      } else {
        const errorText = await response.text();
        addTestResult(`❌ Error en subida: ${errorText}`);
      }
    } catch (error) {
      addTestResult(`❌ Error en test de subida: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Test 3: Verificar producto actualizado
  const testProductRefresh = async () => {
    if (!testProduct || !activeStoreId) {
      addTestResult('❌ Falta producto de prueba o storeId');
      return;
    }

    addTestResult('🔄 Refrescando producto desde la base de datos...');

    try {
      const response = await fetch(`/api/products?storeId=${activeStoreId}`);
      if (response.ok) {
        const products = await response.json();
        const updatedProduct = products.find((p: Product) => p.id === testProduct.id);
        
        if (updatedProduct) {
          setTestProduct(updatedProduct);
          addTestResult('✅ Producto refrescado desde BD');
          addTestResult(`📊 Imágenes en BD: ${updatedProduct.images?.length || 0}`);
          
          // Mostrar detalles de las imágenes
          if (updatedProduct.images && updatedProduct.images.length > 0) {
            updatedProduct.images.forEach((img, index) => {
              addTestResult(`   ${index + 1}. ${img.id} - ${img.alt || 'Sin alt'}`);
            });
          }
        } else {
          addTestResult('❌ Producto no encontrado en la respuesta');
        }
      } else {
        addTestResult(`❌ Error obteniendo productos: ${response.status}`);
      }
    } catch (error) {
      addTestResult(`❌ Error refrescando: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  };

  const handleImagesChange = (newImages: ProductImage[]) => {
    addTestResult(`🔄 MultiImageUpload onChange: ${newImages.length} imágenes`);
    if (testProduct) {
      setTestProduct({
        ...testProduct,
        images: newImages,
        imageUrl: newImages.length > 0 ? newImages[0].url : testProduct.imageUrl,
        imageHint: newImages.length > 0 ? newImages[0].alt : testProduct.imageHint
      });
    }
  };

  const handleImageError = (error: string) => {
    addTestResult(`❌ Error en MultiImageUpload: ${error}`);
  };

  return (
    <div className="space-y-6 p-6">
      <Card>
        <CardHeader>
          <CardTitle>🔧 Debug: Múltiples Imágenes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            <Button onClick={testImageUtils} variant="outline">
              1. Test Utilidades
            </Button>
            <Button 
              onClick={testImageUpload} 
              variant="outline"
              disabled={isLoading || !testProduct}
            >
              {isLoading ? 'Subiendo...' : '2. Test Subida'}
            </Button>
            <Button onClick={testProductRefresh} variant="outline">
              3. Refrescar Producto
            </Button>
            <Button onClick={clearResults} variant="destructive" size="sm">
              Limpiar
            </Button>
          </div>

          {testProduct && (
            <Alert>
              <AlertDescription>
                <strong>Producto de prueba:</strong> {testProduct.name} (ID: {testProduct.id})
                <br />
                <strong>Store ID:</strong> {activeStoreId}
                <br />
                <strong>Imágenes actuales:</strong> {testProduct.images?.length || 0}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Componente MultiImageUpload para pruebas */}
      {testProduct && (
        <Card>
          <CardHeader>
            <CardTitle>📤 Componente MultiImageUpload</CardTitle>
          </CardHeader>
          <CardContent>
            <MultiImageUpload
              productId={testProduct.id}
              existingImages={testProduct.images || []}
              maxImages={4}
              onImagesChange={handleImagesChange}
              onError={handleImageError}
            />
          </CardContent>
        </Card>
      )}

      {/* Galería de imágenes */}
      {testProduct && testProduct.images && testProduct.images.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>🖼️ Galería de Imágenes</CardTitle>
          </CardHeader>
          <CardContent>
            <ProductImageGallery product={testProduct} />
          </CardContent>
        </Card>
      )}

      {/* Log de resultados */}
      <Card>
        <CardHeader>
          <CardTitle>📋 Resultados de Pruebas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-gray-100 p-4 rounded-lg max-h-96 overflow-y-auto">
            {testResults.length === 0 ? (
              <p className="text-gray-500">No hay resultados aún. Ejecuta una prueba.</p>
            ) : (
              <div className="space-y-1 font-mono text-sm">
                {testResults.map((result, index) => (
                  <div key={index} className={
                    result.includes('❌') ? 'text-red-600' :
                    result.includes('✅') ? 'text-green-600' :
                    result.includes('⚠️') ? 'text-yellow-600' :
                    'text-gray-700'
                  }>
                    {result}
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}