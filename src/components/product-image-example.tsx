"use client";

import React, { useState } from 'react';
import { Product, ProductImage } from '@/lib/types';
import { MultiImageUpload } from '@/components/multi-image-upload';
import { ProductImageGallery } from '@/components/product-image-gallery';
import { useProductImages } from '@/hooks/use-product-images';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

/**
 * Componente de ejemplo que muestra cómo usar el sistema de múltiples imágenes
 */
export function ProductImageExample() {
  // Producto de ejemplo con múltiples imágenes
  const [exampleProduct, setExampleProduct] = useState<Product>({
    id: 'example-product',
    name: 'Producto de Ejemplo',
    sku: 'EX-001',
    stock: 10,
    price: 29.99,
    wholesalePrice: 24.99,
    cost: 15.00,
    status: 'active',
    tax1: true,
    tax2: false,
    description: 'Este es un producto de ejemplo para mostrar el sistema de múltiples imágenes.',
    createdAt: new Date().toISOString(),
    storeId: 'example-store',
    type: 'product',
    affectsInventory: true,
    
    // Ejemplo con múltiples imágenes
    images: [
      {
        id: 'img-1',
        url: 'https://via.placeholder.com/600x600/3B82F6/FFFFFF?text=Imagen+1',
        thumbnailUrl: 'https://via.placeholder.com/150x150/3B82F6/FFFFFF?text=Thumb+1',
        alt: 'Vista frontal del producto',
        order: 0,
        uploadedAt: new Date().toISOString(),
        size: 1024000,
        dimensions: { width: 600, height: 600 }
      },
      {
        id: 'img-2',
        url: 'https://via.placeholder.com/600x600/10B981/FFFFFF?text=Imagen+2',
        thumbnailUrl: 'https://via.placeholder.com/150x150/10B981/FFFFFF?text=Thumb+2',
        alt: 'Vista lateral del producto',
        order: 1,
        uploadedAt: new Date().toISOString(),
        size: 1024000,
        dimensions: { width: 600, height: 600 }
      },
      {
        id: 'img-3',
        url: 'https://via.placeholder.com/600x600/F59E0B/FFFFFF?text=Imagen+3',
        thumbnailUrl: 'https://via.placeholder.com/150x150/F59E0B/FFFFFF?text=Thumb+3',
        alt: 'Vista posterior del producto',
        order: 2,
        uploadedAt: new Date().toISOString(),
        size: 1024000,
        dimensions: { width: 600, height: 600 }
      }
    ],
    primaryImageIndex: 0,
    
    // Mantener compatibilidad
    imageUrl: 'https://via.placeholder.com/600x600/3B82F6/FFFFFF?text=Imagen+1',
    imageHint: 'Vista frontal del producto'
  });

  // Usar el hook personalizado
  const {
    images,
    primaryImageUrl,
    hasMultiple,
    imageCount,
    isEmpty
  } = useProductImages(exampleProduct);

  // Manejar cambios en las imágenes
  const handleImagesChange = (newImages: ProductImage[]) => {
    setExampleProduct(prev => ({
      ...prev,
      images: newImages,
      primaryImageIndex: 0,
      // Actualizar campos de compatibilidad
      imageUrl: newImages[0]?.url,
      imageHint: newImages[0]?.alt
    }));
  };

  // Manejar compartir imagen
  const handleImageShare = async (imageUrl: string, imageName: string) => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: imageName,
          text: `Mira esta imagen de ${exampleProduct.name}`,
          url: imageUrl
        });
      } else {
        // Fallback: copiar al portapapeles
        await navigator.clipboard.writeText(`${imageName}: ${imageUrl}`);
        alert('Enlace copiado al portapapeles');
      }
    } catch (error) {
      console.log('Error compartiendo:', error);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">Sistema de Múltiples Imágenes</h1>
        <p className="text-muted-foreground">
          Ejemplo de implementación del sistema de múltiples imágenes por producto
        </p>
      </div>

      {/* Información del producto */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {exampleProduct.name}
            {hasMultiple && (
              <Badge variant="secondary">
                {imageCount} imágenes
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Galería de imágenes */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Galería del Producto</h3>
              <ProductImageGallery
                product={exampleProduct}
                showThumbnails={true}
                onImageShare={handleImageShare}
              />
            </div>

            {/* Información del producto */}
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">Información</h3>
                <div className="space-y-2 text-sm">
                  <p><strong>SKU:</strong> {exampleProduct.sku}</p>
                  <p><strong>Precio:</strong> ${exampleProduct.price}</p>
                  <p><strong>Stock:</strong> {exampleProduct.stock} unidades</p>
                  <p><strong>Imágenes:</strong> {imageCount}</p>
                  <p><strong>Imagen principal:</strong> {primaryImageUrl ? 'Sí' : 'No'}</p>
                  <p><strong>Múltiples imágenes:</strong> {hasMultiple ? 'Sí' : 'No'}</p>
                </div>
              </div>

              {exampleProduct.description && (
                <div>
                  <h4 className="font-medium mb-1">Descripción</h4>
                  <p className="text-sm text-muted-foreground">
                    {exampleProduct.description}
                  </p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Gestión de imágenes */}
      <Card>
        <CardHeader>
          <CardTitle>Gestión de Imágenes</CardTitle>
        </CardHeader>
        <CardContent>
          <MultiImageUpload
            productId={exampleProduct.id}
            existingImages={images}
            maxImages={4}
            onImagesChange={handleImagesChange}
            onError={(error) => {
              console.error('Error en upload:', error);
              alert(`Error: ${error}`);
            }}
          />
        </CardContent>
      </Card>

      {/* Información técnica */}
      <Card>
        <CardHeader>
          <CardTitle>Información Técnica</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Características Implementadas</h4>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>Subida de múltiples imágenes (hasta 4 por producto)</li>
                <li>Drag & drop interface con preview</li>
                <li>Validación automática de formato y tamaño</li>
                <li>Compresión y generación de thumbnails</li>
                <li>Galería interactiva con navegación</li>
                <li>Zoom en modal con navegación por teclado</li>
                <li>Soporte para gestos táctiles en móviles</li>
                <li>Compatibilidad con productos de imagen única</li>
                <li>Funcionalidad de compartir imágenes específicas</li>
                <li>Reordenamiento de imágenes</li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium mb-2">Compatibilidad</h4>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>Mantiene compatibilidad con campos imageUrl e imageHint</li>
                <li>Migración automática de productos existentes</li>
                <li>Fallback a imagen única si no hay múltiples imágenes</li>
                <li>API consistente para código existente</li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium mb-2">Optimizaciones</h4>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>Lazy loading de imágenes secundarias</li>
                <li>Compresión automática manteniendo calidad</li>
                <li>Thumbnails para navegación rápida</li>
                <li>Preload inteligente basado en viewport</li>
                <li>Caché de imágenes procesadas</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}