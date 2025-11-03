"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';

import Image from 'next/image';

import { ChevronLeft, ChevronRight, X, ZoomIn, Share, Download } from 'lucide-react';

import { Button } from '@/components/ui/button';

import { Dialog, DialogContent, DialogClose } from '@/components/ui/dialog';

import { Badge } from '@/components/ui/badge';

import { cn } from '@/lib/utils';

import { Product } from '@/lib/types';

import { getAllProductImages, hasMultipleImages, getImageCount } from '@/lib/product-image-utils';



interface ProductImageGalleryProps {

  product: Product;

  showThumbnails?: boolean;

  autoPlay?: boolean;

  className?: string;

  onImageShare?: (imageUrl: string, imageName: string) => void;

}



export function ProductImageGallery({

  product,

  showThumbnails = true,

  autoPlay = false,

  className,

  onImageShare

}: ProductImageGalleryProps) {

  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const [isZoomModalOpen, setIsZoomModalOpen] = useState(false);

  const [touchStart, setTouchStart] = useState<number | null>(null);

  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const [isAutoPlaying, setIsAutoPlaying] = useState(autoPlay);

  const autoPlayRef = useRef<NodeJS.Timeout>();

  const galleryRef = useRef<HTMLDivElement>(null);



  const images = getAllProductImages(product);

  const hasMultiple = hasMultipleImages(product);

  const totalImages = getImageCount(product);



  // Auto-play functionality

  useEffect(() => {

    if (isAutoPlaying && hasMultiple) {

      autoPlayRef.current = setInterval(() => {

        setCurrentImageIndex(prev => (prev + 1) % images.length);

      }, 4000); // Cambiar cada 4 segundos

    }



    return () => {

      if (autoPlayRef.current) {

        clearInterval(autoPlayRef.current);

      }

    };

  }, [isAutoPlaying, hasMultiple, images.length]);



  // Pausar auto-play cuando el usuario interactúa

  const pauseAutoPlay = useCallback(() => {

    setIsAutoPlaying(false);

    if (autoPlayRef.current) {

      clearInterval(autoPlayRef.current);

    }

  }, []);



  // Navegación

  const goToPrevious = useCallback(() => {

    pauseAutoPlay();

    setCurrentImageIndex(prev => prev === 0 ? images.length - 1 : prev - 1);

  }, [images.length, pauseAutoPlay]);



  const goToNext = useCallback(() => {

    pauseAutoPlay();

    setCurrentImageIndex(prev => (prev + 1) % images.length);

  }, [images.length, pauseAutoPlay]);



  const goToImage = useCallback((index: number) => {

    pauseAutoPlay();

    setCurrentImageIndex(index);

  }, [pauseAutoPlay]);



  // Touch gestures

  const handleTouchStart = (e: React.TouchEvent) => {

    setTouchEnd(null);

    setTouchStart(e.targetTouches[0].clientX);

  };



  const handleTouchMove = (e: React.TouchEvent) => {

    setTouchEnd(e.targetTouches[0].clientX);

  };



  const handleTouchEnd = () => {

    if (!touchStart || !touchEnd) return;

    

    const distance = touchStart - touchEnd;

    const isLeftSwipe = distance > 50;

    const isRightSwipe = distance < -50;



    if (isLeftSwipe && hasMultiple) {

      goToNext();

    }

    if (isRightSwipe && hasMultiple) {

      goToPrevious();

    }

  };



  // Keyboard navigation

  useEffect(() => {

    const handleKeyDown = (e: KeyboardEvent) => {

      if (!hasMultiple) return;

      

      switch (e.key) {

        case 'ArrowLeft':

          e.preventDefault();

          goToPrevious();

          break;

        case 'ArrowRight':

          e.preventDefault();

          goToNext();

          break;

        case 'Escape':

          setIsZoomModalOpen(false);

          break;

      }

    };



    if (isZoomModalOpen) {

      document.addEventListener('keydown', handleKeyDown);

      return () => document.removeEventListener('keydown', handleKeyDown);

    }

  }, [isZoomModalOpen, hasMultiple, goToPrevious, goToNext]);



  // Manejar compartir imagen

  const handleShareImage = () => {

    if (onImageShare && images[currentImageIndex]) {

      const currentImage = images[currentImageIndex];

      onImageShare(currentImage.url, currentImage.alt || `${product.name} - Imagen ${currentImageIndex + 1}`);

    }

  };



  if (images.length === 0) {

    return (

      <div className={cn("aspect-square bg-muted rounded-lg flex items-center justify-center", className)}>

        <div className="text-center text-muted-foreground">

          <div className="w-16 h-16 mx-auto mb-2 bg-muted-foreground/20 rounded-lg flex items-center justify-center">

            <ZoomIn className="w-8 h-8" />

          </div>

          <p className="text-sm">Sin imagen</p>

        </div>

      </div>

    );

  }



  const currentImage = images[currentImageIndex];



  return (

    <div className={cn("space-y-4", className)}>

      {/* Imagen principal */}

      <div className="relative group">

        <div

          ref={galleryRef}

          className="aspect-square relative rounded-lg overflow-hidden bg-muted cursor-zoom-in"

          onClick={() => setIsZoomModalOpen(true)}

          onTouchStart={handleTouchStart}

          onTouchMove={handleTouchMove}

          onTouchEnd={handleTouchEnd}

        >

          <Image

            src={currentImage.url}

            alt={currentImage.alt || `${product.name} - Imagen ${currentImageIndex + 1}`}

            fill

            className="object-cover transition-transform duration-300 group-hover:scale-105"

            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"

            priority={currentImageIndex === 0}

          />

          

          {/* Indicador de múltiples imágenes */}

          {hasMultiple && (

            <Badge className="absolute top-3 right-3 bg-black/70 text-white">

              {currentImageIndex + 1}/{totalImages}

            </Badge>

          )}

          

          {/* Controles de navegación */}

          {hasMultiple && (

            <>

              <Button

                variant="secondary"

                size="icon"

                className="absolute left-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/70 hover:bg-black/80 text-white border-0"

                onClick={(e) => {

                  e.stopPropagation();

                  goToPrevious();

                }}

              >

                <ChevronLeft className="w-4 h-4" />

              </Button>

              

              <Button

                variant="secondary"

                size="icon"

                className="absolute right-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/70 hover:bg-black/80 text-white border-0"

                onClick={(e) => {

                  e.stopPropagation();

                  goToNext();

                }}

              >

                <ChevronRight className="w-4 h-4" />

              </Button>

            </>

          )}

          

          {/* Indicador de zoom */}

          <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">

            <Badge variant="secondary" className="bg-black/70 text-white">

              <ZoomIn className="w-3 h-3 mr-1" />

              Ampliar

            </Badge>

          </div>

        </div>

      </div>



      {/* Thumbnails */}

      {showThumbnails && hasMultiple && (

        <div className="flex space-x-2 overflow-x-auto pb-2">

          {images.map((image, index) => (

            <button

              key={image.id}

              className={cn(

                "flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all relative",

                index === currentImageIndex

                  ? "border-primary ring-2 ring-primary/20"

                  : "border-muted hover:border-muted-foreground/50"

              )}

              onClick={() => goToImage(index)}

            >

              <Image

                src={image.thumbnailUrl || image.url}

                alt={image.alt || `Thumbnail ${index + 1}`}

                width={64}

                height={64}

                className="object-cover"

              />

            </button>

          ))}

        </div>

      )}



      {/* Indicadores de puntos (para móvil cuando no hay thumbnails) */}

      {!showThumbnails && hasMultiple && (

        <div className="flex justify-center space-x-2">

          {images.map((_, index) => (

            <button

              key={index}

              className={cn(

                "w-2 h-2 rounded-full transition-all",

                index === currentImageIndex

                  ? "bg-primary"

                  : "bg-muted-foreground/30 hover:bg-muted-foreground/50"

              )}

              onClick={() => goToImage(index)}

            />

          ))}

        </div>

      )}



      {/* Modal de zoom */}

      <Dialog open={isZoomModalOpen} onOpenChange={setIsZoomModalOpen}>

        <DialogContent className="max-w-4xl w-full h-full max-h-[90vh] p-0 bg-black/95">

          <div className="relative w-full h-full flex items-center justify-center">

            {/* Imagen ampliada */}

            <Image

              src={currentImage.url}

              alt={currentImage.alt || `${product.name} - Imagen ${currentImageIndex + 1}`}

              fill

              className="object-contain"

              sizes="100vw"

            />

            

            {/* Controles del modal */}

            <div className="absolute top-4 right-4 flex space-x-2">

              {onImageShare && (

                <Button

                  variant="secondary"

                  size="icon"

                  onClick={handleShareImage}

                  className="bg-black/70 hover:bg-black/80 text-white border-0"

                >

                  <Share className="w-4 h-4" />

                </Button>

              )}

              

              <DialogClose asChild>

                <Button

                  variant="secondary"

                  size="icon"

                  className="bg-black/70 hover:bg-black/80 text-white border-0"

                >

                  <X className="w-4 h-4" />

                </Button>

              </DialogClose>

            </div>

            

            {/* Navegación en modal */}

            {hasMultiple && (

              <>

                <Button

                  variant="secondary"

                  size="icon"

                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/70 hover:bg-black/80 text-white border-0"

                  onClick={goToPrevious}

                >

                  <ChevronLeft className="w-6 h-6" />

                </Button>

                

                <Button

                  variant="secondary"

                  size="icon"

                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/70 hover:bg-black/80 text-white border-0"

                  onClick={goToNext}

                >

                  <ChevronRight className="w-6 h-6" />

                </Button>

              </>

            )}

            

            {/* Información de la imagen */}

            <div className="absolute bottom-4 left-4 right-4 text-center">

              <Badge className="bg-black/70 text-white">

                {currentImage.alt || `${product.name} - Imagen ${currentImageIndex + 1}`}

                {hasMultiple && ` (${currentImageIndex + 1}/${totalImages})`}

              </Badge>

            </div>

            

            {/* Thumbnails en modal */}

            {hasMultiple && (

              <div className="absolute bottom-16 left-1/2 -translate-x-1/2 flex space-x-2 max-w-xs overflow-x-auto">

                {images.map((image, index) => (

                  <button

                    key={image.id}

                    className={cn(

                      "flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden border-2 transition-all relative",

                      index === currentImageIndex

                        ? "border-white ring-2 ring-white/50"

                        : "border-white/30 hover:border-white/60"

                    )}

                    onClick={() => goToImage(index)}

                  >

                    <Image

                      src={image.thumbnailUrl || image.url}

                      alt={`Thumbnail ${index + 1}`}

                      width={48}

                      height={48}

                      className="object-cover"

                    />

                  </button>

                ))}

              </div>

            )}

          </div>

        </DialogContent>

      </Dialog>

    </div>

  );

}
