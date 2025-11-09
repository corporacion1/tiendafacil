"use client";

import React, { useState, useCallback, useRef } from 'react';
import { Upload, X, Image as ImageIcon, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { ProductImage } from '@/lib/types';
import { validateMultipleImageFiles, formatFileSize } from '@/lib/image-validation';
import { fileToBase64 } from '@/lib/image-processing';
import { useSettings } from '@/contexts/settings-context';

interface MultiImageUploadProps {
  productId?: string;
  existingImages?: ProductImage[];
  maxImages?: number;
  maxFileSize?: number;
  onImagesChange: (images: ProductImage[]) => void;
  onError: (error: string) => void;
  className?: string;
  disabled?: boolean;
  storeId?: string;
}

interface UploadingImage {
  id: string;
  file: File;
  preview: string;
  progress: number;
  status: 'uploading' | 'processing' | 'completed' | 'error';
  error?: string;
}

// ✅ COMPONENTE SEGURO PARA IMÁGENES
const SafeImage = ({ 
  src, 
  alt, 
  className = '',
  fill = false,
  sizes
}: { 
  src: string; 
  alt: string; 
  className?: string;
  fill?: boolean;
  sizes?: string;
}) => {
  const [imageError, setImageError] = useState(false);

  if (!src || imageError) {
    return (
      <div className={`flex items-center justify-center bg-muted rounded-lg ${className}`}>
        <ImageIcon className="h-8 w-8 text-muted-foreground" />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={`object-cover rounded-lg ${className}`}
      onError={() => setImageError(true)}
    />
  );
};

export function MultiImageUpload({
  productId,
  existingImages = [],
  maxImages = 4,
  maxFileSize = 5 * 1024 * 1024,
  onImagesChange,
  onError,
  className,
  disabled = false,
  storeId
}: MultiImageUploadProps) {
  const { activeStoreId } = useSettings();
  const effectiveStoreId = storeId || activeStoreId;

  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadingImages, setUploadingImages] = useState<UploadingImage[]>([]);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounterRef = useRef(0);

  const currentImages = existingImages.length;
  const canAddMore = currentImages < maxImages && !disabled;
  const remainingSlots = maxImages - currentImages;

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    dragCounterRef.current++;
    if (canAddMore) setIsDragOver(true);
  }, [canAddMore]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    dragCounterRef.current--;
    if (dragCounterRef.current === 0) setIsDragOver(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    setIsDragOver(false);
    dragCounterRef.current = 0;
    if (!canAddMore) return;
    const files = Array.from(e.dataTransfer.files);
    await handleFiles(files);
  }, [canAddMore]);

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    await handleFiles(files);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, []);

  const handleFiles = useCallback(async (files: File[]) => {
    if (files.length === 0) return;

    setValidationErrors([]);
    setWarnings([]);

    try {
      const validation = await validateMultipleImageFiles(files, currentImages);
      if (validation.warnings.length > 0) setWarnings(validation.warnings);
      if (validation.invalidFiles.length > 0) {
        const errors = validation.invalidFiles.flatMap(f => f.errors);
        setValidationErrors(errors);
      }
      if (validation.validFiles.length === 0) return;

      const uploadingItems: UploadingImage[] = [];
      for (const file of validation.validFiles) {
        const preview = await fileToBase64(file);
        uploadingItems.push({
          id: `uploading-${Date.now()}-${Math.random()}`,
          file,
          preview,
          progress: 0,
          status: 'uploading'
        });
      }
      setUploadingImages(uploadingItems);

      if (productId) {
        await uploadToServer(validation.validFiles);
      } else {
        await processLocalPreview(validation.validFiles, uploadingItems);
      }
    } catch (error) {
      console.error('Error procesando imágenes:', error);
      onError('Error al procesar las imágenes. Por favor, inténtalo de nuevo.');
      setUploadingImages([]);
    }
  }, [currentImages, productId, onError]);

  // ✅ CORREGIDO: Endpoints actualizados para Supabase
  const uploadToServer = async (files: File[]) => {
    try {
      const slots = Math.max(0, maxImages - (existingImages?.length || 0));
      const limitedFiles = files.slice(0, slots);
      if (limitedFiles.length === 0) {
        onError('No hay imágenes válidas para subir.');
        setUploadingImages([]);
        return;
      }

      const formData = new FormData();
      limitedFiles.forEach(file => formData.append('images', file));
      if (!effectiveStoreId) throw new Error('No se pudo obtener el ID de la tienda');
      formData.append('storeId', effectiveStoreId);

      setUploadingImages(prev => prev.map(item => ({ ...item, progress: 50, status: 'processing' })));

      // ✅ CORREGIDO: Endpoint actualizado para Supabase
      const response = await fetch(`/api/supabase/products/${productId}/images`, {
        method: 'POST',
        body: formData
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error al subir imágenes: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      setUploadingImages(prev => prev.map(item => ({ ...item, progress: 100, status: 'completed' })));

      if (result.product && result.product.images) {
        onImagesChange(result.product.images);
      }

      try {
        if (productId && effectiveStoreId) {
          // ✅ CORREGIDO: Endpoint actualizado para Supabase
          const refresh = await fetch(`/api/supabase/products/${productId}?storeId=${effectiveStoreId}`);
          if (refresh.ok) {
            const freshProduct = await refresh.json();
            if (freshProduct?.images) onImagesChange(freshProduct.images);
          }
        }
      } catch {}

      setTimeout(() => setUploadingImages([]), 800);
    } catch (error) {
      console.error('❌ [MultiImageUpload] Error subiendo al servidor:', error);
      setUploadingImages(prev => prev.map(item => ({ ...item, status: 'error', error: 'Error al subir al servidor' })));
      onError(`Error al subir las imágenes: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  };

  const processLocalPreview = async (files: File[], uploadingItems: UploadingImage[]) => {
    try {
      const newImages: ProductImage[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const preview = await fileToBase64(file);
        setUploadingImages(prev => prev.map((item, idx) => (idx === i ? { ...item, progress: 100, status: 'completed' } : item)));
        const imageData: ProductImage = {
          id: `temp-${Date.now()}-${i}`,
          url: preview,
          thumbnailUrl: preview,
          alt: file.name.replace(/\.[^/.]+$/, ''),
          order: existingImages.length + i,
          uploadedAt: new Date().toISOString(),
          size: file.size,
          dimensions: { width: 800, height: 600 }
        };
        newImages.push(imageData);
      }
      onImagesChange([...existingImages, ...newImages]);
      setTimeout(() => setUploadingImages([]), 800);
    } catch (error) {
      console.error('Error procesando preview local:', error);
      onError('Error al procesar las imágenes para preview.');
      setUploadingImages([]);
    }
  };

  // ✅ CORREGIDO: Endpoints actualizados para Supabase
  const handleRemoveImage = useCallback(async (imageId: string) => {
    if (!productId || !effectiveStoreId) {
      onError(`No puedes eliminar imágenes hasta guardar el producto. Faltan datos (productId=${productId ?? 'null'}, storeId=${effectiveStoreId ?? 'null'})`);
      return;
    }
    if (productId && effectiveStoreId) {
      try {
        const match = existingImages.find(img => img.id === imageId || (img as any)?._id === imageId);
        const realImageId = match ? (match.id || (match as any)?._id) : imageId;
        // ✅ CORREGIDO: Endpoint actualizado para Supabase
        const response = await fetch(`/api/supabase/products/${productId}/images?imageId=${realImageId}&storeId=${effectiveStoreId}`, { method: 'DELETE' });
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(errorText);
        }
        const result = await response.json();
        if (result.product && result.product.images) onImagesChange(result.product.images);
      } catch (error) {
        console.error('❌ [MultiImageUpload] Error eliminando imagen:', error);
        onError('Error al eliminar la imagen del servidor.');
      }
    }
  }, [productId, effectiveStoreId, existingImages, onImagesChange, onError]);

  // ✅ CORREGIDO: Endpoints actualizados para Supabase
  const handleSetAsPrimary = useCallback(async (imageId: string) => {
    if (!productId || !effectiveStoreId) {
      onError(`No puedes cambiar la imagen principal hasta guardar el producto. Faltan datos (productId=${productId ?? 'null'}, storeId=${effectiveStoreId ?? 'null'})`);
      return;
    }
    const imageIndex = existingImages.findIndex(img => img.id === imageId);
    if (imageIndex === -1 || imageIndex === 0) return;
    const updatedImages = [...existingImages];
    const [imageToMove] = updatedImages.splice(imageIndex, 1);
    updatedImages.unshift(imageToMove);
    const reorderedImages = updatedImages.map((img, index) => ({ ...img, order: index }));

    if (productId && effectiveStoreId) {
      try {
        const imageIds = reorderedImages.map(img => img.id || (img as any)?._id);
        // ✅ CORREGIDO: Endpoint actualizado para Supabase
        const response = await fetch(`/api/supabase/products/${productId}/images`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageIds, storeId: effectiveStoreId })
        });
        if (!response.ok) throw new Error('Error al establecer imagen principal en el servidor');
        const result = await response.json();
        if (result.product && result.product.images) onImagesChange(result.product.images);
      } catch (error) {
        console.error('Error estableciendo imagen principal:', error);
        onError('Error al establecer la imagen principal en el servidor.');
      }
    }
  }, [existingImages, productId, effectiveStoreId, onImagesChange, onError]);

  // ✅ CORREGIDO: Endpoints actualizados para Supabase
  const handleMoveImage = useCallback(async (imageId: string, direction: 'up' | 'down') => {
    if (!productId || !effectiveStoreId) {
      onError(`No puedes reordenar imágenes hasta guardar el producto. Faltan datos (productId=${productId ?? 'null'}, storeId=${effectiveStoreId ?? 'null'})`);
      return;
    }
    const currentIndex = existingImages.findIndex(img => img.id === imageId);
    if (currentIndex === -1) return;
    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= existingImages.length) return;
    const updatedImages = [...existingImages];
    [updatedImages[currentIndex], updatedImages[newIndex]] = [updatedImages[newIndex], updatedImages[currentIndex]];
    const reorderedImages = updatedImages.map((img, index) => ({ ...img, order: index }));

    if (productId && activeStoreId) {
      try {
        const imageIds = reorderedImages.map(img => img.id);
        // ✅ CORREGIDO: Endpoint actualizado para Supabase
        const response = await fetch(`/api/supabase/products/${productId}/images`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageIds, storeId: activeStoreId })
        });
        if (!response.ok) throw new Error('Error al reordenar imágenes en el servidor');
        const result = await response.json();
        if (result.product && result.product.images) onImagesChange(result.product.images);
      } catch (error) {
        console.error('Error reordenando imágenes:', error);
        onError('Error al reordenar las imágenes en el servidor.');
      }
    }
  }, [existingImages, productId, activeStoreId, onImagesChange, onError]);

  return (
    <div className={cn('space-y-4 w-full max-w-full overflow-hidden', className)}>
      {canAddMore && (
        <div
          className={cn(
            'relative border-2 border-dashed rounded-lg p-6 transition-colors',
            isDragOver ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-muted-foreground/50',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/jpeg,image/jpg,image/png,image/webp"
            onChange={handleFileSelect}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            disabled={disabled}
          />
          <div className="flex flex-col items-center justify-center text-center">
            <Upload className="w-10 h-10 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">{isDragOver ? 'Suelta las imágenes aquí' : 'Agregar imágenes'}</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Arrastra y suelta hasta {remainingSlots} imagen{remainingSlots !== 1 ? 's' : ''} más, o haz clic para seleccionar
            </p>
            <Button variant="outline" size="sm" disabled={disabled}>
              <ImageIcon className="w-4 h-4 mr-2" />
              Seleccionar archivos
            </Button>
            <p className="text-xs text-muted-foreground mt-2">JPG, PNG, WebP • Máximo {formatFileSize(maxFileSize)} por imagen</p>
          </div>
        </div>
      )}

      {validationErrors.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <ul className="list-disc list-inside space-y-1">
              {validationErrors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {warnings.length > 0 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <ul className="list-disc list-inside space-y-1">
              {warnings.map((warning, index) => (
                <li key={index}>{warning}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {uploadingImages.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Procesando imágenes...</h4>
          {uploadingImages.map((item) => (
            <Card key={item.id} className="p-3">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted relative">
                  <SafeImage src={item.preview} alt="Preview" className="w-full h-full" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{item.file.name}</p>
                  <div className="flex items-center space-x-2 mt-1">
                    <Progress value={item.progress} className="flex-1" />
                    <span className="text-xs text-muted-foreground">{item.progress}%</span>
                  </div>
                  {item.status === 'processing' && (
                    <p className="text-xs text-muted-foreground mt-1">Optimizando imagen...</p>
                  )}
                </div>
                {item.status === 'completed' && <CheckCircle className="w-5 h-5 text-green-500" />}
                {item.status === 'error' && <AlertCircle className="w-5 h-5 text-red-500" />}
              </div>
            </Card>
          ))}
        </div>
      )}

      {existingImages.length > 0 && (
        <div className="space-y-2 w-full max-w-full">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium">Imágenes del producto ({existingImages.length}/{maxImages})</h4>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-full">
            {existingImages.map((image, index) => (
              <Card key={image.id} className="relative group hover:shadow-lg transition-shadow w-full">
                <CardContent className="p-3">
                  <div className="aspect-square relative rounded-lg overflow-hidden bg-muted shadow-sm max-h-[180px] w-full">
                    <SafeImage
                      src={image.thumbnailUrl || image.url}
                      alt={image.alt || `Imagen ${index + 1}`}
                      className="w-full h-full hover:scale-105 transition-transform duration-200"
                    />

                    {index === 0 && (
                      <Badge className="absolute top-3 left-3 text-xs bg-green-500 hover:bg-green-600 shadow-lg">⭐ Principal</Badge>
                    )}

                    <div className="absolute inset-0 bg-black/50 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-2">
                      <div className="flex flex-col gap-1 items-center w-full">
                        {index !== 0 && (
                          <Button
                            type="button"
                            size="sm"
                            variant="default"
                            onClick={() => handleSetAsPrimary(image.id)}
                            className="h-8 px-2 text-xs shadow-lg bg-green-600 hover:bg-green-700 text-white w-full max-w-[120px]"
                            title="Establecer como principal"
                          >
                            ⭐ Principal
                          </Button>
                        )}

                        <div className="flex gap-1 justify-center">
                          {index > 0 && (
                            <Button type="button" size="sm" variant="secondary" onClick={() => handleMoveImage(image.id, 'up')} className="h-8 w-8 p-0 shadow-lg text-xs" title="Mover arriba">↑</Button>
                          )}
                          {index < existingImages.length - 1 && (
                            <Button type="button" size="sm" variant="secondary" onClick={() => handleMoveImage(image.id, 'down')} className="h-8 w-8 p-0 shadow-lg text-xs" title="Mover abajo">↓</Button>
                          )}
                          <Button type="button" size="sm" variant="destructive" onClick={() => handleRemoveImage(image.id)} className="h-8 w-8 p-0 shadow-lg" title="Eliminar imagen">
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-2 space-y-1">
                    <p className="text-xs font-medium text-gray-700 truncate">{image.alt || `Imagen ${index + 1}`}</p>
                    <div className="flex justify-between items-center text-xs text-muted-foreground">
                      {image.size && <span>{formatFileSize(image.size)}</span>}
                      <span>#{index + 1}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {existingImages.length === 0 && uploadingImages.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <ImageIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No hay imágenes agregadas aún</p>
          <p className="text-sm">Agrega hasta {maxImages} imágenes para este producto</p>
        </div>
      )}
    </div>
  );
}