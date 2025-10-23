'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, Home, LogOut, Store } from 'lucide-react';

export default function UnauthorizedPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, logout } = useAuth();
  const [reason, setReason] = useState<string>('');

  useEffect(() => {
    const reasonParam = searchParams.get('reason');
    setReason(reasonParam || 'unknown');
  }, [searchParams]);

  const getErrorMessage = () => {
    switch (reason) {
      case 'no_store_assigned':
        return {
          title: 'Sin tienda asignada',
          description: 'Tu cuenta no tiene una tienda asignada. Contacta al administrador del sistema para resolver este problema.',
        };
      case 'store_mismatch':
        return {
          title: 'Acceso a tienda no autorizado',
          description: 'Estás intentando acceder a una tienda que no corresponde a tu cuenta. Solo puedes acceder a los datos de tu tienda asignada.',
        };
      default:
        return {
          title: 'Acceso no autorizado',
          description: 'No tienes permisos para acceder a esta página o recurso.',
        };
    }
  };

  const handleGoHome = () => {
    if (user?.role === 'user') {
      router.push('/catalog');
    } else if (user?.role === 'su') {
      router.push('/stores-admin');
    } else {
      // For administrative users, try to go to their appropriate page
      switch (user?.role) {
        case 'admin':
          router.push('/dashboard');
          break;
        case 'seller':
          router.push('/pos');
          break;
        case 'depositary':
          router.push('/inventory');
          break;
        default:
          router.push('/');
      }
    }
  };

  const handleLogout = () => {
    logout();
  };

  const errorInfo = getErrorMessage();

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
            <AlertTriangle className="h-6 w-6 text-red-600" />
          </div>
          <CardTitle className="text-xl font-semibold text-gray-900">
            {errorInfo.title}
          </CardTitle>
          <CardDescription className="text-gray-600">
            {errorInfo.description}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {user && (
            <div className="rounded-lg bg-gray-50 p-3">
              <p className="text-sm text-gray-600">
                <strong>Usuario:</strong> {user.email}
              </p>
              <p className="text-sm text-gray-600">
                <strong>Rol:</strong> {user.role}
              </p>
              {user.storeId && (
                <p className="text-sm text-gray-600">
                  <strong>Tienda asignada:</strong> {user.storeId}
                </p>
              )}
            </div>
          )}

          <div className="flex flex-col gap-2">
            <Button onClick={handleGoHome} className="w-full">
              <Home className="mr-2 h-4 w-4" />
              Ir a página principal
            </Button>
            
            <Button onClick={handleLogout} variant="outline" className="w-full">
              <LogOut className="mr-2 h-4 w-4" />
              Cerrar sesión
            </Button>
          </div>

          {reason === 'no_store_assigned' && (
            <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3">
              <p className="text-sm text-yellow-800">
                <strong>¿Qué hacer?</strong> Contacta al administrador del sistema para que te asigne una tienda.
              </p>
            </div>
          )}

          {reason === 'store_mismatch' && (
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
              <p className="text-sm text-blue-800">
                <strong>Nota:</strong> Solo puedes acceder a los datos de tu tienda asignada por razones de seguridad.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}