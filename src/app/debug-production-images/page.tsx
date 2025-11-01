'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface ProductImage {
  id: string;
  url: string;
  alt?: string;
  order: number;
}

interface Product {
  _id: string;
  id: string;
  name: string;
  images?: ProductImage[];
  imageUrl?: string;
  imageHint?: string;
  primaryImageIndex?: number;
}

export default function DebugProductionImagesPage() {
  const [productId, setProductId] = useState('');
  const [storeId, setStoreId] = useState('');
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadProduct = async () => {
    if (!productId || !storeId) {
      setError('Por favor ingresa productId y storeId');
      return;
    }

    setLoading(true);
    setError('');
    setProduct(null);

    try {
      console.log('🔍 Consultando producto:', { productId, storeId });
      
      // Primero intentar con la API de debug
      const debugResponse = await fetch(`/api/products/${productId}/debug?storeId=${storeId}`);
      const debugData = await debugResponse.json();
      
      console.log('📊 Respuesta de debug API:', debugData);
      
      if (debugResponse.ok) {
        setProduct(debugData.fullDocument);
      } else {
        setError(`Error en debug API: ${debugData.error}`);
      }
      
    } catch (err) {
      console.error('❌ Error:', err);
      setError(`Error de conexión: ${err instanceof Error ? err.message : 'Error desconocido'}`);
    } finally {
      setLoading(false);
    }
  };

  const testImageUpload = async () => {
    if (!productId || !storeId) {
      setError('Por favor ingresa productId y storeId primero');
      return;
    }

    try {
      // Crear una imagen de prueba (1x1 pixel rojo en base64)
      const testImageBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';
      
      // Convertir base64 a File
      const response = await fetch(testImageBase64);
      const blob = await response.blob();
      const file = new File([blob], 'test-image.png', { type: 'image/png' });
      
      const formData = new FormData();
      formData.append('images', file);
      formData.append('storeId', storeId);
      
      console.log('📤 Enviando imagen de prueba...');
      
      const uploadResponse = await fetch(`/api/products/${productId}/images`, {
        method: 'POST',
        body: formData
      });
      
      const uploadResult = await uploadResponse.json();
      console.log('📥 Resultado de subida:', uploadResult);
      
      if (uploadResponse.ok) {
        setProduct(uploadResult.product);
        setError('');
      } else {
        setError(`Error subiendo imagen: ${uploadResult.error}`);
      }
      
    } catch (err) {
      console.error('❌ Error subiendo imagen:', err);
      setError(`Error subiendo imagen: ${err instanceof Error ? err.message : 'Error desconocido'}`);
    }
  };

  const isBase64Image = (url: string) => {
    return url && url.startsWith('data:image');
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">Debug: Imágenes en Producción</h1>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Consultar Producto</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Product ID</label>
              <Input
                placeholder="Ej: PROD-001"
                value={productId}
                onChange={(e) => setProductId(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Store ID</label>
              <Input
                placeholder="Ej: store-123"
                value={storeId}
                onChange={(e) => setStoreId(e.target.value)}
              />
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button onClick={loadProduct} disabled={loading}>
              {loading ? 'Cargando...' : 'Consultar Producto'}
            </Button>
            <Button onClick={testImageUpload} variant="outline" disabled={loading}>
              Subir Imagen de Prueba
            </Button>
          </div>
          
          {error && (
            <div className="bg-red-50 border border-red-200 rounded p-3 text-red-700">
              {error}
            </div>
          )}
        </CardContent>
      </Card>

      {product && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {product.name}
              <Badge variant="outline">ID: {product.id}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            
            {/* Información básica */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Información Básica</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><strong>MongoDB _id:</strong> {product._id}</div>
                <div><strong>Product ID:</strong> {product.id}</div>
                <div><strong>Primary Image Index:</strong> {product.primaryImageIndex ?? 'No definido'}</div>
              </div>
            </div>

            {/* Imagen Legacy */}
            {product.imageUrl && (
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  Imagen Legacy (imageUrl)
                  <Badge variant={isBase64Image(product.imageUrl) ? 'default' : 'secondary'}>
                    {isBase64Image(product.imageUrl) ? 'Base64' : 'URL'}
                  </Badge>
                </h3>
                
                <div className="space-y-3">
                  <div className="bg-gray-100 p-2 rounded text-xs break-all">
                    <strong>URL:</strong> {product.imageUrl.substring(0, 100)}
                    {product.imageUrl.length > 100 && '...'}
                  </div>
                  
                  <div className="bg-gray-100 p-2 rounded text-xs">
                    <strong>Hint:</strong> {product.imageHint || 'Sin hint'}
                  </div>
                  
                  {isBase64Image(product.imageUrl) && (
                    <div className="flex justify-center">
                      <img 
                        src={product.imageUrl} 
                        alt="Legacy image" 
                        className="max-w-xs max-h-32 object-contain border rounded"
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Múltiples Imágenes */}
            {product.images && product.images.length > 0 && (
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  Múltiples Imágenes
                  <Badge>{product.images.length} imagen(es)</Badge>
                </h3>
                
                <div className="space-y-4">
                  {product.images.map((image, index) => (
                    <div key={image.id} className="border rounded p-3 bg-gray-50">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline">#{index + 1}</Badge>
                        <Badge variant={isBase64Image(image.url) ? 'default' : 'secondary'}>
                          {isBase64Image(image.url) ? 'Base64' : 'URL'}
                        </Badge>
                        {index === (product.primaryImageIndex || 0) && (
                          <Badge className="bg-green-500">Principal</Badge>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="space-y-2 text-xs">
                          <div><strong>ID:</strong> {image.id}</div>
                          <div><strong>Alt:</strong> {image.alt || 'Sin alt'}</div>
                          <div><strong>Order:</strong> {image.order}</div>
                          <div className="bg-white p-2 rounded break-all">
                            <strong>URL:</strong> {image.url.substring(0, 80)}
                            {image.url.length > 80 && '...'}
                          </div>
                        </div>
                        
                        {isBase64Image(image.url) && (
                          <div className="flex justify-center">
                            <img 
                              src={image.url} 
                              alt={image.alt || `Imagen ${index + 1}`}
                              className="max-w-full max-h-32 object-contain border rounded"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Estado sin imágenes */}
            {!product.imageUrl && (!product.images || product.images.length === 0) && (
              <div className="text-center py-8 text-gray-500 border rounded-lg">
                <p>Este producto no tiene imágenes</p>
              </div>
            )}

            {/* JSON Raw */}
            <details className="border rounded-lg">
              <summary className="p-3 cursor-pointer font-semibold bg-gray-50 rounded-t-lg">
                Ver JSON Completo
              </summary>
              <pre className="p-3 text-xs bg-gray-100 overflow-auto max-h-96">
                {JSON.stringify(product, null, 2)}
              </pre>
            </details>
            
          </CardContent>
        </Card>
      )}
    </div>
  );
}