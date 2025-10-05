
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
import { Logo } from '@/components/logo';

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

  const handleAuthError = (error: any, providerName: string) => {
    console.error(`Error during ${providerName} auth:`, error);
    let description = 'Ocurrió un error inesperado. Por favor, intenta de nuevo.';

    switch (error.code) {
      case 'auth/operation-not-allowed':
        description = `El inicio de sesión con ${providerName} no está habilitado. Ve a la Consola de Firebase -> Authentication -> Sign-in method y actívalo.`;
        break;
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
      title: 'Error de Autenticación',
      description: description,
    });
  };

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
      handleAuthError(error, "Google");
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
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
        handleAuthError(error, isSignUp ? "Email/Contraseña (Registro)" : "Email/Contraseña");
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
          <Logo className="w-64 h-20 mx-auto mb-4" />
          <CardTitle className="text-2xl">Bienvenido a Tienda Facil</CardTitle>
          <CardDescription>
            {isSignUp ? 'Crea una cuenta para continuar' : 'Ingresa a tu cuenta para continuar'}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
            <form onSubmit={handleEmailAuth} className="grid gap-4">
                <div className="grid gap-2">
                    <Label htmlFor="email">Correo Electrónico</Label>
                    <Input id="email" type="email" placeholder="tu@correo.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="password">Contraseña</Label>
                    <Input id="password" type="password" placeholder="********" value={password} onChange={(e) => setPassword(e.target.value)} required />
                </div>
                <Button type="submit" className="w-full">
                    {isSignUp ? 'Crear Cuenta' : 'Ingresar'}
                </Button>
            </form>
            
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
