"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MultiImageUpload } from '@/components/multi-image-upload';
import { ProductImageGallery } from '@/components/product-image-gallery';
import { useSettings } from '@/contexts/settings-context';
import { Product, ProductImage } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function TestImagesPage() {
  const { activeStoreId, products } = useSettings();
  const [testProduct, setTestProduct] = useState<Product | null>(null);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `${timestamp}: ${message}`]);
    console.log(message);
  };

  useEffect(() => {
    if (products && products.length > 0) {
      setTestProduct(products[0]);
      addLog(`✅ Producto seleccionado automáticamente: ${products[0].name}`);
    }
  }, [products]);

  const handleProductSelect = (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (product) {
      setTestProduct(product);
      addLog(`🔄 Producto cambiado: ${product.name} (${product.images?.length || 0} imágenes)`);
    }
  };

  const handleImagesChange = (newImages: ProductImage[]) => {
    addLog(`🔄 Imágenes actualizadas: ${newImages.length} imágenes`);
    if (testProduct) {
      setTestProduct({
        ...testProduct,
        images: newImages,
        imageUrl: newImages.length > 0 ? newImages[0].url : testProduct.imageUrl,
        imageHint: newImages.length > 0 ? newImages[0].alt : testProduct.imageHint
      });
    }
  };

  const handleError = (error: string) => {
    addLog(`❌ Error: ${error}`);
  };

  const refreshProduct = async () => {
    if (!testProduct || !activeStoreId) return;

    addLog('🔄 Refrescando producto desde BD...');
    
    try {
      const response = await fetch(`/api/products?storeId=${activeStoreId}`);
      if (response.ok) {
        const products = await response.json();
        const updated = products.find((p: Product) => p.id === testProduct.id);
        if (updated) {
          setTestProduct(updated);
          addLog(`✅ Producto refrescado: ${updated.images?.length || 0} imágenes en BD`);
          addLog(`📊 Imagen principal: ${updated.imageUrl ? 'Sí' : 'No'}`);
        }
      }
    } catch (error) {
      addLog(`❌ Error refrescando: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  };

  const clearLogs = () => {
    setLogs([]);
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">🧪 Test: Múltiples Imágenes</h1>
        <Badge variant="outline" className="text-lg px-4 py-2">
          MongoDB + Base64
        </Badge>
      </div>
      
      {/* Selector de producto */}
      <Card>
        <CardHeader>
          <CardTitle>Seleccionar Producto</CardTitle>
        </CardHeader>
        <CardContent>
          <Select onValueChange={handleProductSelect} value={testProduct?.id || ""}>
            <SelectTrigger>
              <SelectValue placeholder="Selecciona un producto para probar..." />
            </SelectTrigger>
            <SelectContent>
              {products.map(product => (
                <SelectItem key={product.id} value={product.id}>
                  {product.name} ({product.images?.length || 0} imágenes)
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {testProduct && (
        <>
          {/* Info del producto */}
          <Card>
            <CardHeader>
              <CardTitle>Información del Producto</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <strong>Nombre:</strong><br />
                  {testProduct.name}
                </div>
                <div>
                  <strong>ID:</strong><br />
                  <code className="text-sm">{testProduct.id}</code>
                </div>
                <div>
                  <strong>Imagen única:</strong><br />
                  {testProduct.imageUrl ? '✅ Sí' : '❌ No'}
                </div>
                <div>
                  <strong>Múltiples imágenes:</strong><br />
                  {testProduct.images?.length || 0} imágenes
                </div>
              </div>
              
              <Button onClick={refreshProduct} variant="outline">
                🔄 Refrescar desde BD
              </Button>
            </CardContent>
          </Card>

          {/* Galería actual */}
          {testProduct.images && testProduct.images.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Galería Actual</CardTitle>
              </CardHeader>
              <CardContent>
                <ProductImageGallery product={testProduct} />
              </CardContent>
            </Card>
          )}

          {/* Subir imágenes */}
          <Card>
            <CardHeader>
              <CardTitle>Agregar Más Imágenes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4 p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>💡 Instrucciones:</strong>
                </p>
                <ul className="text-sm text-blue-700 mt-2 space-y-1">
                  <li>• Máximo 2MB por imagen (para MongoDB)</li>
                  <li>• Formatos: JPG, PNG, WebP</li>
                  <li>• Hasta 4 imágenes total por producto</li>
                  <li>• Las imágenes se guardan como base64 en la BD</li>
                </ul>
              </div>
              
              <MultiImageUpload
                productId={testProduct.id}
                existingImages={testProduct.images || []}
                maxImages={4}
                onImagesChange={handleImagesChange}
                onError={handleError}
              />
            </CardContent>
          </Card>
        </>
      )}

      {/* Log de actividad */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Log de Actividad
            <Button onClick={clearLogs} variant="outline" size="sm">
              Limpiar
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-gray-100 p-4 rounded-lg max-h-96 overflow-y-auto">
            {logs.length === 0 ? (
              <p className="text-gray-500">No hay actividad aún...</p>
            ) : (
              <div className="space-y-1 font-mono text-sm">
                {logs.map((log, index) => (
                  <div key={index} className={
                    log.includes('❌') ? 'text-red-600' :
                    log.includes('✅') ? 'text-green-600' :
                    log.includes('🔄') ? 'text-blue-600' :
                    'text-gray-700'
                  }>
                    {log}
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