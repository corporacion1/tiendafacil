"use client";

import React, { useState, useEffect } from 'react';
import { Product, ProductImage } from '@/lib/types';
import { MultiImageUpload } from '@/components/multi-image-upload';
import { migrateProductToMultipleImages } from '@/lib/product-image-utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ProductEditFormProps {
  product: Product;
  onSave: (updatedProduct: Product) => Promise<void>;
}

export function ProductEditForm({ product, onSave }: ProductEditFormProps) {
  const [formData, setFormData] = useState<Product>(product);
  const [isLoading, setIsLoading] = useState(false);

  // Migrar automáticamente el producto al formato de múltiples imágenes si es necesario
  useEffect(() => {
    const migratedProduct = migrateProductToMultipleImages(product);
    setFormData(migratedProduct);
  }, [product]);

  // Manejar cambios en las imágenes
  const handleImagesChange = (newImages: ProductImage[]) => {
    setFormData(prev => ({
      ...prev,
      images: newImages,
      primaryImageIndex: 0,
      // Actualizar campos de compatibilidad
      imageUrl: newImages[0]?.url || undefined,
      imageHint: newImages[0]?.alt || undefined
    }));
  };

  // Manejar errores de subida
  const handleUploadError = (error: string) => {
    console.error('Error subiendo imágenes:', error);
    alert(`Error: ${error}`);
  };

  // Guardar producto
  const handleSave = async () => {
    setIsLoading(true);
    try {
      await onSave(formData);
      alert('Producto actualizado exitosamente');
    } catch (error) {
      console.error('Error guardando producto:', error);
      alert('Error al guardar el producto');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Editar Producto: {formData.name}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Información básica del producto */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <strong>SKU:</strong> {formData.sku}
            </div>
            <div>
              <strong>Precio:</strong> ${formData.price}
            </div>
            <div>
              <strong>Stock:</strong> {formData.stock}
            </div>
            <div>
              <strong>Estado:</strong> {formData.status}
            </div>
          </div>

          {/* Gestión de imágenes */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Imágenes del Producto</h3>
            <MultiImageUpload
              productId={formData.id}
              existingImages={formData.images || []}
              maxImages={4}
              onImagesChange={handleImagesChange}
              onError={handleUploadError}
            />
          </div>

          {/* Información de compatibilidad */}
          {formData.images && formData.images.length > 0 && (
            <div className="p-3 bg-muted/20 rounded-lg">
              <h4 className="font-medium mb-2">Estado de Imágenes</h4>
              <ul className="text-sm space-y-1">
                <li>• Total de imágenes: {formData.images.length}</li>
                <li>• Imagen principal: {formData.images[0]?.alt || 'Sin descripción'}</li>
                <li>• Formato compatible: {formData.imageUrl ? 'Sí' : 'No'}</li>
              </ul>
            </div>
          )}

          {/* Botones de acción */}
          <div className="flex gap-2 pt-4">
            <Button 
              onClick={handleSave} 
              disabled={isLoading}
              className="flex-1"
            >
              {isLoading ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setFormData(product)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Ejemplo de uso en una página de administración
export function ProductEditPage({ productId }: { productId: string }) {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  // Cargar producto
  useEffect(() => {
    const loadProduct = async () => {
      try {
        const response = await fetch(`/api/products/${productId}`);
        if (response.ok) {
          const productData = await response.json();
          setProduct(productData);
        }
      } catch (error) {
        console.error('Error cargando producto:', error);
      } finally {
        setLoading(false);
      }
    };

    loadProduct();
  }, [productId]);

  // Guardar producto actualizado
  const handleSaveProduct = async (updatedProduct: Product) => {
    const response = await fetch(`/api/products/${productId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updatedProduct)
    });

    if (!response.ok) {
      throw new Error('Error al actualizar el producto');
    }

    // Actualizar estado local
    setProduct(updatedProduct);
  };

  if (loading) {
    return <div className="p-6 text-center">Cargando producto...</div>;
  }

  if (!product) {
    return <div className="p-6 text-center">Producto no encontrado</div>;
  }

  return (
    <ProductEditForm 
      product={product} 
      onSave={handleSaveProduct} 
    />
  );
}