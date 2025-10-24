// src/components/fullscreen-provider.tsx
'use client';

import { useFullscreenModal } from '@/hooks/use-fullscreen-modal';
import { FullscreenModal } from './fullscreen-modal';
import { Button } from './ui/button';
import { Maximize, Minimize } from 'lucide-react';

interface FullscreenProviderProps {
  children: React.ReactNode;
  showToggleButton?: boolean;
}

export function FullscreenProvider({ 
  children, 
  showToggleButton = true 
}: FullscreenProviderProps) {
  const {
    showModal,
    isMobile,
    closeModal,
    activateDesktopMode,
    isFullscreen,
    toggleFullscreen,
    hasTriedSilentActivation
  } = useFullscreenModal();

  return (
    <>
      {children}
      
      {/* Botón flotante para alternar pantalla completa (siempre visible en dispositivos móviles) */}
      {showToggleButton && isMobile && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50">
          <Button
            onClick={toggleFullscreen}
            size="sm"
            className="rounded-full shadow-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 w-12 h-12 p-0 border-2 border-white/20 backdrop-blur-sm"
            title={isFullscreen ? "Salir de pantalla completa" : "Activar pantalla completa"}
          >
            {isFullscreen ? (
              <Minimize className="h-5 w-5 text-white" />
            ) : (
              <Maximize className="h-5 w-5 text-white" />
            )}
          </Button>
        </div>
      )}

      {/* Modal de pantalla completa */}
      <FullscreenModal
        isOpen={showModal}
        onClose={closeModal}
        onActivateDesktopMode={activateDesktopMode}
      />
    </>
  );
}