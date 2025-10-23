// src/components/fullscreen-modal.tsx
'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Monitor, Smartphone, Maximize, X } from 'lucide-react';

interface FullscreenModalProps {
  isOpen: boolean;
  onClose: () => void;
  onActivateDesktopMode: () => void;
}

export function FullscreenModal({
  isOpen,
  onClose,
  onActivateDesktopMode
}: FullscreenModalProps) {
  const [isFullscreenSupported, setIsFullscreenSupported] = useState(false);

  useEffect(() => {
    // Verificar si el navegador soporta fullscreen
    const supportsFullscreen = !!(
      document.documentElement.requestFullscreen ||
      (document.documentElement as any).webkitRequestFullscreen ||
      (document.documentElement as any).mozRequestFullScreen ||
      (document.documentElement as any).msRequestFullscreen
    );
    setIsFullscreenSupported(supportsFullscreen);
  }, []);

  const handleActivateDesktopMode = async () => {
    try {
      // Intentar activar pantalla completa
      const docElement = document.documentElement;
      
      if (docElement.requestFullscreen) {
        await docElement.requestFullscreen();
      } else if ((docElement as any).webkitRequestFullscreen) {
        await (docElement as any).webkitRequestFullscreen();
      } else if ((docElement as any).mozRequestFullScreen) {
        await (docElement as any).mozRequestFullScreen();
      } else if ((docElement as any).msRequestFullscreen) {
        await (docElement as any).msRequestFullscreen();
      }
      
      // Llamar al callback para cualquier lógica adicional
      onActivateDesktopMode();
      
      // Cerrar la modal
      onClose();
    } catch (error) {
      console.error('Error al activar pantalla completa:', error);
      // Aún así ejecutar el callback y cerrar modal
      onActivateDesktopMode();
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-[400px] max-h-[90vh] overflow-y-auto invisible-scroll rounded-2xl border-0 shadow-2xl bg-gradient-to-br from-background via-background to-blue-50/30 mx-auto my-4">
        <DialogHeader className="text-center pb-4">
          <div className="mx-auto mb-4 p-3 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-full">
            <Monitor className="h-8 w-8 text-blue-600" />
          </div>
          <DialogTitle className="text-xl font-bold text-foreground">
            Modo Escritorio
          </DialogTitle>
          <DialogDescription className="text-muted-foreground mt-2 text-center">
            ¿Deseas volver a activar el modo escritorio para una mejor experiencia en pantalla completa?
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          {/* Comparación visual */}
          <div className="grid grid-cols-2 gap-4">
            {/* Modo móvil */}
            <div className="text-center p-3 bg-muted/30 rounded-xl">
              <Smartphone className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm font-medium text-muted-foreground">Modo Actual</p>
              <p className="text-xs text-muted-foreground mt-1">Vista móvil estándar</p>
            </div>
            
            {/* Modo escritorio */}
            <div className="text-center p-3 bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl border border-blue-200/50">
              <Maximize className="h-8 w-8 mx-auto mb-2 text-blue-600" />
              <p className="text-sm font-medium text-blue-700">Modo Escritorio</p>
              <p className="text-xs text-blue-600 mt-1">Pantalla completa</p>
            </div>
          </div>

          {/* Beneficios */}
          <div className="bg-gradient-to-r from-blue-50/50 to-purple-50/50 rounded-xl p-4 border border-blue-200/30">
            <h4 className="text-sm font-semibold text-blue-800 mb-2">Beneficios del Modo Escritorio:</h4>
            <ul className="text-xs text-blue-700 space-y-1">
              <li>• Mayor área de trabajo</li>
              <li>• Mejor visualización de datos</li>
              <li>• Experiencia más inmersiva</li>
              <li>• Oculta la barra del navegador</li>
            </ul>
          </div>

          {!isFullscreenSupported && (
            <div className="bg-amber-50/50 rounded-xl p-3 border border-amber-200/50">
              <p className="text-xs text-amber-700">
                <strong>Nota:</strong> Tu navegador podría no soportar completamente la pantalla completa, pero aún puedes continuar.
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 pt-2">
          <Button 
            variant="outline" 
            onClick={onClose}
            className="flex-1 rounded-xl"
          >
            <X className="h-4 w-4 mr-2" />
            Cancelar
          </Button>
          <Button 
            onClick={handleActivateDesktopMode}
            className="flex-1 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            <Maximize className="h-4 w-4 mr-2" />
            Activar
          </Button>
        </DialogFooter>

        {/* Instrucción adicional */}
        <div className="text-center pt-2 border-t border-border/50">
          <p className="text-xs text-muted-foreground">
            Puedes salir del modo pantalla completa presionando <kbd className="px-1 py-0.5 bg-muted rounded text-xs">Esc</kbd>
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}