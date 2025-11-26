// src/components/fullscreen-toggle-button.tsx
'use client';

import { useState } from 'react';
import { Button } from './ui/button';
import { FullscreenModal } from './fullscreen-modal';
import { Monitor, Maximize, Minimize } from 'lucide-react';

interface FullscreenToggleButtonProps {
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
  showText?: boolean;
  className?: string;
}

export function FullscreenToggleButton({
  variant = 'outline',
  size = 'default',
  showText = true,
  className = ''
}: FullscreenToggleButtonProps) {
  const [showModal, setShowModal] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Verificar estado de pantalla completa
  const checkFullscreenStatus = () => {
    const fullscreen = !!(
      document.fullscreenElement ||
      (document as any).webkitFullscreenElement ||
      (document as any).mozFullScreenElement ||
      (document as any).msFullscreenElement
    );
    setIsFullscreen(fullscreen);
    return fullscreen;
  };

  const handleClick = () => {
    if (checkFullscreenStatus()) {
      // Si ya está en pantalla completa, salir
      exitFullscreen();
    } else {
      // Si no está en pantalla completa, mostrar modal
      setShowModal(true);
    }
  };

  const exitFullscreen = async () => {
    try {
      if (document.exitFullscreen) {
        await document.exitFullscreen();
      } else if ((document as any).webkitExitFullscreen) {
        await (document as any).webkitExitFullscreen();
      } else if ((document as any).mozCancelFullScreen) {
        await (document as any).mozCancelFullScreen();
      } else if ((document as any).msExitFullscreen) {
        await (document as any).msExitFullscreen();
      }
      setIsFullscreen(false);
    } catch (error) {
      console.error('Error al salir de pantalla completa:', error);
    }
  };

  const activateDesktopMode = () => {
    setIsFullscreen(true);
    console.log('Modo escritorio activado desde botón manual');
  };

  const closeModal = () => {
    setShowModal(false);
  };

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={handleClick}
        className={className}
      >
        {isFullscreen ? (
          <>
            <Minimize className="h-4 w-4" />
            {showText && <span className="ml-2">Salir Pantalla Completa</span>}
          </>
        ) : (
          <>
            <Monitor className="h-4 w-4" />
            {showText && <span className="ml-2">Modo Escritorio</span>}
          </>
        )}
      </Button>

      <FullscreenModal
        isOpen={showModal}
        onClose={closeModal}
        onActivateDesktopMode={activateDesktopMode}
      />
    </>
  );
}