"use client";

import React, { useState } from 'react';
import { Product } from '@/lib/types';
import { ProductForm } from '@/components/product-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

/**
 * Componente de prueba para verificar que el sistema de múltiples imágenes funciona
 */
export function TestMultipleImages() {
  // Producto de ejemplo con imagen única (formato anterior)
  const [testProduct, setTestProduct] = useState<Product>({
    id: 'test-product-123',
    name: 'Producto de Prueba',
    sku: 'TEST-001',
    stock: 10,
    price: 25.99,
    wholesalePrice: 20.99,
    cost: 15.00,
    status: 'active',
    tax1: true,
    tax2: false,
    description: 'Este es un producto de prueba para verificar múltiples imágenes',
    createdAt: new Date().toISOString(),
    storeId: 'test-store',
    type: 'product',
    affectsInventory: true,
    
    // Formato anterior (solo una imagen)
    imageUrl: 'https://via.placeholder.com/400x400/3B82F6/FFFFFF?text=Imagen+Original',
    imageHint: 'Imagen original del producto'
    
    // Nota: No tiene campos 'images' ni 'primaryImageIndex'
    // El ProductForm debería migrar automáticamente este producto
  });

  const [showForm, setShowForm] = useState(false);

  const handleSubmit = async (data: any) => {
    console.log('📝 Datos del formulario:', data);
    
    // Verificar que se mantiene compatibilidad
    console.log('🔍 Verificación de compatibilidad:');
    console.log('- imageUrl:', data.imageUrl);
    console.log('- imageHint:', data.imageHint);
    console.log('- images array:', data.images);
    console.log('- primaryImageIndex:', data.primaryImageIndex);
    
    // Actualizar el producto de prueba
    setTestProduct(data);
    setShowForm(false);
    
    return true;
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Prueba de Múltiples Imágenes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold mb-2">Estado Actual del Producto:</h3>
              <div className="text-sm space-y-1 bg-muted/20 p-3 rounded">
                <p><strong>Nombre:</strong> {testProduct.name}</p>
                <p><strong>SKU:</strong> {testProduct.sku}</p>
                <p><strong>Imagen URL:</strong> {testProduct.imageUrl ? 'Sí' : 'No'}</p>
                <p><strong>Array de imágenes:</strong> {testProduct.images ? `${testProduct.images.length} imágenes` : 'No definido'}</p>
                <p><strong>Formato:</strong> {testProduct.images ? 'Múltiples imágenes' : 'Imagen única (legacy)'}</p>
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold mb-2">Imagen Actual:</h3>
              {testProduct.imageUrl && (
                <img 
                  src={testProduct.imageUrl} 
                  alt={testProduct.imageHint || testProduct.name}
                  className="w-full max-w-[200px] h-auto rounded border"
                />
              )}
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button onClick={() => setShowForm(true)}>
              Editar Producto (Probar Múltiples Imágenes)
            </Button>
            
            <Button 
              variant="outline" 
              onClick={() => {
                // Reset al formato original
                setTestProduct({
                  ...testProduct,
                  imageUrl: 'https://via.placeholder.com/400x400/10B981/FFFFFF?text=Reset+Original',
                  imageHint: 'Imagen reseteada',
                  images: undefined,
                  primaryImageIndex: undefined
                });
              }}
            >
              Reset a Imagen Única
            </Button>
          </div>
          
          {testProduct.images && testProduct.images.length > 0 && (
            <div>
              <h3 className="font-semibold mb-2">Imágenes Actuales ({testProduct.images.length}):</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {testProduct.images.map((image, index) => (
                  <div key={image.id} className="relative">
                    <img 
                      src={image.url} 
                      alt={image.alt || `Imagen ${index + 1}`}
                      className="w-full aspect-square object-cover rounded border"
                    />
                    <div className="absolute top-1 left-1 bg-black/70 text-white text-xs px-1 rounded">
                      {index + 1}
                    </div>
                    {index === (testProduct.primaryImageIndex || 0) && (
                      <div className="absolute top-1 right-1 bg-blue-500 text-white text-xs px-1 rounded">
                        Principal
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Formulario de Edición</CardTitle>
          </CardHeader>
          <CardContent>
            <ProductForm
              product={testProduct}
              onSubmit={handleSubmit}
              onCancel={() => setShowForm(false)}
            />
          </CardContent>
        </Card>
      )}
      
      <Card>
        <CardHeader>
          <CardTitle>Instrucciones de Prueba</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <p><strong>1.</strong> Haz clic en "Editar Producto" para abrir el formulario</p>
            <p><strong>2.</strong> El producto debería migrar automáticamente de imagen única a múltiples imágenes</p>
            <p><strong>3.</strong> Usa el componente MultiImageUpload para agregar hasta 3 imágenes adicionales</p>
            <p><strong>4.</strong> Guarda los cambios y verifica que:</p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>Se mantiene el campo imageUrl para compatibilidad</li>
              <li>Se crea el array images con todas las imágenes</li>
              <li>Se establece primaryImageIndex correctamente</li>
              <li>Las imágenes se muestran en el estado actual</li>
            </ul>
            <p><strong>5.</strong> Usa "Reset a Imagen Única" para probar la migración nuevamente</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}