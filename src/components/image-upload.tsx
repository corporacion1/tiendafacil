"use client";

import { useState, useRef, useEffect } from 'react';
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { getDisplayImageUrl } from '@/lib/utils';

interface ImageUploadProps {
  onImageUploaded: (imageUrl: string) => void;
  currentImage?: string;
  className?: string;
  type?: 'product' | 'ad' | 'store' | 'user';
}

export function ImageUpload({ 
  onImageUploaded, 
  currentImage, 
  className,
  type = 'product'
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImage || null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Keep previewUrl in sync when parent passes a different currentImage
  useEffect(() => {
    if (!currentImage) {
      setPreviewUrl(null);
      return;
    }

    setPreviewUrl(currentImage);
  }, [currentImage]);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      toast({
        variant: "destructive",
        title: "Archivo inválido",
        description: "Por favor selecciona una imagen válida (JPG, PNG, GIF, etc.)"
      });
      return;
    }

    // Validar tamaño (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        variant: "destructive",
        title: "Archivo muy grande",
        description: "La imagen debe ser menor a 5MB"
      });
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      // Sugerir la carpeta destino según el tipo
      formData.append('folder', type === 'ad' ? 'ads' : type === 'store' ? 'stores' : type === 'user' ? 'users' : 'products');

      const response = await fetch('/api/upload/image', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        let errorMessage = `Error al subir la imagen (${response.status})`;
        try {
          const errData = await response.json();
          if (errData?.error) errorMessage = errData.error;
        } catch (e) {
          // ignore JSON parse errors
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();

      if (!data || !data.url) {
        throw new Error('Respuesta inválida del servidor al subir la imagen');
      }

      setPreviewUrl(data.url);
      onImageUploaded(data.url);

    } catch (error) {
      console.error('Error uploading image:', error);
      const message = error instanceof Error ? error.message : String(error);
      toast({
        variant: "destructive",
        title: "Error al subir imagen",
        description: message || "No se pudo subir la imagen. Intenta nuevamente."
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveImage = () => {
    setPreviewUrl(null);
    onImageUploaded('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const displayUrl = previewUrl ? getDisplayImageUrl(previewUrl, type) : null;

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="flex items-center gap-2"
        >
          {isUploading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Upload className="h-4 w-4" />
          )}
          {isUploading ? 'Subiendo...' : 'Seleccionar Imagen'}
        </Button>

        {previewUrl && (
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={handleRemoveImage}
            disabled={isUploading}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {displayUrl ? (
        <div className="relative w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg overflow-hidden bg-muted">
          <img
            src={displayUrl}
            alt="Preview"
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/placeholder.svg';
            }}
          />
        </div>
      ) : (
        <div className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-muted/50">
          <ImageIcon className="h-8 w-8 text-gray-400" />
        </div>
      )}
    </div>
  );
}