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
      
      {/* Botón flotante para alternar pantalla completa (solo después del primer intento) */}
      {showToggleButton && isMobile && hasTriedSilentActivation && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50">
          <Button
            onClick={toggleFullscreen}
            size="sm"
            className="rounded-full shadow-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 w-10 h-10 p-0"
          >
            {isFullscreen ? (
              <Minimize className="h-4 w-4" />
            ) : (
              <Maximize className="h-4 w-4" />
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