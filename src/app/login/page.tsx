
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FcGoogle } from 'react-icons/fc';
import { 
  signInWithRedirect, 
  getRedirectResult,
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  type User as FirebaseUser
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp, getDoc } from 'firebase/firestore';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Logo } from '@/components/logo';
import { useAuth, useFirestore } from '@/firebase';
import type { UserProfile } from '@/lib/types';
import { useSettings } from '@/contexts/settings-context';

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const auth = useAuth();
  const firestore = useFirestore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [isLoading, setIsLoading] = useState(true); // Start as true to handle redirect check

  /**
   * Creates or updates a user profile in Firestore.
   * Checks if a user already exists before writing to prevent data duplication.
   * If user exists, it merges new data (like photoURL). Otherwise, creates a new profile.
   */
  const createUserProfile = async (firebaseUser: FirebaseUser) => {
    if (!firestore) return;
    const userRef = doc(firestore, 'users', firebaseUser.uid);

    const userDoc = await getDoc(userRef);

    if (userDoc.exists()) {
      // User already exists, update their profile with potentially new info from provider
      await setDoc(userRef, {
        displayName: firebaseUser.displayName || userDoc.data()?.displayName,
        photoURL: firebaseUser.photoURL,
        email: firebaseUser.email, // Keep email updated
      }, { merge: true });
    } else {
      // User does not exist, create a new profile
      const newUserProfile: Omit<UserProfile, 'createdAt'> = {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName || email.split('@')[0],
        photoURL: firebaseUser.photoURL,
        role: 'user', // New users always start with 'user' role
        status: 'active',
        storeRequest: false,
      };
      await setDoc(userRef, { ...newUserProfile, createdAt: serverTimestamp() });
    }
  };


  // Handle redirect result from Google sign-in
  useEffect(() => {
    const processRedirect = async () => {
        if (!auth || !firestore) return;
        
        try {
            const result = await getRedirectResult(auth);
            if (result && result.user) {
                await createUserProfile(result.user);
                toast({ title: '¡Bienvenido!', description: 'Has iniciado sesión con Google.' });
                router.replace('/dashboard');
            }
        } catch (error) {
            console.error("Google sign-in redirect error:", error);
            toast({
                variant: 'destructive',
                title: 'Error con Google',
                description: 'No se pudo completar el inicio de sesión con Google.',
            });
        } finally {
            setIsLoading(false);
        }
    };

    processRedirect();
  }, [auth, firestore, router, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth || !firestore) return;
    setIsLoading(true);

    try {
      if (isSignUp) {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await createUserProfile(userCredential.user);
        toast({ title: '¡Registro Exitoso!', description: 'Serás redirigido en breve.' });
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        toast({ title: 'Iniciando Sesión...', description: '¡Bienvenido de nuevo!' });
      }
      router.replace('/dashboard');
    } catch (error: any) {
      console.error(error);
      const errorCode = error.code;
      let message = "Ocurrió un error. Por favor, intenta de nuevo.";
      if (errorCode === 'auth/wrong-password' || errorCode === 'auth/invalid-credential') {
          message = 'La contraseña o el correo son incorrectos.';
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
    if (!auth) return;
    setIsLoading(true);
    const provider = new GoogleAuthProvider();
    try {
        await signInWithRedirect(auth, provider);
    } catch (error) {
        console.error(error);
        toast({
            variant: 'destructive',
            title: 'Error con Google',
            description: 'No se pudo iniciar el proceso de autenticación con Google.',
        });
        setIsLoading(false);
    }
  };
  
  // Render a loading state while checking for redirect result.
  if (isLoading) {
    return (
       <div className="flex min-h-screen w-full flex-col items-center justify-center bg-background gap-4">
          <Logo className="w-64 h-20" />
          <p className="text-muted-foreground animate-pulse">Verificando sesión...</p>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-muted/40">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <Logo className="w-64 h-20 mx-auto mb-4" />
          <CardTitle className="text-2xl">
            {isSignUp ? 'Crea tu Cuenta' : `Bienvenido`}
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
