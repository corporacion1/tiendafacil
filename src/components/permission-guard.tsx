'use client';

import { usePermissions, Permission } from '@/hooks/use-permissions';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Lock, LogIn } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface PermissionGuardProps {
  children: React.ReactNode;
  permission?: Permission;
  requireLogin?: boolean;
  fallback?: React.ReactNode;
  showLoginPrompt?: boolean;
}

export function PermissionGuard({ 
  children, 
  permission, 
  requireLogin = false,
  fallback,
  showLoginPrompt = false
}: PermissionGuardProps) {
  const { hasPermission, isLoggedIn } = usePermissions();
  const { user } = useAuth();
  const router = useRouter();

  // Si requiere login y no está logueado
  if (requireLogin && !isLoggedIn) {
    if (showLoginPrompt) {
      return (
        <div className="flex flex-col items-center gap-2 p-4 border border-dashed border-muted-foreground/25 rounded-lg bg-muted/10">
          <Lock className="h-8 w-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground text-center">
            Debes iniciar sesión para acceder a esta función
          </p>
          <Button 
            size="sm" 
            onClick={() => router.push('/catalog')}
            className="mt-2"
          >
            <LogIn className="h-4 w-4 mr-2" />
            Iniciar Sesión
          </Button>
        </div>
      );
    }
    return fallback || null;
  }

  // Si requiere un permiso específico y no lo tiene
  if (permission && !hasPermission(permission)) {
    if (fallback) {
      return <>{fallback}</>;
    }
    return null;
  }

  return <>{children}</>;
}

// Componente específico para el botón de agregar pedido
export function AddOrderGuard({ children }: { children: React.ReactNode }) {
  // Simplemente renderizar los children sin restricciones
  // La lógica de autenticación se maneja en los handlers individuales
  return <>{children}</>;
}