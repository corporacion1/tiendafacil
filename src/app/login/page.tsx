
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

  const handleGoogleSignIn = async () => {
    if (!auth) return;
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      toast({
        title: 'Inicio de Sesión Exitoso',
        description: '¡Bienvenido de nuevo!',
      });
      router.replace('/dashboard');
    } catch (error: any) {
      console.error("Error during Google sign-in:", error);
      toast({
        variant: 'destructive',
        title: 'Error de Autenticación',
        description: error.code === 'auth/operation-not-allowed'
          ? 'El inicio de sesión con Google no está habilitado. Actívalo en la consola de Firebase.'
          : 'Ocurrió un error inesperado al intentar ingresar con Google.',
      });
    }
  };

  const handleEmailAuth = async () => {
    if (!auth || !email || !password) {
        toast({
            variant: "destructive",
            title: "Campos incompletos",
            description: "Por favor, ingresa tu correo y contraseña."
        });
        return;
    }

    try {
        if (isSignUp) {
            await createUserWithEmailAndPassword(auth, email, password);
            toast({
                title: '¡Cuenta Creada!',
                description: 'Hemos creado tu cuenta. ¡Bienvenido!',
            });
        } else {
            await signInWithEmailAndPassword(auth, email, password);
            toast({
                title: 'Inicio de Sesión Exitoso',
                description: '¡Bienvenido de nuevo!',
            });
        }
        router.replace('/dashboard');
    } catch (error: any) {
        console.error(`Error during email ${isSignUp ? 'sign-up' : 'sign-in'}:`, error);
        
        let description = 'Ocurrió un error inesperado. Por favor, intenta de nuevo.';
        switch(error.code) {
            case 'auth/email-already-in-use':
                description = 'Este correo electrónico ya está registrado. Intenta iniciar sesión.';
                break;
            case 'auth/user-not-found':
            case 'auth/wrong-password':
            case 'auth/invalid-credential':
                description = 'El correo electrónico o la contraseña son incorrectos.';
                break;
            case 'auth/weak-password':
                description = 'La contraseña es demasiado débil. Debe tener al menos 6 caracteres.';
                break;
            case 'auth/invalid-email':
                description = 'El formato del correo electrónico no es válido.';
                break;
        }

        toast({
            variant: 'destructive',
            title: isSignUp ? 'Error al Registrarse' : 'Error de Autenticación',
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
            <Button onClick={handleEmailAuth} className="w-full">
                {isSignUp ? 'Crear Cuenta' : 'Ingresar'}
            </Button>
            
            <Separator className="my-2" />

            <Button variant="outline" onClick={handleGoogleSignIn} className="w-full">
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
