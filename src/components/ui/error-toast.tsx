// src/components/ui/error-toast.tsx
'use client';

import { toast } from '@/hooks/use-toast';
import { AlertCircle, Wifi, Key, Server, User } from 'lucide-react';

interface ErrorToastOptions {
  title?: string;
  description: string;
  errorType?: 'connection' | 'credentials' | 'server' | 'validation' | 'unknown';
  duration?: number;
}

export function showErrorToast({ 
  title = 'Error', 
  description, 
  errorType = 'unknown',
  duration = 5000 
}: ErrorToastOptions) {
  
  const getIcon = () => {
    switch (errorType) {
      case 'connection':
        return <Wifi className="h-4 w-4" />;
      case 'credentials':
        return <Key className="h-4 w-4" />;
      case 'server':
        return <Server className="h-4 w-4" />;
      case 'validation':
        return <User className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getTitle = () => {
    switch (errorType) {
      case 'connection':
        return 'Error de Conexión';
      case 'credentials':
        return 'Credenciales Incorrectas';
      case 'server':
        return 'Error del Servidor';
      case 'validation':
        return 'Datos Inválidos';
      default:
        return title;
    }
  };

  toast({
    variant: 'destructive',
    title: (
      <div className="flex items-center gap-2">
        {getIcon()}
        {getTitle()}
      </div>
    ),
    description,
    duration
  });
}

export function showSuccessToast({ 
  title = 'Éxito', 
  description, 
  duration = 3000 
}: { title?: string; description: string; duration?: number }) {
  toast({
    title,
    description,
    duration
  });
}