'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

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
}

export default function DebugDBImagesPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [storeId, setStoreId] = useState('');

  const loadProducts = async () => {
    if (!storeId) {
      alert('Por favor ingresa un storeId');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/products?storeId=${storeId}`);
      const data = await response.json();
      
      // Filtrar solo productos que tienen imágenes
      const productsWithImages = data.filter((p: Product) => 
        (p.images && p.images.length > 0) || p.imageUrl
      );
      
      setProducts(productsWithImages);
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setLoading(false);
    }
  };

  const isBase64Image = (url: string) => {
    return url && url.startsWith('data:image');
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Debug: Imágenes en Base de Datos</h1>
      
      <div className="mb-6 flex gap-4 items-center">
        <input
          type="text"
          placeholder="Store ID"
          value={storeId}
          onChange={(e) => setStoreId(e.target.value)}
          className="border rounded px-3 py-2"
        />
        <Button onClick={loadProducts} disabled={loading}>
          {loading ? 'Cargando...' : 'Cargar Productos'}
        </Button>
      </div>

      <div className="grid gap-6">
        {products.map((product) => (
          <Card key={product._id} className="w-full">
            <CardHeader>
              <CardTitle className="text-lg">
                {product.name} (ID: {product.id})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Imagen legacy (imageUrl) */}
              {product.imageUrl && (
                <div className="mb-4">
                  <h4 className="font-semibold mb-2">Imagen Legacy (imageUrl):</h4>
                  <div className="bg-gray-100 p-2 rounded mb-2">
                    <p className="text-sm">
                      <strong>Tipo:</strong> {isBase64Image(product.imageUrl) ? 'Base64' : 'URL'}
                    </p>
                    <p className="text-sm break-all">
                      <strong>URL:</strong> {product.imageUrl.substring(0, 100)}
                      {product.imageUrl.length > 100 && '...'}
                    </p>
                  </div>
                  {isBase64Image(product.imageUrl) ? (
                    <img 
                      src={product.imageUrl} 
                      alt="Legacy image" 
                      className="max-w-xs max-h-32 object-contain border"
                    />
                  ) : (
                    <p className="text-gray-500">URL externa - no se muestra preview</p>
                  )}
                </div>
              )}

              {/* Nuevas imágenes (images array) */}
              {product.images && product.images.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">
                    Imágenes Múltiples ({product.images.length}):
                  </h4>
                  <div className="space-y-4">
                    {product.images.map((image, index) => (
                      <div key={image.id} className="border rounded p-3">
                        <div className="bg-gray-100 p-2 rounded mb-2">
                          <p className="text-sm">
                            <strong>ID:</strong> {image.id}
                          </p>
                          <p className="text-sm">
                            <strong>Orden:</strong> {image.order}
                          </p>
                          <p className="text-sm">
                            <strong>Alt:</strong> {image.alt || 'Sin alt'}
                          </p>
                          <p className="text-sm">
                            <strong>Tipo:</strong> {isBase64Image(image.url) ? 'Base64' : 'URL'}
                          </p>
                          <p className="text-sm break-all">
                            <strong>URL:</strong> {image.url.substring(0, 100)}
                            {image.url.length > 100 && '...'}
                          </p>
                        </div>
                        {isBase64Image(image.url) ? (
                          <img 
                            src={image.url} 
                            alt={image.alt || `Imagen ${index + 1}`}
                            className="max-w-xs max-h-32 object-contain border"
                          />
                        ) : (
                          <p className="text-gray-500">URL externa - no se muestra preview</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {!product.imageUrl && (!product.images || product.images.length === 0) && (
                <p className="text-gray-500">Sin imágenes</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {products.length === 0 && !loading && storeId && (
        <p className="text-center text-gray-500 mt-8">
          No se encontraron productos con imágenes para este store.
        </p>
      )}
    </div>
  );
}