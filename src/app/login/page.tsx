
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FcGoogle } from 'react-icons/fc';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider 
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Logo } from '@/components/logo';
import { useAuth, useFirestore, useUser } from '@/firebase';
import type { UserProfile } from '@/lib/types';

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const auth = useAuth();
  const firestore = useFirestore();
  const { user } = useUser();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // If user is already logged in, redirect to dashboard
  useEffect(() => {
    if (user) {
      router.replace('/dashboard');
    }
  }, [user, router]);

  const createUserProfile = async (user: any) => {
    const userRef = doc(firestore, 'users', user.uid);
    const newUserProfile: UserProfile = {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName || email.split('@')[0],
      photoURL: user.photoURL,
      role: 'user', // All new users start with this role
      createdAt: serverTimestamp(),
      storeRequest: false,
    };
    await setDoc(userRef, newUserProfile, { merge: true });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isSignUp) {
        // Handle Sign Up
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await createUserProfile(userCredential.user);
        toast({ title: '¡Registro Exitoso!', description: 'Tu cuenta ha sido creada.' });
      } else {
        // Handle Login
        await signInWithEmailAndPassword(auth, email, password);
        toast({ title: 'Inicio de Sesión Exitoso', description: '¡Bienvenido de nuevo!' });
      }
      router.replace('/dashboard');
    } catch (error: any) {
      console.error(error);
      const errorCode = error.code;
      let message = "Ocurrió un error. Por favor, intenta de nuevo.";
      if (errorCode === 'auth/wrong-password') {
          message = 'La contraseña es incorrecta.';
      } else if (errorCode === 'auth/user-not-found') {
          message = 'No se encontró un usuario con ese correo electrónico.';
      } else if (errorCode === 'auth/email-already-in-use') {
          message = 'Este correo electrónico ya está en uso. Intenta iniciar sesión.';
      } else if (errorCode === 'auth/weak-password') {
          message = 'La contraseña es muy débil. Debe tener al menos 6 caracteres.';
      }
      toast({
        variant: 'destructive',
        title: isSignUp ? 'Error en el Registro' : 'Error al Iniciar Sesión',
        description: message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      // Check if user is new and create a profile if so
      // Firestore security rules might prevent getDoc, so we use setDoc with merge:true
      await createUserProfile(result.user);
      
      toast({ title: 'Inicio de Sesión con Google Exitoso' });
      router.replace('/dashboard');
    } catch (error: any) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Error con Google',
        description: 'No se pudo iniciar sesión con Google.',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-muted/40">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <Logo className="w-64 h-20 mx-auto mb-4" />
          <CardTitle className="text-2xl">
            {isSignUp ? 'Crea tu Cuenta' : 'Bienvenido a Tienda Facil'}
          </CardTitle>
          <CardDescription>
            {isSignUp ? 'Ingresa tus datos para registrarte' : 'Ingresa a tu cuenta para continuar'}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
            <form onSubmit={handleSubmit} className="grid gap-4">
                <div className="grid gap-2">
                    <Label htmlFor="email">Correo Electrónico</Label>
                    <Input 
                      id="email" 
                      type="email" 
                      placeholder="tu@correo.com" 
                      value={email} 
                      onChange={(e) => setEmail(e.target.value)} 
                      required 
                      disabled={isLoading}
                    />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="password">Contraseña</Label>
                    <Input 
                      id="password" 
                      type="password" 
                      placeholder="********" 
                      value={password} 
                      onChange={(e) => setPassword(e.target.value)} 
                      required 
                      disabled={isLoading}
                    />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? 'Procesando...' : (isSignUp ? 'Crear Cuenta' : 'Ingresar')}
                </Button>
            </form>
            
            <Separator className="my-2" />

            <Button variant="outline" onClick={handleGoogleSignIn} className="w-full" disabled={isLoading}>
                <FcGoogle className="mr-2 h-5 w-5" />
                Ingresar con Google
            </Button>

             <Button variant="link" size="sm" className="w-full" onClick={() => setIsSignUp(!isSignUp)} disabled={isLoading}>
                {isSignUp ? '¿Ya tienes una cuenta? Inicia Sesión' : '¿No tienes cuenta? Regístrate'}
            </Button>
        </CardContent>
      </Card>
    </div>
  );
}
