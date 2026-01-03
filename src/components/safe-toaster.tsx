"use client"

import React from 'react';
import { useToast } from "@/hooks/use-toast"
import { toastLogger } from "@/utils/toast-logger"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"
import { ErrorBoundary, MinimalErrorFallback } from '@/components/error-boundary';

// Componente Toaster con safeguards adicionales - ESTABILIZADO
function SafeToaster() {
  const { toasts } = useToast()

  // Log renders para debugging - THROTTLED para evitar spam
  const renderCountRef = React.useRef(0);
  React.useEffect(() => {
    renderCountRef.current += 1;
    
    // Solo log cada 5 renders para evitar spam
    if (renderCountRef.current % 5 === 0) {
      toastLogger.log({
        type: 'RENDER',
        contextData: { 
          toastCount: toasts.length,
          renderCount: renderCountRef.current
        }
      });
    }
  }, [toasts.length]);

  // Limitar el número de toasts para prevenir overflow - MEMOIZADO ESTABLE
  const limitedToasts = React.useMemo(() => {
    return toasts.slice(0, 5); // Máximo 5 toasts
  }, [toasts]);

  // Prevenir re-renders innecesarios
  const memoizedToasts = React.useMemo(() => {
    return limitedToasts.map(function ({ id, title, description, action, ...props }) {
      return (
        <Toast key={id} {...props}>
          <div className="grid gap-1">
            {title && <ToastTitle>{title}</ToastTitle>}
            {description && (
              <ToastDescription>{description}</ToastDescription>
            )}
          </div>
          {action}
          <ToastClose />
        </Toast>
      );
    });
  }, [limitedToasts]);

  return (
    <ToastProvider>
      {memoizedToasts}
      <ToastViewport />
    </ToastProvider>
  )
}

// Componente principal con error boundary
export function Toaster() {
  return (
    <ErrorBoundary 
      context="Sistema de Toast"
      fallback={() => (
        <div className="fixed bottom-4 right-4 p-2 bg-destructive/10 text-destructive text-xs rounded">
          Error en notificaciones
        </div>
      )}
    >
      <SafeToaster />
    </ErrorBoundary>
  );
}