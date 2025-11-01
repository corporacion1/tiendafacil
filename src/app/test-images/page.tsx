"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MultiImageUpload } from '@/components/multi-image-upload';
import { useSettings } from '@/contexts/settings-context';
import { Product, ProductImage } from '@/lib/types';

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
      addLog(`✅ Producto seleccionado: ${products[0].name} (ID: ${products[0].id})`);
    }
  }, [products]);

  const handleImagesChange = (newImages: ProductImage[]) => {
    addLog(`🔄 Imágenes actualizadas: ${newImages.length} imágenes`);
    if (testProduct) {
      setTestProduct({
        ...testProduct,
        images: newImages
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
        }
      }
    } catch (error) {
      addLog(`❌ Error refrescando: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      <h1 className="text-3xl font-bold">Test: Múltiples Imágenes</h1>
      
      {testProduct && (
        <Card>
          <CardHeader>
            <CardTitle>Producto de Prueba</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <strong>Nombre:</strong> {testProduct.name}
              </div>
              <div>
                <strong>ID:</strong> {testProduct.id}
              </div>
              <div>
                <strong>Store ID:</strong> {activeStoreId}
              </div>
              <div>
                <strong>Imágenes actuales:</strong> {testProduct.images?.length || 0}
              </div>
            </div>
            
            <Button onClick={refreshProduct} variant="outline">
              Refrescar desde BD
            </Button>
          </CardContent>
        </Card>
      )}

      {testProduct && (
        <Card>
          <CardHeader>
            <CardTitle>Subir Imágenes</CardTitle>
          </CardHeader>
          <CardContent>
            <MultiImageUpload
              productId={testProduct.id}
              existingImages={testProduct.images || []}
              maxImages={4}
              onImagesChange={handleImagesChange}
              onError={handleError}
            />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Log de Actividad</CardTitle>
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