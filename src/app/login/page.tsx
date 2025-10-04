'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { FcGoogle } from 'react-icons/fc';
import { GoogleAuthProvider, signInWithPopup, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth, useUser } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';

export default function LoginPage() {
  const auth = useAuth();
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const { toast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);

  useEffect(() => {
    if (!isUserLoading && user) {
      router.replace('/dashboard');
    }
  }, [user, isUserLoading, router]);
  
  const handleAuthAction = async (action: 'google' | 'email') => {
    if (!auth) return;
    
    try {
      if (action === 'google') {
        const provider = new GoogleAuthProvider();
        await signInWithPopup(auth, provider);
      } else {
        if (isSignUp) {
          await createUserWithEmailAndPassword(auth, email, password);
        } else {
          await signInWithEmailAndPassword(auth, email, password);
        }
      }
      toast({
        title: 'Inicio de Sesión Exitoso',
        description: '¡Bienvenido de nuevo!',
      });
      router.replace('/dashboard');
    } catch (error: any) {
       console.error(`Error during ${action} sign-in:`, error);
      
      let description = 'Ocurrió un error inesperado. Por favor, intenta de nuevo.';
      if (error.code) {
        switch(error.code) {
          case 'auth/operation-not-allowed':
            description = 'El inicio de sesión con Google no está habilitado en la configuración de Firebase. Por favor, actívalo en la consola.';
            break;
          case 'auth/email-already-in-use':
            description = 'Este correo electrónico ya está registrado. Intenta iniciar sesión.';
            break;
          case 'auth/wrong-password':
          case 'auth/user-not-found':
            description = 'El correo electrónico o la contraseña son incorrectos.';
            break;
          case 'auth/weak-password':
            description = 'La contraseña es demasiado débil. Debe tener al menos 6 caracteres.';
            break;
          default:
            description = error.message;
        }
      }

      toast({
        variant: 'destructive',
        title: 'Error de Autenticación',
        description: description,
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
            {isSignUp ? 'Crea una cuenta para continuar' : 'Ingresa a tu cuenta para continuar'}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
            <div className="grid gap-2">
                <Label htmlFor="email">Correo Electrónico</Label>
                <Input id="email" type="email" placeholder="tu@correo.com" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="grid gap-2">
                <Label htmlFor="password">Contraseña</Label>
                <Input id="password" type="password" placeholder="********" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <Button onClick={() => handleAuthAction('email')} className="w-full">
                {isSignUp ? 'Crear Cuenta' : 'Ingresar'}
            </Button>
            
            <Separator className="my-2" />

            <Button variant="outline" onClick={() => handleAuthAction('google')} className="w-full">
                <FcGoogle className="mr-2 h-5 w-5" />
                Ingresar con Google
            </Button>

            <Button variant="link" size="sm" className="w-full" onClick={() => setIsSignUp(!isSignUp)}>
                {isSignUp ? '¿Ya tienes una cuenta? Inicia Sesión' : '¿No tienes cuenta? Regístrate'}
            </Button>
        </CardContent>
      </Card>
    </div>
  );
}
