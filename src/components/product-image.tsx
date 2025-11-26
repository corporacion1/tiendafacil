'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Package } from 'lucide-react';

interface ProductImageProps {
  src: string;
  alt: string;
  className?: string;
  fill?: boolean;
  sizes?: string;
  onError?: () => void;
  onLoad?: () => void;
}

export const ProductImage = ({ 
  src, 
  alt, 
  className = '', 
  fill = false, 
  sizes,
  onError,
  onLoad 
}: ProductImageProps) => {
  const [error, setError] = useState(false);

  const handleError = () => {
    console.error('❌ [ProductImage] Error loading image:', {
      src: src?.substring(0, 50) + '...',
      isBase64: src?.startsWith('data:image'),
      alt
    });
    setError(true);
    onError?.();
  };

  const handleLoad = () => {
    console.log('✅ [ProductImage] Image loaded successfully:', {
      src: src?.substring(0, 30) + '...',
      isBase64: src?.startsWith('data:image')
    });
    onLoad?.();
  };

  // Si no hay src o hay error, mostrar placeholder
  if (!src || error) {
    return (
      <div className={`flex items-center justify-center h-full w-full bg-gradient-to-br from-blue-50 to-green-50 ${className}`}>
        <Package className="w-8 h-8 text-blue-400" />
      </div>
    );
  }

  // PARA IMÁGENES BASE64: Usar siempre <img> nativo
  if (src.startsWith('data:image')) {
    return (
      <img
        src={src}
        alt={alt}
        className={className}
        onError={handleError}
        onLoad={handleLoad}
      />
    );
  }

  // PARA URLs NORMALES: Usar Next.js Image con optimización
  if (fill) {
    return (
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        className={className}
        onError={handleError}
        onLoad={handleLoad}
      />
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      className={className}
      onError={handleError}
      onLoad={handleLoad}
    />
  );
};