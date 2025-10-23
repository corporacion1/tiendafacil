// src/hooks/use-fullscreen-modal.ts
'use client';

import { useState, useEffect, useCallback } from 'react';

export function useFullscreenModal() {
  const [showModal, setShowModal] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [hasShownModal, setHasShownModal] = useState(false);
  const [hasTriedSilentActivation, setHasTriedSilentActivation] = useState(false);

  // Detectar si es dispositivo móvil
  useEffect(() => {
    const checkIfMobile = () => {
      const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
      const isMobileDevice = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase());
      const isSmallScreen = window.innerWidth <= 768;
      
      return isMobileDevice || isSmallScreen;
    };

    const handleResize = () => {
      setIsMobile(checkIfMobile());
    };

    // Verificar inicialmente
    setIsMobile(checkIfMobile());
    
    // Escuchar cambios de tamaño de ventana
    window.addEventListener('resize', handleResize);
    
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Función para activar pantalla completa silenciosamente
  const activateFullscreenSilently = useCallback(async () => {
    try {
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
      
      console.log('🔄 Pantalla completa activada silenciosamente');
      
      // Marcar que ya se intentó la activación silenciosa
      localStorage.setItem('silent-fullscreen-attempted', 'true');
      setHasTriedSilentActivation(true);
      
      return true;
    } catch (error) {
      console.log('❌ No se pudo activar pantalla completa silenciosamente:', error);
      return false;
    }
  }, []);

  // Manejar el primer click/touch en dispositivos móviles
  useEffect(() => {
    if (!isMobile) return;

    const silentAttempted = localStorage.getItem('silent-fullscreen-attempted');
    if (silentAttempted) {
      setHasTriedSilentActivation(true);
      return;
    }

    const handleFirstInteraction = async (event: Event) => {
      // Solo activar en el primer click/touch
      if (hasTriedSilentActivation) return;

      console.log('🔍 Primer click detectado en dispositivo móvil');
      
      const success = await activateFullscreenSilently();
      
      if (success) {
        // Mostrar un toast sutil indicando que se activó
        const toast = document.createElement('div');
        toast.innerHTML = '📱 Modo pantalla completa activado';
        toast.style.cssText = `
          position: fixed;
          bottom: 20px;
          left: 50%;
          transform: translateX(-50%);
          background: rgba(0, 0, 0, 0.8);
          color: white;
          padding: 8px 16px;
          border-radius: 20px;
          font-size: 14px;
          z-index: 10000;
          pointer-events: none;
        `;
        document.body.appendChild(toast);
        
        // Remover el toast después de 3 segundos
        setTimeout(() => {
          if (document.body.contains(toast)) {
            document.body.removeChild(toast);
          }
        }, 3000);
      }

      // Remover los event listeners después del primer intento
      document.removeEventListener('click', handleFirstInteraction);
      document.removeEventListener('touchstart', handleFirstInteraction);
    };

    // Agregar listeners para el primer click/touch
    document.addEventListener('click', handleFirstInteraction, { once: true });
    document.addEventListener('touchstart', handleFirstInteraction, { once: true });

    return () => {
      document.removeEventListener('click', handleFirstInteraction);
      document.removeEventListener('touchstart', handleFirstInteraction);
    };
  }, [isMobile, hasTriedSilentActivation, activateFullscreenSilently]);

  const openModal = () => {
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
  };

  const activateDesktopMode = () => {
    // Aquí puedes agregar lógica adicional cuando se active el modo escritorio
    console.log('Modo escritorio activado desde modal');
    
    // Opcional: Guardar preferencia del usuario
    localStorage.setItem('desktop-mode-preference', 'true');
  };

  // Función para verificar si está en pantalla completa
  const isFullscreen = () => {
    return !!(
      document.fullscreenElement ||
      (document as any).webkitFullscreenElement ||
      (document as any).mozFullScreenElement ||
      (document as any).msFullscreenElement
    );
  };

  // Función para salir de pantalla completa
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
    } catch (error) {
      console.error('Error al salir de pantalla completa:', error);
    }
  };

  // Función para alternar pantalla completa
  const toggleFullscreen = async () => {
    if (isFullscreen()) {
      await exitFullscreen();
    } else {
      // Solo mostrar modal si ya se intentó la activación silenciosa
      if (hasTriedSilentActivation) {
        setShowModal(true);
      } else {
        // Si no se ha intentado, activar silenciosamente
        await activateFullscreenSilently();
      }
    }
  };

  return {
    showModal,
    isMobile,
    openModal,
    closeModal,
    activateDesktopMode,
    isFullscreen: isFullscreen(),
    exitFullscreen,
    toggleFullscreen,
    hasTriedSilentActivation
  };
}