// src/components/ui/responsive-dialog.tsx
'use client';

import * as React from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { cn } from '@/lib/utils';

interface ResponsiveDialogProps extends React.ComponentProps<typeof DialogPrimitive.Root> {
  children: React.ReactNode;
  className?: string;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl';
  fullHeight?: boolean;
}

const maxWidthClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md', 
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  '3xl': 'max-w-3xl',
  '4xl': 'max-w-4xl'
};

export function ResponsiveDialog({ 
  children, 
  className,
  maxWidth = 'md',
  fullHeight = false,
  ...props 
}: ResponsiveDialogProps) {
  return (
    <Dialog {...props}>
      <DialogContent 
        className={cn(
          // Base responsive classes
          'w-[95vw]',
          maxWidthClasses[maxWidth],
          fullHeight ? 'h-[90vh]' : 'max-h-[90vh]',
          'overflow-y-auto invisible-scroll',
          'mx-auto my-4',
          // Default styling
          'rounded-2xl border-0 shadow-2xl',
          className
        )}
      >
        {children}
      </DialogContent>
    </Dialog>
  );
}

// Hook para detectar si es dispositivo móvil
export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const checkDevice = () => {
      const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
      const isMobileDevice = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase());
      const isSmallScreen = window.innerWidth <= 768;
      
      setIsMobile(isMobileDevice || isSmallScreen);
    };

    checkDevice();
    window.addEventListener('resize', checkDevice);
    
    return () => window.removeEventListener('resize', checkDevice);
  }, []);

  return isMobile;
}

// Componente para contenido scrolleable en modales
export function ScrollableModalContent({ 
  children, 
  className 
}: { 
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn(
      'overflow-y-auto invisible-scroll',
      'modal-scroll touch-modal',
      className
    )}>
      {children}
    </div>
  );
}