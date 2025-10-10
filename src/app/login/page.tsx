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
import { useAuth, useFirestore, useUser } from '@/firebase';
import type { UserProfile, Settings } from '@/lib/types';

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user, isUserLoading: isAuthLoading } = useUser();
  const auth = useAuth();
  const firestore = useFirestore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  
  const [loadingMessage, setLoadingMessage] = useState<string | null>('Verificando sesión...');

  const createUserProfile = async (firebaseUser: FirebaseUser) => {
    if (!firestore) return;
    const userRef = doc(firestore, 'users', firebaseUser.uid);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      const newUserProfile: Omit<UserProfile, 'createdAt'> = {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName || email.split('@')[0],
        photoURL: firebaseUser.photoURL,
        role: 'user',
        status: 'active',
        storeRequest: false,
      };
      await setDoc(userRef, { ...newUserProfile, createdAt: serverTimestamp() });
    }
  };

  const loadDataAndRedirect = async (firebaseUser: FirebaseUser) => {
    if (!firestore) {
      setLoadingMessage('Error: No se pudo conectar a la base de datos.');
      toast({ variant: 'destructive', title: 'Error de Conexión' });
      return;
    }

    setLoadingMessage('Cargando perfil de usuario...');
    const userRef = doc(firestore, 'users', firebaseUser.uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      setLoadingMessage('Error: Perfil de usuario no encontrado.');
      toast({ variant: 'destructive', title: 'Error de Perfil' });
      // Log out the user if their profile doesn't exist
      await auth?.signOut();
      setLoadingMessage(null);
      return;
    }

    const userProfile = userSnap.data() as UserProfile;
    
    // For regular users, no need to load store data, just redirect to a safe page.
    if (userProfile.role === 'user') {
        setLoadingMessage('Redirigiendo...');
        router.replace('/catalog');
        return;
    }

    if (!userProfile.storeId) {
       setLoadingMessage('Error: Usuario no tiene tienda asignada.');
       toast({ variant: 'destructive', title: 'Error de Configuración', description: 'Este usuario administrativo no tiene una tienda asignada.' });
       await auth?.signOut();
       setLoadingMessage(null);
       return;
    }
    
    setLoadingMessage('Cargando datos de la tienda...');
    const storeRef = doc(firestore, 'stores', userProfile.storeId);
    const storeSnap = await getDoc(storeRef);

    if (!storeSnap.exists()) {
        setLoadingMessage(`Error: No se encontró la configuración de la tienda ${userProfile.storeId}.`);
        toast({ variant: 'destructive', title: 'Error de Tienda', description: `No se pudo cargar la configuración para la tienda asignada.` });
        await auth?.signOut();
        setLoadingMessage(null);
        return;
    }
    
    setLoadingMessage('¡Todo listo! Redirigiendo...');
    router.replace('/dashboard');
  };

  // Effect to handle user state changes (initial load, login, logout)
  useEffect(() => {
    if (isAuthLoading) {
      setLoadingMessage('Verificando sesión...');
      return;
    }
    if (user) {
      loadDataAndRedirect(user);
    } else {
      setLoadingMessage(null); // No user, stop loading, show login form
    }
  }, [user, isAuthLoading]);

  const handleAuthAction = async (authPromise: Promise<any>) => {
    setLoadingMessage('Procesando...');
    try {
      const userCredential = await authPromise;
      if (isSignUp && userCredential?.user) {
        await createUserProfile(userCredential.user);
      }
      // The useEffect will catch the user change and trigger loadDataAndRedirect
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
      setLoadingMessage(null); // Show form again on error
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth || !firestore) return;
    const promise = isSignUp
      ? createUserWithEmailAndPassword(auth, email, password)
      : signInWithEmailAndPassword(auth, email, password);
    handleAuthAction(promise);
  };

  const handleGoogleSignIn = () => {
    if (!auth) return;
    setLoadingMessage('Redirigiendo a Google...');
    const provider = new GoogleAuthProvider();
    // We don't await this; the redirect will take over.
    // The redirect result is handled by the useEffect on initial load.
    signInWithRedirect(auth, provider);
  };

  // Handle redirect result from Google sign-in
  useEffect(() => {
    const processRedirect = async () => {
      if (!auth || !firestore) return;
      try {
        const result = await getRedirectResult(auth);
        if (result && result.user) {
          await createUserProfile(result.user);
          // Don't redirect here. Let the main `useEffect` handle it.
        }
      } catch (error) {
        console.error("Google sign-in redirect error:", error);
        toast({
          variant: 'destructive',
          title: 'Error con Google',
          description: 'No se pudo completar el inicio de sesión con Google.',
        });
        setLoadingMessage(null); // Stop loading on error
      }
    };
    if (!user) {
        processRedirect();
    }
  }, [auth, firestore, user]);

  if (loadingMessage) {
    return (
      <div className="flex min-h-screen w-full flex-col items-center justify-center bg-background gap-4">
        <Logo className="w-64 h-20" />
        <p className="text-muted-foreground animate-pulse">{loadingMessage}</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-muted/40">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <Logo className="w-64 h-20 mx-auto mb-4" />
          <CardTitle className="text-2xl">
            {isSignUp ? 'Crea tu Cuenta' : 'Bienvenido'}
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
              />
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
