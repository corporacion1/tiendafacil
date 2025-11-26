'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { usePermissions } from '@/hooks/use-permissions';
import { useToast } from '@/hooks/use-toast';
import { AlertCircle, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface RouteGuardProps {
  children: React.ReactNode;
  requiredPermission?: string;
  fallbackRoute?: string;
}

export function RouteGuard({ 
  children, 
  requiredPermission, 
  fallbackRoute = '/catalog' 
}: RouteGuardProps) {
  const { canAccess, isLoggedIn, userRole } = usePermissions();
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();

  useEffect(() => {
    // Verificar si el usuario puede acceder a la ruta actual
    if (!canAccess(pathname)) {
      // Si es una ruta que requiere login y no está logueado
      if (!isLoggedIn && (pathname !== '/catalog' && pathname !== '/login' && pathname !== '/register')) {
        toast({
          variant: "destructive",
          title: "Acceso restringido",
          description: "Debes iniciar sesión para acceder a esta página.",
        });
        router.push('/catalog');
        return;
      }
      
      // Si está logueado pero no tiene permisos
      if (isLoggedIn && pathname !== '/catalog') {
        toast({
          variant: "destructive",
          title: "Sin permisos",
          description: "No tienes permisos para acceder a esta página.",
        });
        router.push(fallbackRoute);
        return;
      }
    }
  }, [pathname, canAccess, isLoggedIn, router, toast, fallbackRoute]);

  // Si no puede acceder a la ruta actual, mostrar mensaje de error
  if (!canAccess(pathname)) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
              <Lock className="h-6 w-6 text-destructive" />
            </div>
            <CardTitle className="text-xl">Acceso Restringido</CardTitle>
            <CardDescription>
              {!isLoggedIn 
                ? "Debes iniciar sesión para acceder a esta página."
                : `Tu rol (${userRole}) no tiene permisos para acceder a esta página.`
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2 rounded-lg bg-muted p-3">
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                {!isLoggedIn 
                  ? "Inicia sesión para acceder a más funciones."
                  : "Contacta al administrador si necesitas más permisos."
                }
              </p>
            </div>
            <div className="flex gap-2">
              {!isLoggedIn ? (
                <>
                  <Button 
                    onClick={() => router.push('/catalog')} 
                    className="flex-1"
                  >
                    Iniciar Sesión
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => router.push('/catalog')} 
                    className="flex-1"
                  >
                    Ver Catálogo
                  </Button>
                </>
              ) : (
                <Button 
                  onClick={() => router.push(fallbackRoute)} 
                  className="w-full"
                >
                  Ir al Catálogo
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}