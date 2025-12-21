// src/components/fullscreen-provider.tsx
'use client';

import { usePathname } from 'next/navigation';
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
  const pathname = usePathname();
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

      {/* Botón flotante para alternar pantalla completa (visible en todos los dispositivos) */}
      {showToggleButton && (
        <div className="fixed bottom-6 right-6 z-50">
          <Button
            onClick={toggleFullscreen}
            size="icon"
            className="rounded-full shadow-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 w-14 h-14 p-0 border-2 border-white/20 backdrop-blur-sm transition-all duration-300 hover:scale-105"
            title={isFullscreen ? "Salir de pantalla completa" : "Activar pantalla completa"}
          >
            {isFullscreen ? (
              <Minimize className="h-5 w-5 text-white" />
            ) : (
              <Maximize className="h-5 w-5 text-white" />
            )}
          </Button>
        </div>
      )
      }

      {/* Modal de pantalla completa */}
      <FullscreenModal
        isOpen={showModal}
        onClose={closeModal}
        onActivateDesktopMode={activateDesktopMode}
      />
    </>
  );
}