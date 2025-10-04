
'use client';

import { useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { FcGoogle } from 'react-icons/fc';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth, useUser } from '@/firebase';
import { useToast } from '@/hooks/use-toast';

export default function LoginPage() {
  const auth = useAuth();
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (!isUserLoading && user) {
      router.replace('/dashboard');
    }
  }, [user, isUserLoading, router]);

  const handleGoogleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      toast({
        title: 'Inicio de Sesión Exitoso',
        description: '¡Bienvenido de nuevo!',
      });
      router.replace('/dashboard');
    } catch (error: any) {
      console.error('Error during Google sign-in:', error);
      toast({
        variant: 'destructive',
        title: 'Error de Autenticación',
        description: error.message || 'No se pudo iniciar sesión con Google. Por favor, intenta de nuevo.',
      });
    }
  };
  
  if (isUserLoading || (!isUserLoading && user)) {
    return (
        <div className="flex min-h-screen w-full items-center justify-center">
            <p>Cargando...</p>
        </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-muted/40">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <Image src="/logo.png" width={80} height={80} alt="TF Logo" className="mx-auto mb-4" />
          <CardTitle className="text-2xl">Bienvenido a Tienda Facil</CardTitle>
          <CardDescription>
            Ingresa con tu cuenta de Google para continuar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleGoogleSignIn} className="w-full" size="lg">
            <FcGoogle className="mr-2 h-5 w-5" />
            Ingresar con Google
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

    